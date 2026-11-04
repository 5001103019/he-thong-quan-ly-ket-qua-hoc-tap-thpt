
"use strict";

// CV3-08: Kiem tra rollback khi ghi AuditLog that bai.
// Dung SQL gia lap, khong ket noi SQL Server that.

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const servicePath = path.resolve(
    __dirname,
    "../src/services/scoreEntryService.js"
);

test("CV3-08: Loi AuditLog phai rollback diem va version", async () => {

    // Du lieu ban dau.
    const saved = {
        scoreValue: 7.5,
        scoreStatus: "SCORED",
        version: 7
    };

    // Theo doi cac thao tac cua transaction.
    const stats = {
        updatedScore: false,
        updatedVersion: false,
        auditFailed: false,
        commits: 0,
        rollbacks: 0
    };

    // Gia lap transaction cua SQL Server.
    class FakeTransaction {
        constructor() {
            this.pending = null;
        }

        async begin() {
            this.pending = { ...saved };
        }

        async commit() {
            stats.commits++;
            Object.assign(saved, this.pending);
            this.pending = null;
        }

        async rollback() {
            stats.rollbacks++;
            this.pending = null;
        }
    }

    // Gia lap cac truy van SQL cua service.
    class FakeRequest {
        constructor(transaction = null) {
            this.transaction = transaction;
            this.params = {};
        }

        input(name, type, value) {
            this.params[name] = value;
            return this;
        }

        async query(queryText) {
            const scope = {
                score_record_id: 1,
                academic_year_id: 1,
                class_id: 1,
                subject_id: 1,
                student_id: 1
            };

            // Lay pham vi ban ghi.
            if (
                queryText.includes("FROM dbo.score_record sr") &&
                !queryText.includes("WITH (UPDLOCK, HOLDLOCK)")
            ) {
                return { recordset: [scope] };
            }

            // Khoa giao dich thanh cong.
            if (queryText.includes("sys.sp_getapplock")) {
                return {
                    recordset: [{ lock_result: 0 }]
                };
            }

            // Nguoi dung co quyen KHAO_THI.
            if (queryText.includes("JOIN dbo.[role]")) {
                return {
                    recordset: [{ user_id: 1 }]
                };
            }

            // Lay version hien tai.
            if (
                queryText.includes("FROM dbo.score_record sr") &&
                queryText.includes("WITH (UPDLOCK, HOLDLOCK)")
            ) {
                return {
                    recordset: [{
                        ...scope,
                        version: saved.version
                    }]
                };
            }

            // Cot diem chua bi khoa.
            if (queryText.includes("FROM dbo.lock_status")) {
                return { recordset: [] };
            }

            // Lay diem CK hien tai.
            if (queryText.includes("FROM dbo.score_component")) {
                return {
                    recordset: [{
                        score_component_id: 10,
                        score_value: saved.scoreValue,
                        score_status: saved.scoreStatus
                    }]
                };
            }

            // Gia lap sua diem trong transaction.
            if (queryText.includes("UPDATE dbo.score_component")) {
                stats.updatedScore = true;

                this.transaction.pending.scoreValue =
                    this.params.value;

                this.transaction.pending.scoreStatus =
                    this.params.status;

                return { recordset: [] };
            }

            // Gia lap tang version trong transaction.
            if (queryText.includes("UPDATE dbo.score_record")) {
                stats.updatedVersion = true;

                this.transaction.pending.version++;

                return {
                    recordset: [{
                        new_version: this.transaction.pending.version
                    }]
                };
            }

            // Co tinh gia lap loi khi ghi AuditLog.
            if (queryText.includes("INSERT INTO dbo.audit_log")) {
                stats.auditFailed = true;

                throw new Error(
                    "GIA_LAP_LOI_GHI_AUDIT_LOG"
                );
            }

            throw new Error(
                "SQL gia lap chua ho tro truy van nay"
            );
        }
    }

    // Gia lap module database.
    const fakeSql = {
        BigInt: "BigInt",
        VarChar: () => "VarChar",
        Decimal: () => "Decimal",
        NVarChar: () => "NVarChar",
        MAX: "MAX",

        ISOLATION_LEVEL: {
            SERIALIZABLE: "SERIALIZABLE"
        },

        Transaction: FakeTransaction,
        Request: FakeRequest
    };

    const fakeDatabase = {
        sql: fakeSql,

        connectDatabase: async () => ({
            request: () => new FakeRequest()
        })
    };

    // Nap service voi database gia lap.
    const originalLoad = Module._load;

    let saveScoreEntry;

    try {
        Module._load = function (name, parent, isMain) {
            if (
                parent &&
                path.resolve(parent.filename) === servicePath
            ) {
                if (name === "../config/database") {
                    return fakeDatabase;
                }

                if (name === "./scoreValidation") {
                    return {
                        validateScoreEntry: () => ({
                            valid: true
                        })
                    };
                }
            }

            return originalLoad.call(
                this,
                name,
                parent,
                isMain
            );
        };

        delete require.cache[servicePath];

        ({ saveScoreEntry } = require(servicePath));

    } finally {
        Module._load = originalLoad;
        delete require.cache[servicePath];
    }

    // Thu sua CK tu 7.50 thanh 7.75.
    // AuditLog se bi gia lap loi.
    await assert.rejects(
        saveScoreEntry({
            scoreRecordId: 1,
            componentType: "CK",
            scoreValue: 7.75,
            scoreStatus: "SCORED",
            expectedVersion: 7,
            performedBy: 1,
            reason: "Kiem thu CV3-08"
        }),
        /GIA_LAP_LOI_GHI_AUDIT_LOG/
    );

    // Xac nhan da den buoc sua diem.
    assert.equal(stats.updatedScore, true);

    // Xac nhan da den buoc tang version.
    assert.equal(stats.updatedVersion, true);

    // Xac nhan da gia lap loi AuditLog.
    assert.equal(stats.auditFailed, true);

    // Bat buoc rollback dung 1 lan.
    assert.equal(stats.rollbacks, 1);

    // Tuyet doi khong duoc commit.
    assert.equal(stats.commits, 0);

    // Du lieu gia lap phai giu nguyen.
    assert.deepEqual(saved, {
        scoreValue: 7.5,
        scoreStatus: "SCORED",
        version: 7
    });
});
