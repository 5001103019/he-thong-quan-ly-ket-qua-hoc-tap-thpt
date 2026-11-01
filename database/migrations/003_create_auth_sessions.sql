
/*
 * ====================================================
 * VT1-04 - MIGRATION 003
 * HE THONG QUAN LY KET QUA HOC TAP HOC SINH THPT
 * ====================================================
 *
 * Tao bang auth_session de quan ly phien dang nhap.
 *
 * Quy tac:
 * 1. Mot User co the co nhieu Session.
 * 2. Session phai lien ket voi User hop le.
 * 3. Chi luu hash cua token, khong luu token goc.
 * 4. Session co thoi gian het han.
 * 5. Co the thu hoi Session khi dang xuat.
 * 6. Khong xoa lich su tai khoan khi dang xuat.
 */

USE [thpt_grade_management];

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- =============================================
    -- 1. KIEM TRA BANG APP_USER
    -- =============================================

    IF OBJECT_ID(N'dbo.app_user', N'U') IS NULL
    BEGIN
        THROW 51401,
            'Chua co bang app_user. Can chay migration 001.',
            1;
    END;

    -- =============================================
    -- 2. TAO BANG AUTH_SESSION
    -- =============================================

    IF OBJECT_ID(N'dbo.auth_session', N'U') IS NULL
    BEGIN

        CREATE TABLE dbo.auth_session
        (
            session_id BIGINT IDENTITY(1,1) NOT NULL,

            user_id BIGINT NOT NULL,

            token_hash VARBINARY(32) NOT NULL,

            created_at DATETIMEOFFSET(7) NOT NULL
                CONSTRAINT DF_auth_session_created_at
                DEFAULT SYSDATETIMEOFFSET(),

            expires_at DATETIMEOFFSET(7) NOT NULL,

            revoked_at DATETIMEOFFSET(7) NULL,

            -- Khoa chinh
            CONSTRAINT PK_auth_session
                PRIMARY KEY (session_id),

            -- Lien ket voi tai khoan
            CONSTRAINT FK_auth_session_app_user
                FOREIGN KEY (user_id)
                REFERENCES dbo.app_user(user_id),

            -- Token hash khong duoc trung
            CONSTRAINT UQ_auth_session_token_hash
                UNIQUE (token_hash),

            -- Phien phai het han sau khi tao
            CONSTRAINT CK_auth_session_expiry
                CHECK (expires_at > created_at)
        );

        PRINT 'PASS 1: Da tao bang auth_session.';

    END
    ELSE
    BEGIN
        PRINT 'PASS 1: Bang auth_session da ton tai.';
    END;

    -- =============================================
    -- 3. TAO INDEX TRA CUU PHIEN
    -- =============================================

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_auth_session_user_active'
          AND object_id = OBJECT_ID(
              N'dbo.auth_session'
          )
    )
    BEGIN

        CREATE INDEX IX_auth_session_user_active
        ON dbo.auth_session (
            user_id,
            expires_at
        )
        WHERE revoked_at IS NULL;

    END;

    PRINT 'PASS 2: Da kiem tra index phien dang nhap.';

    -- =============================================
    -- 4. HOAN THANH MIGRATION
    -- =============================================

    COMMIT TRANSACTION;

    PRINT 'PASS 3: Migration 003 da COMMIT.';

    PRINT '';
    PRINT '=====================================';
    PRINT 'AUTH SESSION MIGRATION THANH CONG!';
    PRINT '=====================================';

END TRY
BEGIN CATCH

    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    PRINT 'MIGRATION 003 THAT BAI!';

    THROW;

END CATCH;
