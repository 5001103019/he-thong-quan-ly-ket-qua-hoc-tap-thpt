
/*
 * VT2-03 - Giao dien bang diem dang luoi
 *
 * Pham vi:
 * - Doc bo loc nien khoa, khoi, lop, mon hoc.
 * - Kiem tra bo loc truoc khi xem bang diem.
 * - An ket qua cu khi nguoi dung doi bo loc.
 *
 * Chua thuc hien:
 * - Lay du lieu tu API cua Ngoc va Chau.
 * - Lay trang thai khoa tu API cua Uyen.
 * - Cap nhat diem va luu vao co so du lieu.
 */

document.addEventListener("DOMContentLoaded", function () {
    const academicYear = document.getElementById("scoreAcademicYear");
    const grade = document.getElementById("scoreGrade");
    const classroom = document.getElementById("scoreClass");
    const subject = document.getElementById("scoreSubject");

    const loadButton = document.getElementById("btnLoadScores");
    const saveButton = document.getElementById("btnSaveScores");

    const summary = document.getElementById("scoreSummary");
    const results = document.getElementById("scoreResults");
    const lockStatus = document.getElementById("scoreLockStatus");
    const footer = document.getElementById("scoreFooter");
    const message = document.getElementById("scoreMessage");

    // An cac khu vuc ket qua.
    function hideResults() {
        summary.hidden = true;
        results.hidden = true;
        lockStatus.hidden = true;
        footer.hidden = true;
        saveButton.disabled = true;
    }

    // Hien thong bao giao dien.
    function showMessage(content) {
        message.textContent = content;
        message.hidden = false;
    }

    // Xoa thong bao.
    function clearMessage() {
        message.textContent = "";
        message.hidden = true;
    }

    // Khi doi bo loc, khong giu lai bang diem cu.
    [academicYear, grade, classroom, subject].forEach(function (select) {
        select.addEventListener("change", function () {
            hideResults();
            clearMessage();
        });
    });

    // Nhan nut Xem bang diem.
    loadButton.addEventListener("click", function () {
        hideResults();
        clearMessage();

        if (
            !academicYear.value ||
            !grade.value ||
            !classroom.value ||
            !subject.value
        ) {
            showMessage(
                "Vui lòng chọn đầy đủ niên khóa, khối, lớp và môn học."
            );
            return;
        }

        // Cho tich hop API cua cac thanh vien phu trach.
        showMessage(
            "Đã chọn đầy đủ bộ lọc. Chưa kết nối API dữ liệu bảng điểm."
        );
    });

    // Trang thai ban dau.
    hideResults();
});

