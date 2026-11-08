
USE [thpt_grade_management];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Kiem tra chua bo sung hoc ky
    IF COL_LENGTH('dbo.score_record', 'term') IS NOT NULL
       OR COL_LENGTH('dbo.lock_status', 'term') IS NOT NULL
       OR COL_LENGTH('dbo.audit_log', 'term') IS NOT NULL
    BEGIN
        THROW 51020,
            'Cot term da ton tai. Can kiem tra schema truoc khi chay.',
            1;
    END;

    -- Xac nhan rang buoc cu dung voi migration 001
    IF NOT EXISTS (
        SELECT 1 FROM sys.key_constraints
        WHERE parent_object_id = OBJECT_ID('dbo.score_record')
          AND name = 'UQ_score_record_enrollment_subject'
    )
    OR NOT EXISTS (
        SELECT 1 FROM sys.key_constraints
        WHERE parent_object_id = OBJECT_ID('dbo.lock_status')
          AND name = 'UQ_lock_status_scope'
    )
    BEGIN
        THROW 51021,
            'Rang buoc database khac ban goc. Can kiem tra truoc.',
            1;
    END;

    -- 1. Bo sung hoc ky cho bang diem
    -- Du lieu cu mac dinh thuoc HK1
    ALTER TABLE dbo.score_record
    ADD term VARCHAR(3) NOT NULL
        CONSTRAINT DF_score_record_term
        DEFAULT ('HK1') WITH VALUES;

    EXEC(N'
        ALTER TABLE dbo.score_record
        ADD CONSTRAINT CK_score_record_term
        CHECK (term IN (''HK1'', ''HK2''))
    ');

    -- Moi hoc sinh co 1 ban ghi diem cho moi mon, moi HK
    ALTER TABLE dbo.score_record
    DROP CONSTRAINT UQ_score_record_enrollment_subject;

    ALTER TABLE dbo.score_record
    ADD CONSTRAINT UQ_score_record_enrollment_subject_term
        UNIQUE (enrollment_id, subject_id, term);

    -- 2. Bo sung hoc ky cho khoa/mo khoa
    ALTER TABLE dbo.lock_status
    ADD term VARCHAR(3) NOT NULL
        CONSTRAINT DF_lock_status_term
        DEFAULT ('HK1') WITH VALUES;

    EXEC(N'
        ALTER TABLE dbo.lock_status
        ADD CONSTRAINT CK_lock_status_term
        CHECK (term IN (''HK1'', ''HK2''))
    ');

    -- Moi hoc ky co trang thai khoa rieng
    ALTER TABLE dbo.lock_status
    DROP CONSTRAINT UQ_lock_status_scope;

    ALTER TABLE dbo.lock_status
    ADD CONSTRAINT UQ_lock_status_scope_term
        UNIQUE (
            academic_year_id,
            class_id,
            subject_id,
            component,
            term
        );

    -- 3. Bo sung hoc ky vao nhat ky thao tac
    ALTER TABLE dbo.audit_log
    ADD term VARCHAR(3) NOT NULL
        CONSTRAINT DF_audit_log_term
        DEFAULT ('HK1') WITH VALUES;

    EXEC(N'
        ALTER TABLE dbo.audit_log
        ADD CONSTRAINT CK_audit_log_term
        CHECK (term IN (''HK1'', ''HK2''))
    ');

    COMMIT TRANSACTION;

    PRINT 'DA BO SUNG HOC KY THANH CONG';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
