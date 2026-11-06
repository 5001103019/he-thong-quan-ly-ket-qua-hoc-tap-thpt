
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
            expectedVersion
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
            expectedVersion > 2147483647
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
                    SELECT lock_status_id, status, version, unlocked_at
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
            // Cot da tung duoc mo khoa phai su dung API /relock.
            // Khong cho phep /lock ghi nham AuditLog LOCK.
            if (
                current &&
                current.status === "UNLOCKED" &&
                current.unlocked_at != null
            ) {
                await transaction.rollback();
                started = false;

                return res.status(409).json({
                    success: false,
                    error: {
                        code: "RELOCK_REQUIRED",
                        message: "Cot da mo khoa, phai su dung API khoa lai"
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

            // Con thieu diem: khong cho khoa.
            if (missingCount > 0) {
                await transaction.rollback();
                started = false;

                return res.status(200).json({
                    success: false,
                    data: {
                        hasMissingScores: true,
                        missingCount,
                        message: "Vui long nhap day du truoc khi khoa."
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

/*
 * Uyen - Mo khoa mot cot diem.
 * POST /api/v1/locks/unlock
 */
router.post(
    "/unlock",
    requireAuth,
    requireRole("KHAO_THI"),
    async (req, res, next) => {
        const {
            academicYearId,
            classId,
            subjectId,
            component,
            expectedVersion,
            reason
        } = req.body || {};

        // Chuan hoa ID, tranh mat do chinh xac BIGINT.
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

        // Giu tuong thich cac cot du lieu cu, khong nhan tu client.
        const requesterId = null;
        const requesterName = null;

        const reasonText = typeof reason === "string"
            ? reason.trim()
            : "";

        // Kiem tra pham vi, cot diem, version va nguoi yeu cau.
        if (
            !isPositiveId(yearId) ||
            !isPositiveId(classKey) ||
            !isPositiveId(subjectKey) ||
            !COMPONENTS.includes(component) ||
            !Number.isInteger(expectedVersion) ||
            expectedVersion < 1 ||
            expectedVersion > 2147483647 ||
            !reasonText
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Thong tin mo khoa khong hop le"
                }
            });
        }

        let transaction = null;
        let started = false;

        try {
            const pool = await connectDatabase();
            transaction = new sql.Transaction(pool);

            await transaction.begin(
                sql.ISOLATION_LEVEL.SERIALIZABLE
            );
            started = true;

            // Hoan tac giao dich khi khong dat dieu kien.
            async function reject(status, code, message) {
                await transaction.rollback();
                started = false;

                return res.status(status).json({
                    success: false,
                    error: { code, message }
                });
            }

            // Dung cung resource voi API khoa va sua diem.
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
                    DECLARE @lockResult INT;

                    EXEC @lockResult = sys.sp_getapplock
                        @Resource = @lockKey,
                        @LockMode = 'Exclusive',
                        @LockOwner = 'Transaction',
                        @LockTimeout = 10000;

                    SELECT @lockResult AS lock_result;
                `);

            if (appLock.recordset[0].lock_result < 0) {
                return await reject(
                    409, "CONFLICT", "Khong the khoa giao dich"
                );
            }

            // Kiem tra nien khoa, lop va mon hoc.
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
                return await reject(
                    404, "NOT_FOUND", "Khong tim thay pham vi mo khoa"
                );
            }

            // Lay dung cot diem va khoa ban ghi trong transaction.
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

            const current = currentResult.recordset[0];

            if (!current || current.status !== "LOCKED") {
                return await reject(
                    409, "CONFLICT", "Cot diem chua duoc khoa"
                );
            }

            if (current.version !== expectedVersion) {
                return await reject(
                    409, "VERSION_CONFLICT",
                    "Phien ban khoa diem da thay doi"
                );
            }

            // Mo khoa va luu nguoi thuc hien, thoi gian, ly do.
            const unlockResult = await new sql.Request(transaction)
                .input("lockId", sql.BigInt, current.lock_status_id)
                .input("expectedVersion", sql.Int, expectedVersion)
                .input("userId", sql.BigInt, req.auth.userId)
                .input("requestedBy", sql.BigInt, requesterId)
                .input("requestedName", sql.NVarChar(150), requesterName)
                .input("reason", sql.NVarChar(sql.MAX), reasonText)
                .query(`
                    UPDATE dbo.lock_status
                    SET status = 'UNLOCKED',
                        unlocked_by = @userId,
                        unlocked_at = SYSDATETIMEOFFSET(),
                        requested_by = @requestedBy,
                        requested_by_name = @requestedName,
                        unlock_reason = @reason,
                        updated_at = SYSDATETIMEOFFSET(),
                        version = version + 1
                    OUTPUT
                        INSERTED.lock_status_id,
                        INSERTED.version,
                        INSERTED.unlocked_at
                    WHERE lock_status_id = @lockId
                      AND status = 'LOCKED'
                      AND version = @expectedVersion
                `);

            if (unlockResult.recordset.length !== 1) {
                throw new Error("Cap nhat mo khoa that bai");
            }

            const unlocked = unlockResult.recordset[0];

            // Ghi AuditLog UNLOCK trong cung transaction.
            const auditResult = await new sql.Request(transaction)
                .input("lockId", sql.BigInt, unlocked.lock_status_id)
                .input("yearId", sql.BigInt, yearId)
                .input("classId", sql.BigInt, classKey)
                .input("subjectId", sql.BigInt, subjectKey)
                .input("component", sql.VarChar(10), component)
                .input("userId", sql.BigInt, req.auth.userId)
                .input("requestedBy", sql.BigInt, requesterId)
                .input("requestedName", sql.NVarChar(150), requesterName)
                .input("reason", sql.NVarChar(sql.MAX), reasonText)
                .query(`
                    INSERT INTO dbo.audit_log (
                        action_type,
                        performed_by,
                        requested_by,
                        requested_by_name,
                        lock_status_id,
                        academic_year_id,
                        class_id,
                        subject_id,
                        component,
                        reason,
                        result,
                        created_at
                    )
                    OUTPUT INSERTED.audit_log_id
                    VALUES (
                        'UNLOCK',
                        @userId,
                        @requestedBy,
                        @requestedName,
                        @lockId,
                        @yearId,
                        @classId,
                        @subjectId,
                        @component,
                        @reason,
                        'SUCCESS',
                        SYSDATETIMEOFFSET()
                    )
                `);

            if (auditResult.recordset.length !== 1) {
                throw new Error("Ghi AuditLog mo khoa that bai");
            }

            // Chi commit khi ca mo khoa va ghi AuditLog thanh cong.
            await transaction.commit();
            started = false;

            return res.status(200).json({
                success: true,
                data: {
                    lockStatusId: String(unlocked.lock_status_id),
                    component,
                    status: "UNLOCKED",
                    version: unlocked.version,
                    unlockedBy: String(req.auth.userId),
                    unlockedAt: unlocked.unlocked_at,
                    reason: reasonText,
                    auditLogId: String(
                        auditResult.recordset[0].audit_log_id
                    )
                }
            });
        } catch (error) {
            if (started) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    // Transaction co the da tu rollback.
                }
            }

            next(error);
        }
    }
);


/*
 * Uyen - Khoa lai cot diem sau khi da mo khoa.
 * POST /api/v1/locks/relock
 */
router.post(
    "/relock",
    requireAuth,
    requireRole("KHAO_THI"),
    async (req, res, next) => {
        const {
            academicYearId,
            classId,
            subjectId,
            component,
            expectedVersion
        } = req.body || {};

        // Chuan hoa ID de ho tro BIGINT.
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
            expectedVersion >= 2147483647
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Thong tin khoa lai khong hop le"
                }
            });
        }

        let transaction = null;
        let started = false;

        try {
            const pool = await connectDatabase();
            transaction = new sql.Transaction(pool);

            await transaction.begin(
                sql.ISOLATION_LEVEL.SERIALIZABLE
            );
            started = true;

            // Rollback khi khong thoa dieu kien nghiep vu.
            async function reject(status, code, message) {
                await transaction.rollback();
                started = false;

                return res.status(status).json({
                    success: false,
                    error: { code, message }
                });
            }

            // Cung resource voi API khoa va API sua diem.
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
                    DECLARE @lockResult INT;

                    EXEC @lockResult = sys.sp_getapplock
                        @Resource = @lockKey,
                        @LockMode = 'Exclusive',
                        @LockOwner = 'Transaction',
                        @LockTimeout = 10000;

                    SELECT @lockResult AS lock_result;
                `);

            if (appLock.recordset[0].lock_result < 0) {
                return await reject(
                    409,
                    "CONFLICT",
                    "Khong the khoa giao dich"
                );
            }

            // Kiem tra pham vi nien khoa, lop va mon.
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
                return await reject(
                    404,
                    "NOT_FOUND",
                    "Khong tim thay pham vi khoa lai"
                );
            }

            // Khoa ban ghi va kiem tra trang thai hien tai.
            const currentResult = await new sql.Request(transaction)
                .input("yearId", sql.BigInt, yearId)
                .input("classId", sql.BigInt, classKey)
                .input("subjectId", sql.BigInt, subjectKey)
                .input("component", sql.VarChar(10), component)
                .query(`
                    SELECT
                        lock_status_id,
                        status,
                        version,
                        unlocked_at
                    FROM dbo.lock_status WITH (UPDLOCK, HOLDLOCK)
                    WHERE academic_year_id = @yearId
                      AND class_id = @classId
                      AND subject_id = @subjectId
                      AND component = @component
                `);

            const current = currentResult.recordset[0];

            if (!current) {
                return await reject(
                    409,
                    "CONFLICT",
                    "Cot diem chua tung duoc khoa"
                );
            }

            if (current.version !== expectedVersion) {
                return await reject(
                    409,
                    "VERSION_CONFLICT",
                    "Phien ban khoa diem da thay doi"
                );
            }

            // Chi khoa lai cot da duoc mo khoa truoc do.
            if (
                current.status !== "UNLOCKED" ||
                current.unlocked_at == null
            ) {
                return await reject(
                    409,
                    "CONFLICT",
                    "Cot diem chua o trang thai cho khoa lai"
                );
            }

            // Kiem tra diem thieu truoc khi khoa lai.
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

            if (missingCount > 0) {
                await transaction.rollback();
                started = false;

                return res.status(200).json({
                    success: false,
                    data: {
                        hasMissingScores: true,
                        missingCount,
                        message: "Vui long nhap day du truoc khi khoa lai."
                    }
                });
            }

            // Khoa lai thu cong, tang version.
            const relockResult = await new sql.Request(transaction)
                .input("lockId", sql.BigInt, current.lock_status_id)
                .input("expectedVersion", sql.Int, expectedVersion)
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
                    WHERE lock_status_id = @lockId
                      AND status = 'UNLOCKED'
                      AND unlocked_at IS NOT NULL
                      AND version = @expectedVersion
                `);

            if (relockResult.recordset.length !== 1) {
                throw new Error("Cap nhat khoa lai that bai");
            }

            const relocked = relockResult.recordset[0];

            // Ghi AuditLog RELOCK trong cung transaction.
            const auditResult = await new sql.Request(transaction)
                .input("lockId", sql.BigInt, relocked.lock_status_id)
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
                    OUTPUT INSERTED.audit_log_id
                    VALUES (
                        'RELOCK',
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

            if (auditResult.recordset.length !== 1) {
                throw new Error("Ghi AuditLog khoa lai that bai");
            }

            // Chi commit khi ca hai thao tac thanh cong.
            await transaction.commit();
            started = false;

            return res.status(200).json({
                success: true,
                data: {
                    lockStatusId: String(relocked.lock_status_id),
                    component,
                    status: "LOCKED",
                    version: relocked.version,
                    lockedBy: String(req.auth.userId),
                    lockedAt: relocked.locked_at,
                    auditLogId: String(
                        auditResult.recordset[0].audit_log_id
                    )
                }
            });
        } catch (error) {
            if (started) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    // Transaction co the da tu rollback.
                }
            }

            next(error);
        }
    }
);

module.exports = router;
