
"use strict";

const express = require("express");

const { sql, connectDatabase } = require("../config/database");

const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

const router = express.Router();

const COMPONENTS = ["QT1", "QT2", "QT3", "GK", "CK"];

// Kiem tra ID duong hop le, giu dang chuoi de tranh mat do chinh xac BIGINT.
function isPositiveId(value) {
    return (
        typeof value === "string" &&
        /^[1-9][0-9]*$/.test(value) &&
        (
            value.length < 19 ||
            (value.length === 19 &&
             value <= "9223372036854775807")
        )
    );
}

// GET /api/v1/locks
// Lay trang thai khoa 5 cot diem theo nien khoa, lop va mon.
// Chi can bo Khao thi duoc phep truy cap.
router.get(
    "/",
    requireAuth,
    requireRole("KHAO_THI"),
    async (req, res, next) => {
        try {
            const {
                academicYearId,
                classId,
                subjectId
            } = req.query;

            if (
                !isPositiveId(academicYearId) ||
                !isPositiveId(classId) ||
                !isPositiveId(subjectId)
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Ma nien khoa, lop hoac mon khong hop le"
                    }
                });
            }

            const pool = await connectDatabase();

            // Kiem tra pham vi duoc yeu cau co ton tai.
            const scope = await pool.request()
                .input("yearId", sql.BigInt, academicYearId)
                .input("classId", sql.BigInt, classId)
                .input("subjectId", sql.BigInt, subjectId)
                .query(`
                    SELECT
                        c.class_id
                    FROM dbo.[class] c
                    WHERE c.class_id = @classId
                      AND c.academic_year_id = @yearId
                      AND EXISTS (
                          SELECT 1
                          FROM dbo.subject s
                          WHERE s.subject_id = @subjectId
                      )
                `);

            if (scope.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "NOT_FOUND",
                        message: "Khong tim thay lop, nien khoa hoac mon hoc"
                    }
                });
            }

            // Lay trang thai khoa cua tung thanh phan diem.
            const result = await pool.request()
                .input("yearId", sql.BigInt, academicYearId)
                .input("classId", sql.BigInt, classId)
                .input("subjectId", sql.BigInt, subjectId)
                .query(`
                    SELECT
                        component,
                        status,
                        locked_by,
                        locked_at,
                        version
                    FROM dbo.lock_status
                    WHERE academic_year_id = @yearId
                      AND class_id = @classId
                      AND subject_id = @subjectId
                `);

            // Neu chua co ban ghi khoa, cot diem duoc xem la UNLOCKED.
            const rows = new Map(
                result.recordset.map(item => [
                    item.component,
                    item
                ])
            );

            const components = COMPONENTS.map(component => {
                const item = rows.get(component);

                return {
                    component: component,
                    status: item ? item.status : "UNLOCKED",
                    lockedBy: item && item.locked_by != null
                        ? String(item.locked_by)
                        : null,
                    lockedAt: item ? item.locked_at : null,
                    version: item ? item.version : 1
                };
            });

            return res.status(200).json({
                success: true,
                data: {
                    academicYearId,
                    classId,
                    subjectId,
                    components
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/*
 * CV2 - API khoa doc lap mot cot diem.
 * POST /api/v1/locks/lock
 */
router.post(
    "/lock",
    requireAuth,
    requireRole("KHAO_THI"),
    async (req, res, next) => {
        const {
            academicYearId,
            classId,
            subjectId,
            component,
            expectedVersion,
            confirmed = false
        } = req.body || {};

        // Chuyen ID hop le sang chuoi de giu do chinh xac BIGINT.
        function normalizeId(value) {
            if (typeof value === "string") {
                return value;
            }

            if (Number.isSafeInteger(value)) {
                return String(value);
            }

            return null;
        }

        const yearId = normalizeId(academicYearId);
        const classKey = normalizeId(classId);
        const subjectKey = normalizeId(subjectId);

        // Kiem tra du lieu dau vao.
        if (
            !isPositiveId(yearId) ||
            !isPositiveId(classKey) ||
            !isPositiveId(subjectKey) ||
            !COMPONENTS.includes(component) ||
            !Number.isInteger(expectedVersion) ||
            expectedVersion < 1 ||
            expectedVersion > 2147483647 ||
            typeof confirmed !== "boolean"
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Thong tin khoa diem khong hop le"
                }
            });
        }

        const pool = await connectDatabase();
        const transaction = new sql.Transaction(pool);
        let started = false;

        try {
            await transaction.begin(
                sql.ISOLATION_LEVEL.SERIALIZABLE
            );
            started = true;

            // Su dung cung khoa giao dich voi module diem cua Chau.
            const lockKey = [
                "score",
                yearId,
                classKey,
                subjectKey,
                component
            ].join(":");

            const appLock = await new sql.Request(transaction)
                .input("lockKey", sql.VarChar(255), lockKey)
                .query(`
                    DECLARE @result INT;

                    EXEC @result = sys.sp_getapplock
                        @Resource = @lockKey,
                        @LockMode = 'Exclusive',
                        @LockOwner = 'Transaction',
                        @LockTimeout = 10000;

                    SELECT @result AS lock_result;
                `);

            if (appLock.recordset[0].lock_result < 0) {
                await transaction.rollback();
                started = false;

                return res.status(409).json({
                    success: false,
                    error: {
                        code: "CONFLICT",
                        message: "Khong the khoa giao dich"
                    }
                });
            }

            // Kiem tra lop thuoc nien khoa va mon hoc ton tai.
            const scope = await new sql.Request(transaction)
                .input("yearId", sql.BigInt, yearId)
                .input("classId", sql.BigInt, classKey)
                .input("subjectId", sql.BigInt, subjectKey)
                .query(`
                    SELECT c.class_id
                    FROM dbo.[class] c
                    WHERE c.class_id = @classId
                      AND c.academic_year_id = @yearId
                      AND EXISTS (
                          SELECT 1
                          FROM dbo.subject s
                          WHERE s.subject_id = @subjectId
                      )
                `);

            if (scope.recordset.length === 0) {
                await transaction.rollback();
                started = false;

                return res.status(404).json({
                    success: false,
                    error: {
                        code: "NOT_FOUND",
                        message: "Khong tim thay pham vi khoa diem"
                    }
                });
            }

            // Doc trang thai hien tai va khoa ban ghi khi ton tai.
            const currentResult = await new sql.Request(transaction)
                .input("yearId", sql.BigInt, yearId)
                .input("classId", sql.BigInt, classKey)
                .input("subjectId", sql.BigInt, subjectKey)
                .input("component", sql.VarChar(10), component)
                .query(`
                    SELECT lock_status_id, status, version
                    FROM dbo.lock_status WITH (UPDLOCK, HOLDLOCK)
                    WHERE academic_year_id = @yearId
                      AND class_id = @classId
                      AND subject_id = @subjectId
                      AND component = @component
                `);

            const current = currentResult.recordset[0] || null;
            const currentVersion = current ? current.version : 1;

            if (currentVersion !== expectedVersion) {
                await transaction.rollback();
                started = false;

                return res.status(409).json({
                    success: false,
                    error: {
                        code: "VERSION_CONFLICT",
                        message: "Phien ban khoa diem da thay doi"
                    }
                });
            }

            if (current && current.status === "LOCKED") {
                await transaction.rollback();
                started = false;

                return res.status(409).json({
                    success: false,
                    error: {
                        code: "CONFLICT",
                        message: "Cot diem da duoc khoa"
                    }
                });
            }

            // Dem hoc sinh chua co diem tai thanh phan dang khoa.
            // Chi NOT_ENTERED duoc tinh la thieu.
            // Ban ghi diem chua ton tai cung duoc tinh la chua nhap.
            const missingResult = await new sql.Request(transaction)
                .input("yearId", sql.BigInt, yearId)
                .input("classId", sql.BigInt, classKey)
                .input("subjectId", sql.BigInt, subjectKey)
                .input("component", sql.VarChar(10), component)
                .query(`
                    SELECT COUNT_BIG(*) AS missing_count
                    FROM dbo.enrollment e
                    LEFT JOIN dbo.score_record sr
                        ON sr.enrollment_id = e.enrollment_id
                       AND sr.subject_id = @subjectId
                    LEFT JOIN dbo.score_component sc
                        ON sc.score_record_id = sr.score_record_id
                       AND sc.component_type = @component
                    WHERE e.academic_year_id = @yearId
                      AND e.class_id = @classId
                      AND e.end_date IS NULL
                      AND (
                          sc.score_component_id IS NULL
                          OR sc.score_status = 'NOT_ENTERED'
                      )
                `);

            const missingCount = Number(
                missingResult.recordset[0].missing_count
            );

            // Con thieu diem va chua xac nhan: khong khoa.
            if (missingCount > 0 && !confirmed) {
                await transaction.rollback();
                started = false;

                return res.status(200).json({
                    success: false,
                    requiresConfirmation: true,
                    data: {
                        hasMissingScores: true,
                        missingCount,
                        message: "Con hoc sinh chua co diem. Can xac nhan de khoa."
                    }
                });
            }

            let lockResult;

            if (current) {
                // Da co ban ghi UNLOCKED: cap nhat trang thai.
                lockResult = await new sql.Request(transaction)
                    .input("id", sql.BigInt, current.lock_status_id)
                    .input("userId", sql.BigInt, req.auth.userId)
                    .query(`
                        UPDATE dbo.lock_status
                        SET status = 'LOCKED',
                            locked_by = @userId,
                            locked_at = SYSDATETIMEOFFSET(),
                            updated_at = SYSDATETIMEOFFSET(),
                            version = version + 1
                        OUTPUT
                            INSERTED.lock_status_id,
                            INSERTED.version,
                            INSERTED.locked_at
                        WHERE lock_status_id = @id
                          AND status = 'UNLOCKED'
                    `);
            } else {
                // Chua co ban ghi: tao moi o trang thai LOCKED.
                lockResult = await new sql.Request(transaction)
                    .input("yearId", sql.BigInt, yearId)
                    .input("classId", sql.BigInt, classKey)
                    .input("subjectId", sql.BigInt, subjectKey)
                    .input("component", sql.VarChar(10), component)
                    .input("userId", sql.BigInt, req.auth.userId)
                    .query(`
                        INSERT INTO dbo.lock_status (
                            academic_year_id,
                            class_id,
                            subject_id,
                            component,
                            status,
                            locked_by,
                            locked_at,
                            version
                        )
                        OUTPUT
                            INSERTED.lock_status_id,
                            INSERTED.version,
                            INSERTED.locked_at
                        VALUES (
                            @yearId,
                            @classId,
                            @subjectId,
                            @component,
                            'LOCKED',
                            @userId,
                            SYSDATETIMEOFFSET(),
                            2
                        )
                    `);
            }

            if (lockResult.recordset.length !== 1) {
                throw new Error("Cap nhat trang thai khoa that bai");
            }

            const locked = lockResult.recordset[0];

            // Ghi AuditLog trong cung transaction.
            await new sql.Request(transaction)
                .input("lockId", sql.BigInt, locked.lock_status_id)
                .input("yearId", sql.BigInt, yearId)
                .input("classId", sql.BigInt, classKey)
                .input("subjectId", sql.BigInt, subjectKey)
                .input("component", sql.VarChar(10), component)
                .input("userId", sql.BigInt, req.auth.userId)
                .query(`
                    INSERT INTO dbo.audit_log (
                        action_type,
                        performed_by,
                        lock_status_id,
                        academic_year_id,
                        class_id,
                        subject_id,
                        component,
                        result,
                        created_at
                    )
                    VALUES (
                        'LOCK',
                        @userId,
                        @lockId,
                        @yearId,
                        @classId,
                        @subjectId,
                        @component,
                        'SUCCESS',
                        SYSDATETIMEOFFSET()
                    )
                `);

            await transaction.commit();
            started = false;

            return res.status(200).json({
                success: true,
                data: {
                    lockStatusId: String(locked.lock_status_id),
                    component,
                    status: "LOCKED",
                    version: locked.version,
                    lockedBy: req.auth.userId,
                    lockedAt: locked.locked_at,
                    warning: {
                        hasMissingScores: missingCount > 0,
                        missingCount
                    }
                }
            });
        } catch (error) {
            if (started) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    // Transaction co the da duoc rollback.
                }
            }

            next(error);
        }
    }
);

module.exports = router;
