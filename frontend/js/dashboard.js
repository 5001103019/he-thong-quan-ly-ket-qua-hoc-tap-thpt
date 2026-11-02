
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

    // Du lieu demo: 2 nien khoa, moi nien khoa co 3 khoi
    // Moi khoi co 1 lop hoc mau
    const demoClasses = {
        "2025-2026": {
            "10": ["10A1"],
            "11": ["11A1"],
            "12": ["12A1"]
        },
        "2026-2027": {
            "10": ["10A1"],
            "11": ["11A1"],
            "12": ["12A1"]
        }
    };

    // Cap nhat thong tin lua chon hien tai
    function updateSelectionSummary() {
        selectedYear.textContent =
            academicYear.value.replace("-", "–");

        selectedGrade.textContent =
            "Khối " + grade.value;

        selectedClass.textContent =
            classroom.value || "Chưa có lớp";
    }

    // Cap nhat danh sach lop khi thay doi nien khoa hoac khoi
    function updateClassOptions() {

        const yearValue = academicYear.value;
        const gradeValue = grade.value;

        let classList = [];

        // Lay danh sach lop tu du lieu demo
        if (
            demoClasses[yearValue] &&
            demoClasses[yearValue][gradeValue]
        ) {
            classList = demoClasses[yearValue][gradeValue];
        }

        // Xoa danh sach lop cu
        classroom.innerHTML = "";

        // Neu khong co lop thi hien thong bao
        if (classList.length === 0) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Chưa có lớp";

            classroom.appendChild(option);
            classroom.disabled = true;
        } else {
            classroom.disabled = false;

            // Tao tung lua chon lop hoc
            classList.forEach(function (className) {
                const option = document.createElement("option");

                option.value = className;
                option.textContent = className;

                classroom.appendChild(option);
            });
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
