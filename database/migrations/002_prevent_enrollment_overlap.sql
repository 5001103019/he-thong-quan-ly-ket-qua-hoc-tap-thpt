
-- ==================================================
-- MIGRATION 002
-- NGAN LICH SU PHAN LOP CHONG LAN
-- Microsoft SQL Server
-- ==================================================

USE [thpt_grade_management];
GO

-- 1. Tao index ho tro kiem tra thoi gian

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_enrollment_overlap_lookup'
      AND object_id = OBJECT_ID('dbo.enrollment')
)
BEGIN
    CREATE INDEX IX_enrollment_overlap_lookup
    ON dbo.enrollment (
        student_id,
        academic_year_id,
        start_date
    )
    INCLUDE (end_date);
END;
GO

-- 2. Tao trigger kiem tra chong lan

CREATE OR ALTER TRIGGER dbo.trg_enrollment_no_overlap
ON dbo.enrollment
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted AS i
        INNER JOIN dbo.enrollment AS e
            WITH (UPDLOCK, HOLDLOCK)
            ON e.student_id = i.student_id
            AND e.academic_year_id = i.academic_year_id
            AND e.enrollment_id <> i.enrollment_id
            AND e.start_date <
                ISNULL(i.end_date, '99991231')
            AND i.start_date <
                ISNULL(e.end_date, '99991231')
    )
    BEGIN
        THROW 51060,
            'Enrollment bi chong lan thoi gian trong cung nien khoa.',
            1;
    END;
END;
GO

PRINT 'Migration 002 da duoc thuc thi.';
GO
