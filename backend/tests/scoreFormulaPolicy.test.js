
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const database = require("../src/config/database");

test("Chon phien ban APPROVED moi nhat", async (t) => {
    let policies = [];
    let sqlQuery = "";

    // Gia lap ket noi database, khong dung SQL Server that.
    t.mock.method(
        database,
        "connectDatabase",
        async () => ({
            request: () => ({
                query: async (queryText) => {
                    sqlQuery = queryText;

                    const approvedOnly =
                        /WHERE\s+approval_status\s*=\s*'APPROVED'/i
                            .test(queryText);

                    const latestFirst =
                        /ORDER\s+BY\s+version\s+DESC/i
                            .test(queryText);

                    const rows = policies
                        .filter(item =>
                            !approvedOnly ||
                            item.approval_status === "APPROVED"
                        )
                        .sort((a, b) =>
                            latestFirst
                                ? b.version - a.version
                                : a.version - b.version
                        );

                    return {
                        recordset: rows.slice(0, 1)
                    };
                }
            })
        })
    );

    // Nap Repository sau khi gia lap ket noi.
    const repositoryPath = require.resolve(
        "../src/repositories/scoreRecordRepository"
    );

    delete require.cache[repositoryPath];

    t.after(() => {
        delete require.cache[repositoryPath];
    });

    const {
        getLatestFormulaPolicy
    } = require(repositoryPath);

    // Truong hop 1: version 1 APPROVED, version 2 PENDING.
    policies = [
        {
            formula_policy_id: 1,
            version: 1,
            approval_status: "APPROVED"
        },
        {
            formula_policy_id: 2,
            version: 2,
            approval_status: "PENDING"
        }
    ];

    const result1 = await getLatestFormulaPolicy();

    assert.match(
        sqlQuery,
        /WHERE\s+approval_status\s*=\s*'APPROVED'/i
    );

    assert.match(
        sqlQuery,
        /ORDER\s+BY\s+version\s+DESC/i
    );

    assert.equal(result1.version, 1);
    assert.equal(result1.approvalStatus, "APPROVED");

    // Truong hop 2: version 2 duoc APPROVED.
    policies[1].approval_status = "APPROVED";

    const result2 = await getLatestFormulaPolicy();

    assert.equal(result2.version, 2);

    // Truong hop 3: Khong co phien ban duoc duyet.
    policies[0].approval_status = "REJECTED";
    policies[1].approval_status = "PENDING";

    const result3 = await getLatestFormulaPolicy();

    assert.equal(result3, null);
});
