
-- VT1-03: Bo sung trang thai diem cu/moi cho AuditLog
-- Khong xoa bang hoac sua du lieu cu

USE [thpt_grade_management];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Kiem tra dung database
    IF DB_NAME() <> N'thpt_grade_management'
        THROW 51001, 'Sai database.', 1;

    -- Kiem tra bang audit_log
    IF OBJECT_ID(N'dbo.audit_log', N'U') IS NULL
        THROW 51002, 'Khong tim thay bang audit_log.', 1;

    -- Them cot old_score_status neu chua co
    IF COL_LENGTH(N'dbo.audit_log', N'old_score_status') IS NULL
    BEGIN
        ALTER TABLE dbo.audit_log
        ADD old_score_status VARCHAR(15) NULL;
    END;

    -- Them cot new_score_status neu chua co
    IF COL_LENGTH(N'dbo.audit_log', N'new_score_status') IS NULL
    BEGIN
        ALTER TABLE dbo.audit_log
        ADD new_score_status VARCHAR(15) NULL;
    END;

    -- Kiem tra kieu du lieu cua hai cot
    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.audit_log')
          AND name IN ('old_score_status', 'new_score_status')
          AND (
              system_type_id <> 167
              OR max_length <> 15
              OR is_nullable <> 1
          )
    )
        THROW 51003, 'Kieu du lieu cot khong phu hop.', 1;

    -- Rang buoc trang thai diem cu
    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.audit_log')
          AND name = 'CK_audit_log_old_score_status'
    )
    BEGIN
        EXEC(N'
            ALTER TABLE dbo.audit_log
            ADD CONSTRAINT CK_audit_log_old_score_status
            CHECK (
                old_score_status IS NULL
                OR old_score_status IN (
                    ''NOT_ENTERED'',
                    ''SCORED'',
                    ''ABSENT'',
                    ''EXEMPT''
                )
            );
        ');
    END;

    -- Rang buoc trang thai diem moi
    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.audit_log')
          AND name = 'CK_audit_log_new_score_status'
    )
    BEGIN
        EXEC(N'
            ALTER TABLE dbo.audit_log
            ADD CONSTRAINT CK_audit_log_new_score_status
            CHECK (
                new_score_status IS NULL
                OR new_score_status IN (
                    ''NOT_ENTERED'',
                    ''SCORED'',
                    ''ABSENT'',
                    ''EXEMPT''
                )
            );
        ');
    END;

    COMMIT TRANSACTION;

    PRINT 'Migration AuditLog thanh cong.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;

-- Kiem tra hai cot sau migration
SELECT
    name AS column_name,
    TYPE_NAME(user_type_id) AS data_type,
    max_length,
    is_nullable
FROM sys.columns
WHERE object_id = OBJECT_ID(N'dbo.audit_log')
  AND name IN (
      'old_score_status',
      'new_score_status'
  )
ORDER BY name;

-- Kiem tra rang buoc CHECK
SELECT
    name,
    is_disabled,
    is_not_trusted
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID(N'dbo.audit_log')
  AND name IN (
      'CK_audit_log_old_score_status',
      'CK_audit_log_new_score_status'
  );
