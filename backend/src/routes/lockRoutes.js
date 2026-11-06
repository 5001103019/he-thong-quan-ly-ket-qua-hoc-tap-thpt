
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
                        ls.component,
                        ls.status,
                        ls.locked_by,
                        u_lock.username AS locked_by_name,
                        ls.locked_at,
                        ls.unlocked_by,
                        u_unlock.username AS unlocked_by_name,
                        ls.unlocked_at,
                        ls.unlock_reason,
                        ls.version
                    FROM dbo.lock_status ls
                    LEFT JOIN dbo.app_user u_lock
                        ON u_lock.user_id = ls.locked_by
                    LEFT JOIN dbo.app_user u_unlock
                        ON u_unlock.user_id = ls.unlocked_by
                    WHERE ls.academic_year_id = @yearId
                      AND ls.class_id = @classId
                      AND ls.subject_id = @subjectId
                `);

            // Tinh so hoc sinh con thieu diem cho tung thanh phan diem
            const missingStats = await pool.request()
                .input("yearId", sql.BigInt, academicYearId)
                .input("classId", sql.BigInt, classId)
                .input("subjectId", sql.BigInt, subjectId)
                .query(`
                    SELECT
                        comps.component,
                        COUNT_BIG(CASE WHEN sc.score_component_id IS NULL OR sc.score_status = 'NOT_ENTERED' THEN 1 END) AS missing_count
                    FROM (
                        VALUES ('QT1'), ('QT2'), ('QT3'), ('GK'), ('CK')
                    ) AS comps(component)
                    CROSS JOIN dbo.enrollment e
                    LEFT JOIN dbo.score_record sr
                        ON sr.enrollment_id = e.enrollment_id
                       AND sr.subject_id = @subjectId
                    LEFT JOIN dbo.score_component sc
                        ON sc.score_record_id = sr.score_record_id
                       AND sc.component_type = comps.component
                    WHERE e.academic_year_id = @yearId
                      AND e.class_id = @classId
                      AND e.end_date IS NULL
                    GROUP BY comps.component
                `);

            const missingMap = new Map(
                missingStats.recordset.map(item => [
                    item.component,
                    Number(item.missing_count || 0)
                ])
            );

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
                    lockedByName: item ? item.locked_by_name : null,
                    lockedAt: item ? item.locked_at : null,
                    unlockedBy: item && item.unlocked_by != null
                        ? String(item.unlocked_by)
                        : null,
                    unlockedByName: item ? item.unlocked_by_name : null,
                    unlockedAt: item ? item.unlocked_at : null,
                    unlockReason: item ? item.unlock_reason : null,
                    missingCount: missingMap.get(component) || 0,
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
 * API khoa doc lap mot cot diem.
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

/*
 * API truy van danh sach Audit Log.
 * GET /api/v1/locks/audit-logs
 * Ho tro loc theo nien khoa, lop, mon, cot diem, loai thao tac, nguoi thuc hien, thoi gian.
 */
router.get(
    "/audit-logs",
    requireAuth,
    requireRole("KHAO_THI"),
    async (req, res, next) => {
        try {
            const pool = await connectDatabase();
            const request = pool.request();

            const conditions = [];

            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
            const offset = (page - 1) * limit;

            if (req.query.academicYearId && isPositiveId(req.query.academicYearId)) {
                conditions.push("a.academic_year_id = @academicYearId");
                request.input("academicYearId", sql.BigInt, req.query.academicYearId);
            }

            if (req.query.classId && isPositiveId(req.query.classId)) {
                conditions.push("a.class_id = @classId");
                request.input("classId", sql.BigInt, req.query.classId);
            }

            if (req.query.subjectId && isPositiveId(req.query.subjectId)) {
                conditions.push("a.subject_id = @subjectId");
                request.input("subjectId", sql.BigInt, req.query.subjectId);
            }

            if (req.query.component && COMPONENTS.includes(req.query.component)) {
                conditions.push("a.component = @component");
                request.input("component", sql.VarChar(10), req.query.component);
            }

            if (req.query.actionType && typeof req.query.actionType === "string") {
                const actionType = req.query.actionType.trim().toUpperCase();
                const allowedActions = [
                    "LOCK",
                    "UNLOCK",
                    "RELOCK",
                    "SCORE_EDIT",
                    "SCORE_IMPORT"
                ];
                if (allowedActions.includes(actionType)) {
                    conditions.push("a.action_type = @actionType");
                    request.input("actionType", sql.VarChar(50), actionType);
                }
            }

            if (req.query.performedBy) {
                const performedByVal = String(req.query.performedBy).trim();
                if (isPositiveId(performedByVal)) {
                    conditions.push("(a.performed_by = @performedBy OR u.username LIKE @performedByName)");
                    request.input("performedBy", sql.BigInt, performedByVal);
                    request.input("performedByName", sql.NVarChar(50), `%${performedByVal}%`);
                } else if (performedByVal.length > 0) {
                    conditions.push("u.username LIKE @performedByName");
                    request.input("performedByName", sql.NVarChar(50), `%${performedByVal}%`);
                }
            }

            if (req.query.from && typeof req.query.from === "string") {
                const fromDate = new Date(req.query.from);
                if (!isNaN(fromDate.getTime())) {
                    conditions.push("a.created_at >= @fromDate");
                    request.input("fromDate", sql.DateTimeOffset, fromDate);
                }
            }

            if (req.query.to && typeof req.query.to === "string") {
                const toDate = new Date(req.query.to);
                if (!isNaN(toDate.getTime())) {
                    conditions.push("a.created_at <= @toDate");
                    request.input("toDate", sql.DateTimeOffset, toDate);
                }
            }

            const whereClause = conditions.length > 0
                ? "WHERE " + conditions.join(" AND ")
                : "";

            // 1. Dem tong so ban ghi thoa man dieu kien loc
            const countResult = await request.query(`
                SELECT COUNT_BIG(*) AS total
                FROM dbo.audit_log a
                ${whereClause}
            `);

            const totalItems = Number(countResult.recordset[0].total);
            const totalPages = Math.ceil(totalItems / limit) || 1;

            // 2. Lay du lieu phan trang
            request.input("offset", sql.Int, offset);
            request.input("limit", sql.Int, limit);

            const listResult = await request.query(`
                SELECT
                    a.audit_log_id,
                    a.action_type,
                    a.performed_by,
                    u.username AS performed_by_name,
                    a.requested_by,
                    a.requested_by_name,
                    a.academic_year_id,
                    ay.code AS academic_year_code,
                    a.class_id,
                    c.name AS class_name,
                    a.subject_id,
                    s.name AS subject_name,
                    a.component,
                    a.student_id,
                    st.student_code,
                    st.full_name AS student_name,
                    a.score_record_id,
                    a.score_component_id,
                    a.old_value,
                    a.new_value,
                    a.old_score_status,
                    a.new_score_status,
                    a.reason,
                    a.related_log_id,
                    a.result,
                    a.created_at
                FROM dbo.audit_log a
                LEFT JOIN dbo.app_user u
                    ON u.user_id = a.performed_by
                LEFT JOIN dbo.academic_year ay
                    ON ay.academic_year_id = a.academic_year_id
                LEFT JOIN dbo.[class] c
                    ON c.class_id = a.class_id
                LEFT JOIN dbo.subject s
                    ON s.subject_id = a.subject_id
                LEFT JOIN dbo.student st
                    ON st.student_id = a.student_id
                ${whereClause}
                ORDER BY a.audit_log_id DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

            const items = listResult.recordset.map(row => ({
                auditLogId: String(row.audit_log_id),
                actionType: row.action_type,
                performedBy: String(row.performed_by),
                performedByName: row.performed_by_name || String(row.performed_by),
                requestedBy: row.requested_by ? String(row.requested_by) : null,
                requestedByName: row.requested_by_name || null,
                academicYearId: String(row.academic_year_id),
                academicYearCode: row.academic_year_code || null,
                classId: String(row.class_id),
                className: row.class_name || null,
                subjectId: String(row.subject_id),
                subjectName: row.subject_name || null,
                component: row.component || null,
                studentId: row.student_id ? String(row.student_id) : null,
                studentCode: row.student_code || null,
                studentName: row.student_name || null,
                scoreRecordId: row.score_record_id ? String(row.score_record_id) : null,
                scoreComponentId: row.score_component_id ? String(row.score_component_id) : null,
                oldValue: row.old_value != null ? Number(row.old_value) : null,
                newValue: row.new_value != null ? Number(row.new_value) : null,
                oldScoreStatus: row.old_score_status || null,
                newScoreStatus: row.new_score_status || null,
                reason: row.reason || null,
                relatedLogId: row.related_log_id ? String(row.related_log_id) : null,
                result: row.result,
                createdAt: row.created_at
            }));

            return res.status(200).json({
                success: true,
                data: {
                    items,
                    pagination: {
                        page,
                        limit,
                        totalItems,
                        totalPages
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
