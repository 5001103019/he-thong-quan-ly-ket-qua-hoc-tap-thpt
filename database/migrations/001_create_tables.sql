
-- ============================================================
-- MIGRATION 001 - CREATE DATABASE TABLES
-- He thong quan ly ket qua hoc tap hoc sinh THPT
-- Microsoft SQL Server
--
-- 12 bang chinh va 1 bang cau hinh cong thuc diem
--
-- Luu y:
-- - Chay migration mot lan tren database da duoc tao.
-- - Khong xoa bang hoac du lieu cu.
-- - Khong su dung ON DELETE CASCADE.
-- - Neu migration that bai, rollback transaction.
-- ============================================================

USE [thpt_grade_management];

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY

    BEGIN TRANSACTION;

    -- ========================================================
    -- 0. KIEM TRA MIGRATION CHUA DUOC CHAY
    -- ========================================================

    IF EXISTS (
        SELECT 1
        FROM sys.tables
        WHERE schema_id = SCHEMA_ID('dbo')
          AND name IN (
              'role',
              'app_user',
              'academic_year',
              'grade',
              'class',
              'student',
              'enrollment',
              'subject',
              'score_record',
              'score_component',
              'lock_status',
              'audit_log',
              'score_formula_policy'
          )
    )
    BEGIN
        THROW 51001,
            'Migration 001: Da ton tai bang nghiep vu. Khong chay lai.',
            1;
    END;

    -- ========================================================
    -- 1. ROLE
    -- ========================================================

    CREATE TABLE dbo.[role] (
        role_id BIGINT IDENTITY(1,1) NOT NULL,

        code VARCHAR(30) NOT NULL,
        name NVARCHAR(100) NOT NULL,

        CONSTRAINT PK_role
            PRIMARY KEY (role_id),

        CONSTRAINT UQ_role_code
            UNIQUE (code),

        CONSTRAINT CK_role_code
            CHECK (
                code IN ('KHAO_THI', 'HOC_SINH')
            ),

        CONSTRAINT CK_role_name
            CHECK (
                LEN(LTRIM(RTRIM(name))) > 0
            )
    );

    -- ========================================================
    -- 2. ACADEMIC_YEAR
    -- ========================================================

    CREATE TABLE dbo.academic_year (
        academic_year_id BIGINT IDENTITY(1,1) NOT NULL,

        code VARCHAR(9) NOT NULL,
        start_year SMALLINT NOT NULL,
        end_year SMALLINT NOT NULL,
        status VARCHAR(20) NOT NULL,

        CONSTRAINT PK_academic_year
            PRIMARY KEY (academic_year_id),

        CONSTRAINT UQ_academic_year_code
            UNIQUE (code),

        CONSTRAINT CK_academic_year_range
            CHECK (
                start_year BETWEEN 1000 AND 9998
                AND end_year = start_year + 1
            ),

        CONSTRAINT CK_academic_year_code
            CHECK (
                code = CONCAT(
                    CONVERT(VARCHAR(4), start_year),
                    '-',
                    CONVERT(VARCHAR(4), end_year)
                )
            ),

        CONSTRAINT CK_academic_year_status
            CHECK (
                status IN (
                    'PLANNED',
                    'ACTIVE',
                    'CLOSED'
                )
            )
    );

    -- ========================================================
    -- 3. GRADE
    -- ========================================================

    CREATE TABLE dbo.grade (
        grade_id SMALLINT IDENTITY(1,1) NOT NULL,

        grade_number SMALLINT NOT NULL,

        CONSTRAINT PK_grade
            PRIMARY KEY (grade_id),

        CONSTRAINT UQ_grade_number
            UNIQUE (grade_number),

        CONSTRAINT CK_grade_number
            CHECK (
                grade_number IN (10, 11, 12)
            )
    );

    -- ========================================================
    -- 4. STUDENT
    -- ========================================================

    CREATE TABLE dbo.student (
        student_id BIGINT IDENTITY(1,1) NOT NULL,

        student_code VARCHAR(30) NOT NULL,
        full_name NVARCHAR(150) NOT NULL,
        date_of_birth DATE NOT NULL,

        status VARCHAR(20) NOT NULL
            CONSTRAINT DF_student_status
            DEFAULT 'ACTIVE',

        created_at DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_student_created_at
            DEFAULT SYSDATETIMEOFFSET(),

        CONSTRAINT PK_student
            PRIMARY KEY (student_id),

        CONSTRAINT UQ_student_code
            UNIQUE (student_code),

        CONSTRAINT CK_student_code
            CHECK (
                LEN(LTRIM(RTRIM(student_code))) > 0
            ),

        CONSTRAINT CK_student_name
            CHECK (
                LEN(LTRIM(RTRIM(full_name))) > 0
            ),

        CONSTRAINT CK_student_status
            CHECK (
                status IN ('ACTIVE', 'INACTIVE')
            )
    );

    -- ========================================================
    -- 5. SUBJECT
    -- ========================================================

    CREATE TABLE dbo.subject (
        subject_id BIGINT IDENTITY(1,1) NOT NULL,

        code VARCHAR(20)
            COLLATE Latin1_General_100_CI_AS NOT NULL,

        name NVARCHAR(100) NOT NULL,

        status VARCHAR(20) NOT NULL
            CONSTRAINT DF_subject_status
            DEFAULT 'ACTIVE',

        created_at DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_subject_created_at
            DEFAULT SYSDATETIMEOFFSET(),

        CONSTRAINT PK_subject
            PRIMARY KEY (subject_id),

        CONSTRAINT UQ_subject_code
            UNIQUE (code),

        CONSTRAINT CK_subject_code
            CHECK (
                LEN(LTRIM(RTRIM(code))) > 0
            ),

        CONSTRAINT CK_subject_name
            CHECK (
                LEN(LTRIM(RTRIM(name))) > 0
            ),

        CONSTRAINT CK_subject_status
            CHECK (
                status IN ('ACTIVE', 'INACTIVE')
            )
    );

    -- ========================================================
    -- 6. CLASS
    -- ========================================================

    CREATE TABLE dbo.[class] (
        class_id BIGINT IDENTITY(1,1) NOT NULL,

        academic_year_id BIGINT NOT NULL,
        grade_id SMALLINT NOT NULL,

        code VARCHAR(20) NOT NULL,
        name NVARCHAR(100) NOT NULL,

        status VARCHAR(20) NOT NULL
            CONSTRAINT DF_class_status
            DEFAULT 'ACTIVE',

        CONSTRAINT PK_class
            PRIMARY KEY (class_id),

        CONSTRAINT UQ_class_year_code
            UNIQUE (academic_year_id, code),

        CONSTRAINT UQ_class_id_year
            UNIQUE (class_id, academic_year_id),

        CONSTRAINT FK_class_academic_year
            FOREIGN KEY (academic_year_id)
            REFERENCES dbo.academic_year(academic_year_id),

        CONSTRAINT FK_class_grade
            FOREIGN KEY (grade_id)
            REFERENCES dbo.grade(grade_id),

        CONSTRAINT CK_class_code
            CHECK (
                LEN(LTRIM(RTRIM(code))) > 0
            ),

        CONSTRAINT CK_class_name
            CHECK (
                LEN(LTRIM(RTRIM(name))) > 0
            ),

        CONSTRAINT CK_class_status
            CHECK (
                status IN ('ACTIVE', 'INACTIVE')
            )
    );

    -- ========================================================
    -- 7. APP_USER
    -- ========================================================

    CREATE TABLE dbo.app_user (
        user_id BIGINT IDENTITY(1,1) NOT NULL,

        username NVARCHAR(50)
            COLLATE Latin1_General_100_CI_AS NOT NULL,

        password_hash VARCHAR(255) NOT NULL,

        role_id BIGINT NOT NULL,
        student_id BIGINT NULL,

        is_active BIT NOT NULL
            CONSTRAINT DF_app_user_active
            DEFAULT 1,

        created_at DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_app_user_created_at
            DEFAULT SYSDATETIMEOFFSET(),

        CONSTRAINT PK_app_user
            PRIMARY KEY (user_id),

        CONSTRAINT UQ_app_user_username
            UNIQUE (username),

        CONSTRAINT FK_app_user_role
            FOREIGN KEY (role_id)
            REFERENCES dbo.[role](role_id),

        CONSTRAINT FK_app_user_student
            FOREIGN KEY (student_id)
            REFERENCES dbo.student(student_id),

        CONSTRAINT CK_app_user_username
            CHECK (
                LEN(LTRIM(RTRIM(username))) > 0
            ),

        CONSTRAINT CK_app_user_password_hash
            CHECK (
                LEN(LTRIM(RTRIM(password_hash))) > 0
            )
    );

    -- Cho phep nhieu tai khoan Khao thi co student_id NULL.
    -- Moi hoc sinh co toi da mot tai khoan.

    CREATE UNIQUE INDEX UX_app_user_student_not_null
    ON dbo.app_user(student_id)
    WHERE student_id IS NOT NULL;

    -- ========================================================
    -- 8. ENROLLMENT
    -- ========================================================

    CREATE TABLE dbo.enrollment (
        enrollment_id BIGINT IDENTITY(1,1) NOT NULL,

        student_id BIGINT NOT NULL,
        class_id BIGINT NOT NULL,
        academic_year_id BIGINT NOT NULL,

        start_date DATE NOT NULL,
        end_date DATE NULL,
        exit_reason VARCHAR(20) NULL,

        created_at DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_enrollment_created_at
            DEFAULT SYSDATETIMEOFFSET(),

        CONSTRAINT PK_enrollment
            PRIMARY KEY (enrollment_id),

        CONSTRAINT FK_enrollment_student
            FOREIGN KEY (student_id)
            REFERENCES dbo.student(student_id),

        CONSTRAINT FK_enrollment_academic_year
            FOREIGN KEY (academic_year_id)
            REFERENCES dbo.academic_year(academic_year_id),

        CONSTRAINT FK_enrollment_class_year
            FOREIGN KEY (class_id, academic_year_id)
            REFERENCES dbo.[class](
                class_id,
                academic_year_id
            ),

        CONSTRAINT CK_enrollment_dates
            CHECK (
                end_date IS NULL
                OR end_date > start_date
            ),

        CONSTRAINT CK_enrollment_exit
            CHECK (
                (
                    end_date IS NULL
                    AND exit_reason IS NULL
                )
                OR
                (
                    end_date IS NOT NULL
                    AND exit_reason IS NOT NULL
                    AND exit_reason IN (
                        'TRANSFER',
                        'COMPLETED',
                        'WITHDRAWN'
                    )
                )
            )
    );

    -- Ngan mot hoc sinh co nhieu Enrollment
    -- chua ket thuc trong cung nien khoa.

    CREATE UNIQUE INDEX UX_enrollment_open_student_year
    ON dbo.enrollment(
        student_id,
        academic_year_id
    )
    WHERE end_date IS NULL;

    -- Chu y:
    -- Chi muc tren khong chan duoc moi truong hop
    -- chong lan giua cac khoang thoi gian lich su.
    --
    -- Backend phai kiem tra khoang [start_date, end_date)
    -- trong transaction co co che khoa phu hop.

    -- ========================================================
    -- 9. SCORE_RECORD
    -- ========================================================

    CREATE TABLE dbo.score_record (
        score_record_id BIGINT IDENTITY(1,1) NOT NULL,

        enrollment_id BIGINT NOT NULL,
        subject_id BIGINT NOT NULL,

        version INT NOT NULL
            CONSTRAINT DF_score_record_version
            DEFAULT 1,

        CONSTRAINT PK_score_record
            PRIMARY KEY (score_record_id),

        CONSTRAINT UQ_score_record_enrollment_subject
            UNIQUE (enrollment_id, subject_id),

        CONSTRAINT FK_score_record_enrollment
            FOREIGN KEY (enrollment_id)
            REFERENCES dbo.enrollment(enrollment_id),

        CONSTRAINT FK_score_record_subject
            FOREIGN KEY (subject_id)
            REFERENCES dbo.subject(subject_id),

        CONSTRAINT CK_score_record_version
            CHECK (version >= 1)
    );

    -- ========================================================
    -- 10. SCORE_COMPONENT
    -- ========================================================

    CREATE TABLE dbo.score_component (
        score_component_id BIGINT IDENTITY(1,1) NOT NULL,

        score_record_id BIGINT NOT NULL,

        component_type VARCHAR(10) NOT NULL,

        score_value DECIMAL(4,2) NULL,

        score_status VARCHAR(15) NOT NULL
            CONSTRAINT DF_score_component_status
            DEFAULT 'NOT_ENTERED',

        CONSTRAINT PK_score_component
            PRIMARY KEY (score_component_id),

        CONSTRAINT UQ_score_component_record_type
            UNIQUE (score_record_id, component_type),

        CONSTRAINT FK_score_component_record
            FOREIGN KEY (score_record_id)
            REFERENCES dbo.score_record(score_record_id),

        CONSTRAINT CK_score_component_type
            CHECK (
                component_type IN (
                    'QT1', 'QT2', 'QT3', 'GK', 'CK'
                )
            ),

        CONSTRAINT CK_score_component_status
            CHECK (
                score_status IN (
                    'NOT_ENTERED',
                    'SCORED',
                    'ABSENT',
                    'EXEMPT'
                )
            ),

        -- Diem tu 0 den 10, NULL la chua co diem.

        CONSTRAINT CK_score_component_range
            CHECK (
                score_value IS NULL
                OR score_value BETWEEN 0 AND 10
            ),

        -- QT1, QT2, QT3 chi nhan diem nguyen.

        CONSTRAINT CK_score_component_qt_integer
            CHECK (
                component_type NOT IN (
                    'QT1', 'QT2', 'QT3'
                )
                OR score_value IS NULL
                OR score_value = FLOOR(score_value)
            ),

        -- GK va CK nhan diem theo buoc 0.25.

        CONSTRAINT CK_score_component_gk_ck_step
            CHECK (
                component_type NOT IN ('GK', 'CK')
                OR score_value IS NULL
                OR score_value * 4 = FLOOR(score_value * 4)
            ),

        -- Co diem thi status phai la SCORED.
        -- Vang, mien, chua nhap thi score_value = NULL.

        CONSTRAINT CK_score_component_value_status
            CHECK (
                (
                    score_status = 'SCORED'
                    AND score_value IS NOT NULL
                )
                OR
                (
                    score_status IN (
                        'NOT_ENTERED',
                        'ABSENT',
                        'EXEMPT'
                    )
                    AND score_value IS NULL
                )
            )
    );

    -- ========================================================
    -- 11. LOCK_STATUS
    -- ========================================================

    CREATE TABLE dbo.lock_status (
        lock_status_id BIGINT IDENTITY(1,1) NOT NULL,

        academic_year_id BIGINT NOT NULL,
        class_id BIGINT NOT NULL,
        subject_id BIGINT NOT NULL,

        component VARCHAR(10) NOT NULL,

        status VARCHAR(20) NOT NULL
            CONSTRAINT DF_lock_status_status
            DEFAULT 'UNLOCKED',

        locked_by BIGINT NULL,
        locked_at DATETIMEOFFSET(7) NULL,

        unlocked_by BIGINT NULL,
        unlocked_at DATETIMEOFFSET(7) NULL,

        requested_by BIGINT NULL,
        requested_by_name NVARCHAR(150) NULL,

        unlock_reason NVARCHAR(MAX) NULL,

        version INT NOT NULL
            CONSTRAINT DF_lock_status_version
            DEFAULT 1,

        created_at DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_lock_status_created_at
            DEFAULT SYSDATETIMEOFFSET(),

        updated_at DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_lock_status_updated_at
            DEFAULT SYSDATETIMEOFFSET(),

        CONSTRAINT PK_lock_status
            PRIMARY KEY (lock_status_id),

        CONSTRAINT UQ_lock_status_scope
            UNIQUE (
                academic_year_id,
                class_id,
                subject_id,
                component
            ),

        CONSTRAINT FK_lock_status_academic_year
            FOREIGN KEY (academic_year_id)
            REFERENCES dbo.academic_year(academic_year_id),

        CONSTRAINT FK_lock_status_class_year
            FOREIGN KEY (class_id, academic_year_id)
            REFERENCES dbo.[class](
                class_id,
                academic_year_id
            ),

        CONSTRAINT FK_lock_status_subject
            FOREIGN KEY (subject_id)
            REFERENCES dbo.subject(subject_id),

        CONSTRAINT FK_lock_status_locked_by
            FOREIGN KEY (locked_by)
            REFERENCES dbo.app_user(user_id),

        CONSTRAINT FK_lock_status_unlocked_by
            FOREIGN KEY (unlocked_by)
            REFERENCES dbo.app_user(user_id),

        CONSTRAINT FK_lock_status_requested_by
            FOREIGN KEY (requested_by)
            REFERENCES dbo.app_user(user_id),

        CONSTRAINT CK_lock_status_component
            CHECK (
                component IN (
                    'QT1', 'QT2', 'QT3', 'GK', 'CK'
                )
            ),

        CONSTRAINT CK_lock_status_status
            CHECK (
                status IN ('UNLOCKED', 'LOCKED')
            ),

        CONSTRAINT CK_lock_status_version
            CHECK (version >= 1)
    );

    -- Luu y:
    -- UNLOCKED la trang thai mac dinh.
    -- Khong bat buoc co unlock_reason khi khoi tao.
    --
    -- Khi mo khoa thuc te, backend phai kiem tra:
    -- - Ly do mo khoa.
    -- - Nguoi yeu cau.
    -- - Quyen cua nguoi thuc hien.
    -- - Cap nhat AuditLog trong cung transaction.

    -- ========================================================
    -- 12. AUDIT_LOG
    -- ========================================================

    CREATE TABLE dbo.audit_log (
        audit_log_id BIGINT IDENTITY(1,1) NOT NULL,

        action_type VARCHAR(50) NOT NULL,

        performed_by BIGINT NOT NULL,

        requested_by BIGINT NULL,
        requested_by_name NVARCHAR(150) NULL,

        lock_status_id BIGINT NULL,

        academic_year_id BIGINT NOT NULL,
        class_id BIGINT NOT NULL,
        subject_id BIGINT NOT NULL,

        component VARCHAR(10) NULL,

        student_id BIGINT NULL,

        score_record_id BIGINT NULL,
        score_component_id BIGINT NULL,

        old_value DECIMAL(4,2) NULL,
        new_value DECIMAL(4,2) NULL,

        reason NVARCHAR(MAX) NULL,

        related_log_id BIGINT NULL,

        result VARCHAR(20) NOT NULL
            CONSTRAINT DF_audit_log_result
            DEFAULT 'SUCCESS',

        created_at DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_audit_log_created_at
            DEFAULT SYSDATETIMEOFFSET(),

        CONSTRAINT PK_audit_log
            PRIMARY KEY (audit_log_id),

        CONSTRAINT FK_audit_log_performed_by
            FOREIGN KEY (performed_by)
            REFERENCES dbo.app_user(user_id),

        CONSTRAINT FK_audit_log_requested_by
            FOREIGN KEY (requested_by)
            REFERENCES dbo.app_user(user_id),

        CONSTRAINT FK_audit_log_lock_status
            FOREIGN KEY (lock_status_id)
            REFERENCES dbo.lock_status(lock_status_id),

        CONSTRAINT FK_audit_log_academic_year
            FOREIGN KEY (academic_year_id)
            REFERENCES dbo.academic_year(academic_year_id),

        CONSTRAINT FK_audit_log_class_year
            FOREIGN KEY (class_id, academic_year_id)
            REFERENCES dbo.[class](
                class_id,
                academic_year_id
            ),

        CONSTRAINT FK_audit_log_subject
            FOREIGN KEY (subject_id)
            REFERENCES dbo.subject(subject_id),

        CONSTRAINT FK_audit_log_student
            FOREIGN KEY (student_id)
            REFERENCES dbo.student(student_id),

        CONSTRAINT FK_audit_log_score_record
            FOREIGN KEY (score_record_id)
            REFERENCES dbo.score_record(score_record_id),

        CONSTRAINT FK_audit_log_score_component
            FOREIGN KEY (score_component_id)
            REFERENCES dbo.score_component(score_component_id),

        CONSTRAINT FK_audit_log_related_log
            FOREIGN KEY (related_log_id)
            REFERENCES dbo.audit_log(audit_log_id),

        CONSTRAINT CK_audit_log_action
            CHECK (
                action_type IN (
                    'LOCK',
                    'UNLOCK',
                    'RELOCK',
                    'SCORE_EDIT',
                    'SCORE_IMPORT'
                )
            ),

        CONSTRAINT CK_audit_log_result
            CHECK (
                result IN (
                    'SUCCESS',
                    'REJECTED',
                    'FAILED'
                )
            ),

        CONSTRAINT CK_audit_log_component
            CHECK (
                component IS NULL
                OR component IN (
                    'QT1', 'QT2', 'QT3', 'GK', 'CK'
                )
            ),

        CONSTRAINT CK_audit_log_old_value
            CHECK (
                old_value IS NULL
                OR old_value BETWEEN 0 AND 10
            ),

        CONSTRAINT CK_audit_log_new_value
            CHECK (
                new_value IS NULL
                OR new_value BETWEEN 0 AND 10
            )
    );

    -- AuditLog duoc su dung theo nguyen tac append-only.
    -- Backend khong duoc cung cap API sua/xoa AuditLog.
    -- Can gioi han quyen UPDATE/DELETE tai database
    -- khi cau hinh tai khoan ung dung.

    -- ========================================================
    -- 13. SCORE_FORMULA_POLICY
    -- Bang cau hinh bo sung theo Data Dictionary
    -- ========================================================

    CREATE TABLE dbo.score_formula_policy (
        formula_policy_id BIGINT IDENTITY(1,1) NOT NULL,

        formula_expression NVARCHAR(MAX) NOT NULL,

        weight_qt1 SMALLINT NOT NULL,
        weight_qt2 SMALLINT NOT NULL,
        weight_qt3 SMALLINT NOT NULL,

        weight_gk SMALLINT NOT NULL,
        weight_ck SMALLINT NOT NULL,

        rounding_digits SMALLINT NOT NULL,

        version INT NOT NULL,

        approval_status VARCHAR(10) NOT NULL
            CONSTRAINT DF_formula_approval_status
            DEFAULT 'PENDING',

        approved_by NVARCHAR(150) NULL,
        approved_at DATETIMEOFFSET(7) NULL,

        CONSTRAINT PK_score_formula_policy
            PRIMARY KEY (formula_policy_id),

        CONSTRAINT UQ_score_formula_policy_version
            UNIQUE (version),

        CONSTRAINT CK_formula_expression
            CHECK (
                LEN(LTRIM(RTRIM(formula_expression))) > 0
            ),

        CONSTRAINT CK_formula_weights
            CHECK (
                weight_qt1 = 1
                AND weight_qt2 = 1
                AND weight_qt3 = 1
                AND weight_gk = 2
                AND weight_ck = 3
            ),

        CONSTRAINT CK_formula_rounding
            CHECK (
                rounding_digits = 2
            ),

        CONSTRAINT CK_formula_version
            CHECK (
                version >= 1
            ),

        CONSTRAINT CK_formula_approval_status
            CHECK (
                approval_status IN (
                    'PENDING',
                    'APPROVED',
                    'REJECTED'
                )
            ),

        CONSTRAINT CK_formula_approval_info
            CHECK (
                (
                    approval_status = 'APPROVED'
                    AND approved_by IS NOT NULL
                    AND LEN(
                        LTRIM(RTRIM(approved_by))
                    ) > 0
                    AND approved_at IS NOT NULL
                )
                OR
                (
                    approval_status IN (
                        'PENDING',
                        'REJECTED'
                    )
                    AND approved_by IS NULL
                    AND approved_at IS NULL
                )
            )
    );

    -- Cong thuc da thong nhat:
    --
    -- DTK = (
    --     QT1 + QT2 + QT3 + 2 * GK + 3 * CK
    -- ) / 8
    --
    -- Lam tron 2 chu so thap phan.
    -- Chi tinh khi du 5 thanh phan SCORED.
    -- Khong tu dong phe duyet cong thuc.
    --
    -- Migration chi tao bang.
    -- Du lieu cong thuc se duoc them trong seed rieng.

    -- ========================================================
    -- HOAN TAT MIGRATION
    -- ========================================================

    COMMIT TRANSACTION;

    PRINT N'Migration 001 thanh cong.';
    PRINT N'Da tao 12 bang chinh va 1 bang cau hinh.';

END TRY
BEGIN CATCH

    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    PRINT N'Migration 001 that bai.';
    PRINT ERROR_MESSAGE();

    THROW;

END CATCH;
