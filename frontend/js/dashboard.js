
/* =====================================================
   VT2-02 - DASHBOARD JAVASCRIPT
   Bo loc nien khoa, khoi va lop hoc
   Du lieu mau, chua ket noi API
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // Lay cac thanh phan tu giao dien
    const academicYear = document.getElementById("academicYear");
    const grade = document.getElementById("grade");
    const classroom = document.getElementById("classroom");

    const selectedYear = document.getElementById("selectedYear");
    const selectedGrade = document.getElementById("selectedGrade");
    const selectedClass = document.getElementById("selectedClass");

    // Kiem tra cac thanh phan co ton tai hay khong
    if (!academicYear || !grade || !classroom) {
        console.error("Khong tim thay bo loc Dashboard.");
        return;
    }

    // Cap nhat thong tin lua chon hien tai
    function updateSelectionSummary() {
        selectedYear.textContent =
            academicYear.value.replace("-", "–");

        selectedGrade.textContent =
            "Khối " + grade.value;

        selectedClass.textContent =
            classroom.value || "Chưa có lớp học";
    }

    // Cap nhat danh sach lop khi thay doi nien khoa hoac khoi
    async function updateClassOptions() {
        const yearValue = academicYear.value;
        const gradeValue = grade.value;

        classroom.replaceChildren(
            new Option("Đang tải lớp học...", "")
        );
        classroom.disabled = true;
        updateSelectionSummary();

        try {
            // Lay danh sach lop that tu SQL Server
            const res = await apiClient.get("/classes");

            if (!res || res.success !== true ||
                !Array.isArray(res.data)) {
                throw new Error("API lớp học không hợp lệ");
            }

            // Khong hien thi ket qua cua bo loc da thay doi
            if (academicYear.value !== yearValue ||
                grade.value !== gradeValue) {
                return;
            }

            const classList = res.data.filter(cls =>
                String(cls.academicYearCode) === yearValue &&
                String(cls.gradeNumber) === gradeValue
            );

            classroom.replaceChildren();

            if (classList.length === 0) {
                classroom.add(
                    new Option("Chưa có lớp học", "")
                );
                classroom.disabled = true;
            } else {
                classList.forEach(cls => {
                    classroom.add(
                        new Option(
                            cls.name || cls.code,
                            cls.code
                        )
                    );
                });

                classroom.disabled = false;
            }

        } catch (error) {
            if (academicYear.value !== yearValue ||
                grade.value !== gradeValue) {
                return;
            }

            classroom.replaceChildren(
                new Option("Không tải được lớp học", "")
            );
            classroom.disabled = true;
            console.error("Lỗi tải lớp học:", error);
        }

        updateSelectionSummary();
    }

    // Thay doi nien khoa
    academicYear.addEventListener("change", function () {
        updateClassOptions();
    });

    // Thay doi khoi hoc
    grade.addEventListener("change", function () {
        updateClassOptions();
    });

    // Thay doi lop hoc
    classroom.addEventListener("change", function () {
        updateSelectionSummary();
    });

    // Hien thi bo loc khi trang vua duoc mo
    updateClassOptions();
});
