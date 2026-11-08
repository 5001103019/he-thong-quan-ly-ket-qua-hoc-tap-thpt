
/*
 * VT2-03 - BANG DIEM
 * Doc du lieu that tu SQL Server qua API.
 * Khong xoa hay ghi de du lieu Import CSV.
 */

document.addEventListener("DOMContentLoaded", function () {
    // Tao menu trong JS, tranh loi CSP.
    if (typeof renderNavigation === "function") {
        renderNavigation("admin", "sidebarNavigation");
    }

    const academicYear = document.getElementById("scoreAcademicYear");
    const term = document.getElementById("scoreTerm");
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
    const tbody = document.getElementById("scoreTableBody");

    const types = ["QT1", "QT2", "QT3", "GK", "CK"];

    let classRequest = 0;
    let scoreRequest = 0;

    // An ket qua cu khi thay doi bo loc.
    function hideResults() {
        summary.hidden = true;
        results.hidden = true;
        lockStatus.hidden = true;
        footer.hidden = true;
        saveButton.disabled = true;
    }

    function showMessage(content, isError = false) {
        message.textContent = content;
        message.hidden = false;
        message.classList.toggle("is-error", isError);
    }

    function clearMessage() {
        message.textContent = "";
        message.hidden = true;
        message.classList.remove("is-error");
    }

    // Doc API that, khong su dung du lieu mau.
    async function getData(url) {
        const response = await fetch(url, {
            credentials: "same-origin"
        });

        const body = await response.json().catch(() => null);

        if (!response.ok || !body?.success) {
            const details = body?.error?.message ||
                `HTTP ${response.status}`;

            throw new Error(details);
        }

        return body.data;
    }

    // Nap danh sach vao o select theo ID that.
    function setOptions(
        select,
        items,
        idField,
        textField,
        preferred
    ) {
        select.replaceChildren();

        for (const item of items) {
            select.add(new Option(
                String(item[textField]),
                String(item[idField])
            ));
        }

        if (items.length === 0) {
            select.add(new Option("Chưa có dữ liệu", ""));
            return;
        }

        const selected = items.find(item =>
            String(item[idField]) === String(preferred) ||
            String(item[textField]) === String(preferred)
        );

        select.value = String(
            (selected || items[0])[idField]
        );
    }

    // Lay lop tu database theo nien khoa va khoi.
    async function loadClasses(preferredClass = "") {
        const request = ++classRequest;

        hideResults();
        scoreRequest++;

        classroom.replaceChildren(
            new Option("Đang tải lớp...", "")
        );

        if (!academicYear.value || !grade.value) {
            return;
        }

        try {
            const query = new URLSearchParams({
                academicYearId: academicYear.value,
                gradeId: grade.value
            });

            const classes = await getData(
                "/api/v1/classes?" + query
            );

            if (request !== classRequest) {
                return;
            }

            setOptions(
                classroom,
                classes,
                "classId",
                "code",
                preferredClass
            );

        } catch (error) {
            if (request !== classRequest) {
                return;
            }

            classroom.replaceChildren(
                new Option("Lỗi tải lớp", "")
            );

            showMessage(
                "Không tải được lớp: " + error.message,
                true
            );
        }
    }

    // Them o vao dong bang diem.
    function addCell(row, value) {
        const cell = document.createElement("td");

        cell.textContent = String(value ?? "—");
        row.appendChild(cell);

        return cell;
    }

    function getComponent(student, type) {
        return student.components?.find(
            item => item.componentType === type
        );
    }

    // Hien thi diem va trang thai khoa.
    function displayComponent(component) {
        if (!component) {
            return "—";
        }

        let value = "—";

        if (component.scoreStatus === "SCORED") {
            value = component.scoreValue == null
                ? "—"
                : String(component.scoreValue);

        } else if (component.scoreStatus === "ABSENT") {
            value = "Vắng";

        } else if (component.scoreStatus === "EXEMPT") {
            value = "Miễn";
        }

        if (component.lockStatus === "LOCKED") {
            value += " 🔒";
        }

        return value;
    }

    // Lay diem tong ket do Backend tinh.
    async function showSummaries(students, cells, request) {
        let index = 0;

        const workers = Array.from({
            length: Math.min(4, students.length)
        }, async () => {
            while (
                index < students.length &&
                request === scoreRequest
            ) {
                const i = index++;

                if (!students[i].scoreRecordId) {
                    continue;
                }

                try {
                    const result = await getData(
                        "/api/v1/score-records/" +
                        students[i].scoreRecordId +
                        "/summary"
                    );

                    if (request !== scoreRequest) {
                        return;
                    }

                    if (
                        result.calculationStatus ===
                        "CALCULATED"
                    ) {
                        cells[i].textContent =
                            Number(result.finalScore).toFixed(2);

                    } else if (
                        result.calculationStatus ===
                        "FORMULA_NOT_APPROVED"
                    ) {
                        cells[i].textContent = "Chưa duyệt";
                    }

                } catch (error) {
                    console.warn(
                        "Không tải được tổng kết:",
                        error
                    );
                }
            }
        });

        await Promise.all(workers);
    }

    // Lay bang diem that da luu trong SQL Server.
    async function loadScores() {
        const request = ++scoreRequest;

        hideResults();
        clearMessage();

        const selectedTerm =
            document.getElementById("scoreTerm")?.value;

        if (selectedTerm !== "HK1") {
            showMessage(
                "Chưa có dữ liệu điểm để hiển thị.",
                true
            );
            return;
        }

        if (
            !academicYear.value ||
            !grade.value ||
            !classroom.value ||
            !subject.value
        ) {
            showMessage(
                "Vui lòng chọn đầy đủ bộ lọc.",
                true
            );
            return;
        }

        loadButton.disabled = true;

        try {
            const query = new URLSearchParams({
                academicYearId: academicYear.value,
                classId: classroom.value,
                subjectId: subject.value,
                term: term?.value || "HK1"
            });

            const students = await getData(
                "/api/v1/scores?" + query
            );

            if (request !== scoreRequest) {
                return;
            }

            if (!Array.isArray(students)) {
                throw new Error(
                    "Dữ liệu bảng điểm không hợp lệ"
                );
            }

            tbody.replaceChildren();

            const locked = new Set();
            const totalCells = [];

            let complete = 0;

            for (const student of students) {
                const row = document.createElement("tr");

                addCell(row, student.studentCode);
                addCell(row, student.fullName);

                let fullScore = true;

                for (const type of types) {
                    const component = getComponent(
                        student,
                        type
                    );

                    addCell(
                        row,
                        displayComponent(component)
                    );

                    if (
                        component?.lockStatus === "LOCKED"
                    ) {
                        locked.add(type);
                    }

                    if (
                        component?.scoreStatus !== "SCORED" ||
                        !Number.isFinite(component?.scoreValue)
                    ) {
                        fullScore = false;
                    }
                }

                if (fullScore) {
                    complete++;
                }

                totalCells.push(addCell(row, "—"));

                addCell(
                    row,
                    fullScore ? "Đủ điểm" : "Chưa đủ điểm"
                );

                tbody.appendChild(row);
            }

            // Truong hop chua co hoc sinh.
            if (students.length === 0) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 9;
                cell.textContent =
                    "Chưa có học sinh trong lớp đã chọn.";

                row.appendChild(cell);
                tbody.appendChild(row);
            }

            // Thong ke tu du lieu that.
            document.getElementById(
                "completeCount"
            ).textContent = String(complete);

            document.getElementById(
                "missingCount"
            ).textContent = String(
                students.length - complete
            );

            document.getElementById(
                "lockedComponents"
            ).textContent =
                types.filter(
                    type => locked.has(type)
                ).join(", ") || "Không có";

            // Hien thi trang thai khoa.
            const lockGrid = lockStatus.querySelector(
                ".score-lock-grid"
            );

            lockGrid.replaceChildren();

            for (const type of types) {
                const tag = document.createElement("span");

                tag.textContent = type + ": " +
                    (locked.has(type)
                        ? "Đã khóa"
                        : "Chưa khóa");

                lockGrid.appendChild(tag);
            }

            // Thay chu thich du lieu mau.
            const caption = results.querySelector(
                ".score-table-caption"
            );

            if (caption) {
                caption.textContent =
                    "Dữ liệu đọc từ SQL Server qua API.";
            }

            summary.hidden = false;
            results.hidden = false;

            lockStatus.hidden = term.value !== "HK1";

            if (term.value === "HK2") {
                document.getElementById(
                    "lockedComponents"
                ).textContent = "Chưa kết nối khóa HK2";
            }

            showMessage(
                "Đã tải " + students.length +
                " học sinh từ SQL Server."
            );

            if (term.value === "HK2") {
                students.forEach((student, index) => {
                    totalCells[index].textContent =
                        student.finalScore == null
                            ? "—"
                            : Number(student.finalScore).toFixed(2);
                });
            } else {
                await showSummaries(
                    students,
                    totalCells,
                    request
                );
            }

        } catch (error) {
            if (request === scoreRequest) {
                showMessage(
                    "Lỗi tải bảng điểm: " + error.message,
                    true
                );
            }
        } finally {
            loadButton.disabled = false;
        }
    }

    // Tai bo loc that tu SQL Server khi mo trang.
    async function initializeFilters() {
        const preferredYear = academicYear.value;
        const preferredGrade = grade.value;
        const preferredClass = classroom.value;

        const preferredSubject =
            subject.options[subject.selectedIndex]
                ?.textContent;

        hideResults();

        if (term.value === "YEAR") {
            showMessage(
                "Bang diem ca nam chua duoc ket noi.",
                true
            );
            return;
        }

        loadButton.disabled = true;

        try {
            const [years, grades, subjects] =
                await Promise.all([
                    getData("/api/v1/academic-years"),
                    getData("/api/v1/grades"),
                    getData("/api/v1/subjects")
                ]);

            setOptions(
                academicYear,
                years,
                "academicYearId",
                "code",
                preferredYear
            );

            setOptions(
                grade,
                grades,
                "gradeId",
                "gradeNumber",
                preferredGrade
            );

            setOptions(
                subject,
                subjects,
                "subjectId",
                "name",
                preferredSubject
            );

            await loadClasses(preferredClass);

            if (
                !message.classList.contains("is-error")
            ) {
                clearMessage();
            }

        } catch (error) {
            showMessage(
                "Lỗi tải bộ lọc: " + error.message,
                true
            );

        } finally {
            loadButton.disabled = false;
        }
    }

    // Xu ly thay doi bo loc.
    [academicYear, grade].forEach(select => {
        select.addEventListener("change", () => {
            clearMessage();
            loadClasses();
        });
    });

    [classroom, subject, term].forEach(select => {
        select.addEventListener("change", () => {
            scoreRequest++;
            hideResults();
            clearMessage();
        });
    });

    // Nhan nut Xem bang diem.
    if (term) {
        term.addEventListener("change", () => {
            scoreRequest++;
            hideResults();
            clearMessage();
        });
    }
    loadButton.addEventListener("click", loadScores);

    // Giu nut Luu vo hieu hoa.
    // Viec nhap/sua diem se xu ly rieng qua API PATCH.
    initializeFilters();
});
