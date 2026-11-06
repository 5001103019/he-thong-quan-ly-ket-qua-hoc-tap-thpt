
/*
 * VT3-04 - Giao dien Hoc sinh / Tai khoan theo Figma.
 * Khong thay doi API hoac logic nghiep vu da PASS.
 */
(function () {
    "use strict";

    const el = (id) => document.getElementById(id);

    let studentsCache = [];
    let classesCache = [];
    let displayRecords = [];
    let actionButtons = new Map();
    let listVersion = 0;

    let screen = "list";
    let activePanelId = null;
    let returnFromGrant = "list";
    let pendingAccountCode = null;

    const panelIds = [
        "studentFormPanel",
        "studentAccountPanel",
        "studentAssignPanel",
        "studentTransferPanel",
        "studentEnrollmentPanel"
    ];

    const originalGetCatalogData = getStudentCatalogData;
    const originalLoadStudents = loadStudents;
    const originalLoadClasses = loadStudentClasses;

    function normalizeText(value) {
        return String(value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase();
    }

    function statusLabel(status) {
        if (status === "ACTIVE") return "Đang học";
        if (status === "INACTIVE") return "Ngừng hoạt động";
        return String(status ?? "—");
    }

    function makeCell(value) {
        const td = document.createElement("td");
        td.textContent = value == null || value === ""
            ? "—"
            : String(value);
        return td;
    }

    function makeTable(headers, rows) {
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const tr = document.createElement("tr");

        headers.forEach(function (name) {
            const th = document.createElement("th");
            th.textContent = name;
            tr.appendChild(th);
        });

        thead.appendChild(tr);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        rows.forEach(function (values) {
            const row = document.createElement("tr");
            values.forEach(function (value) {
                row.appendChild(makeCell(value));
            });
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        return table;
    }

    function selectedEnrollment(history, selectedYear) {
        if (!Array.isArray(history)) return null;

        const filtered = selectedYear
            ? history.filter(function (item) {
                return String(item.academicYearId) ===
                    String(selectedYear);
            })
            : history;

        if (filtered.length === 0) return null;

        const current = filtered.find(function (item) {
            return item.endDate === null;
        });

        if (current) return current;

        return filtered.slice().sort(function (a, b) {
            return String(b.startDate ?? "")
                .localeCompare(String(a.startDate ?? ""));
        })[0];
    }

    // Chi ghi nhan du lieu, khong thay doi ket qua API.
    getStudentCatalogData = function (response) {
        const data = originalGetCatalogData(response);

        if (data.length > 0 && "studentCode" in data[0]) {
            studentsCache = data;
        }

        if (
            data.length > 0 &&
            "classId" in data[0] &&
            "gradeNumber" in data[0] &&
            typeof data[0].name === "string"
        ) {
            classesCache = data;
        }

        return data;
    };

    function filterClassesByGrade() {
        const grade = el("studentGradeFilter").value;
        const select = el("studentClassFilter");
        const oldValue = select.value;

        if (classesCache.length === 0) return;

        const classes = classesCache.filter(function (item) {
            return !grade ||
                String(item.gradeNumber) === grade;
        });

        select.replaceChildren();
        select.appendChild(
            new Option("Tất cả lớp", "")
        );

        classes.forEach(function (item) {
            select.appendChild(
                new Option(
                    item.name || item.code || item.classId,
                    String(item.classId)
                )
            );
        });

        if (Array.from(select.options).some(function (opt) {
            return opt.value === oldValue;
        })) {
            select.value = oldValue;
        }
    }

    loadStudentClasses = async function () {
        classesCache = [];

        await originalLoadClasses();

        filterClassesByGrade();
    };

    function setStats(total, issued, missing, unknown) {
        el("studentCount").textContent = String(total);
        el("studentAccountCount").textContent =
            unknown ? "—" : String(issued);
        el("studentNoAccountCount").textContent =
            unknown ? "—" : String(missing);
    }

    function makeActions(oldCell, student) {
        const result = document.createElement("td");
        const buttons = Array.from(
            oldCell.querySelectorAll("button")
        );

        const edit = buttons[0];
        const account = buttons.find(function (button) {
            return button.textContent.trim() === "Cấp tài khoản";
        });

        actionButtons.set(
            String(student.studentId),
            { edit: edit, account: account }
        );

        if (edit) {
            edit.textContent = "Xem / Sửa";
            edit.className = "student-action-link";
            result.appendChild(edit);
        }

        const extraButtons = buttons.filter(function (button) {
            return button !== edit;
        });

        if (extraButtons.length > 0) {
            const details = document.createElement("details");
            details.className = "student-actions-more";

            const summary = document.createElement("summary");
            summary.textContent = "Thao tác khác";
            details.appendChild(summary);

            const popup = document.createElement("div");
            popup.className = "student-actions-popup";

            extraButtons.forEach(function (button) {
                popup.appendChild(button);
            });

            details.appendChild(popup);

            details.addEventListener("click", function (event) {
                if (event.target.closest("button")) {
                    details.open = false;
                }
            });

            result.appendChild(details);
        }

        // Cac su kien cu tren nut van duoc giu nguyen.
        if (edit) {
            edit.addEventListener("click", function () {
                queueMicrotask(function () {
                    activate("form", "studentFormPanel");
                });
            });
        }

        if (account) {
            account.addEventListener("click", function () {
                if (screen !== "grant") {
                    returnFromGrant =
                        screen === "accounts" ? "accounts" : "list";
                }

                queueMicrotask(function () {
                    activate("grant", "studentAccountPanel");
                });
            });
        }

        extraButtons.forEach(function (button) {
            if (button === account) return;

            const label = button.textContent.trim();

            button.addEventListener("click", function () {
                if (
                    label === "Phân lớp" ||
                    label === "Chuyển lớp" ||
                    label === "Lịch sử lớp"
                ) {
                    const target = {
                        "Phân lớp": "studentAssignPanel",
                        "Chuyển lớp": "studentTransferPanel",
                        "Lịch sử lớp": "studentEnrollmentPanel"
                    }[label];

                    queueMicrotask(function () {
                        activate("utility", target);
                    });
                }
            });
        });

        return result;
    }

    async function enrichStudent(student) {
        const id = encodeURIComponent(student.studentId);

        const results = await Promise.allSettled([
            apiClient.get(
                "/students/" + id + "/enrollments"
            ),
            apiClient.get(
                "/khao-thi/demo-accounts?studentId=" + id
            )
        ]);

        const enrollmentResponse =
            results[0].status === "fulfilled"
                ? results[0].value
                : null;

        const accountResponse =
            results[1].status === "fulfilled"
                ? results[1].value
                : null;

        const history =
            enrollmentResponse?.success === true &&
            Array.isArray(enrollmentResponse.data)
                ? enrollmentResponse.data
                : null;

        const accounts =
            accountResponse?.success === true &&
            Array.isArray(accountResponse.data?.accounts)
                ? accountResponse.data.accounts
                : null;

        return {
            student: student,
            history: history,
            enrollment: selectedEnrollment(
                history,
                el("studentYearFilter").value
            ),
            accounts: accounts
        };
    }

    function matchesCurrentFilters(record) {
        const keyword = normalizeText(
            el("studentKeywordFilter").value.trim()
        );

        const grade = el("studentGradeFilter").value;

        const matchesKeyword =
            !keyword ||
            normalizeText(record.student.studentCode)
                .includes(keyword) ||
            normalizeText(record.student.fullName)
                .includes(keyword);

        const matchesGrade =
            !grade ||
            String(record.enrollment?.gradeNumber ?? "") === grade;

        return matchesKeyword && matchesGrade;
    }

    async function decorateStudentTable(version) {
        const container = el("studentTable");
        const table = container.querySelector("table");

        if (!table) {
            displayRecords = [];
            setStats(0, 0, 0, 0);
            return;
        }

        const rows = Array.from(
            table.querySelectorAll("tbody tr")
        );

        const students = studentsCache.slice();
        const enriched = await Promise.all(
            students.map(enrichStudent)
        );

        if (version !== listVersion) return;

        const header = table.querySelector("thead tr");
        header.replaceChildren();

        [
            "Mã HS",
            "Họ tên",
            "Niên khóa",
            "Lớp",
            "Trạng thái",
            "Tài khoản",
            "Thao tác"
        ].forEach(function (name) {
            const th = document.createElement("th");
            th.textContent = name;
            header.appendChild(th);
        });

        displayRecords = [];
        actionButtons = new Map();

        let issued = 0;
        let missing = 0;
        let unknown = 0;

        enriched.forEach(function (record, index) {
            const row = rows[index];
            if (!row) return;

            const student = record.student;
            const oldCells = Array.from(row.children);
            const oldActionCell = oldCells[4];

            if (!oldActionCell) return;

            row.replaceChildren(
                makeCell(student.studentCode),
                makeCell(student.fullName),
                makeCell(record.enrollment?.academicYearCode),
                makeCell(record.enrollment?.classCode),
                makeCell(statusLabel(student.status)),
                makeCell(
                    record.accounts === null
                        ? "Chưa xác định"
                        : record.accounts.length > 0
                            ? "Đã cấp"
                            : "Chưa cấp"
                ),
                makeActions(oldActionCell, student)
            );

            const visible = matchesCurrentFilters(record);
            row.hidden = !visible;

            if (!visible) return;

            displayRecords.push(record);

            if (record.accounts === null) {
                unknown++;
            } else if (record.accounts.length > 0) {
                issued++;
            } else {
                missing++;
            }
        });

        setStats(displayRecords.length, issued, missing, unknown);

        if (unknown > 0) {
            el("studentFilterStatus").textContent =
                "Chưa xác định được tài khoản của " +
                unknown + " học sinh. " +
                "Thống kê tài khoản tạm thời không hiển thị.";
        }

        renderMiniList();

        if (screen === "accounts") renderAccountOverview();
        if (screen === "grant") renderUnissuedList();

        // Ho tro tuy chon cap tai khoan sau khi
        // tao ho so thanh cong.
        if (
            pendingAccountCode &&
            el("studentFormPanel").hidden
        ) {
            const item = displayRecords.find(function (record) {
                return record.student.studentCode ===
                    pendingAccountCode;
            });

            if (item) {
                pendingAccountCode = null;

                const button = actionButtons.get(
                    String(item.student.studentId)
                )?.account;

                if (button) button.click();
            }
        }
    }

    loadStudents = async function () {
        const version = ++listVersion;
        studentsCache = [];

        el("studentCount").textContent = "…";
        el("studentAccountCount").textContent = "…";
        el("studentNoAccountCount").textContent = "…";

        await originalLoadStudents();

        if (version !== listVersion) return;

        try {
            await decorateStudentTable(version);
        } catch (error) {
            el("studentFilterStatus").textContent =
                "Không tải được thông tin mở rộng: " +
                error.message;
        }
    };

    function renderMiniList() {
        const container = el("studentMiniTable");
        container.replaceChildren();

        const records = displayRecords.length
            ? displayRecords
            : studentsCache.map(function (student) {
                return { student: student, enrollment: null };
            });

        const rows = records.map(function (record) {
            return [
                record.student.studentCode,
                record.student.fullName,
                record.enrollment?.classCode || "—"
            ];
        });

        container.appendChild(
            makeTable(["Mã HS", "Họ tên", "Lớp"], rows)
        );
    }

    function copySelectOptions(sourceId, destinationId) {
        const source = el(sourceId);
        const destination = el(destinationId);

        destination.replaceChildren();

        Array.from(source.options).forEach(function (option) {
            destination.appendChild(
                new Option(option.textContent, option.value)
            );
        });
    }

    function prepareAccountFilters() {
        copySelectOptions(
            "studentYearFilter",
            "accountYearFilter"
        );
        copySelectOptions(
            "studentClassFilter",
            "accountClassFilter"
        );

        el("accountYearFilter").value =
            el("studentYearFilter").value;

        el("accountClassFilter").value =
            el("studentClassFilter").value;
    }

    function accountFilteredRecords() {
        const year = el("accountYearFilter").value;
        const classId = el("accountClassFilter").value;
        const keyword = normalizeText(
            el("accountSearchFilter").value.trim()
        );

        return displayRecords.filter(function (record) {
            const account = record.accounts?.[0];

            const matchesYear =
                !year ||
                String(record.enrollment?.academicYearId ?? "") ===
                    year;

            const matchesClass =
                !classId ||
                String(record.enrollment?.classId ?? "") ===
                    classId;

            const matchesKeyword =
                !keyword ||
                normalizeText(record.student.studentCode)
                    .includes(keyword) ||
                normalizeText(record.student.fullName)
                    .includes(keyword) ||
                normalizeText(account?.username)
                    .includes(keyword);

            return matchesYear &&
                matchesClass &&
                matchesKeyword;
        });
    }

    function renderAccountOverview() {
        const container = el("studentAccountOverviewTable");
        container.replaceChildren();

        const table = makeTable(
            [
                "Mã HS",
                "Học sinh",
                "Tên đăng nhập",
                "Tài khoản",
                "Quyền xem điểm",
                "Thao tác"
            ],
            []
        );

        const tbody = table.querySelector("tbody");

        accountFilteredRecords().forEach(function (record) {
            const account = record.accounts?.[0];
            const tr = document.createElement("tr");

            const values = [
                record.student.studentCode,
                record.student.fullName,
                account?.username || "—",
                record.accounts === null
                    ? "Chưa xác định"
                    : account
                        ? (
                            account.isActive
                                ? "Hoạt động"
                                : "Đã vô hiệu hóa"
                        )
                        : "Chưa cấp",
                account ? "Của chính mình" : "—"
            ];

            values.forEach(function (value) {
                tr.appendChild(makeCell(value));
            });

            const action = document.createElement("td");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "student-action-link";

            if (record.accounts === null) {
                button.textContent = "Chưa xác định";
                button.disabled = true;
            } else if (account) {
                button.textContent = "Xem chi tiết";

                button.addEventListener("click", function () {
                    const detail = el("studentAccountDetail");
                    detail.replaceChildren();

                    const heading = document.createElement("strong");
                    heading.textContent =
                        "Thông tin tài khoản: " +
                        account.username;

                    const info = document.createElement("p");
                    info.textContent =
                        "Trạng thái: " +
                        (
                            account.isActive
                                ? "Hoạt động"
                                : "Đã vô hiệu hóa"
                        ) +
                        ". Quyền xem điểm: của chính mình.";

                    const note = document.createElement("p");
                    note.textContent =
                        "Chức năng thay đổi trạng thái " +
                        "cần kết nối đúng API quản lý tài khoản " +
                        "trước khi sử dụng.";

                    detail.append(heading, info, note);
                    detail.hidden = false;
                });
            } else {
                button.textContent = "Cấp tài khoản";

                button.addEventListener("click", function () {
                    returnFromGrant = "accounts";
                    activate("grant", null);

                    const actionButton = actionButtons.get(
                        String(record.student.studentId)
                    )?.account;

                    if (actionButton) actionButton.click();
                });
            }

            action.appendChild(button);
            tr.appendChild(action);
            tbody.appendChild(tr);
        });

        container.appendChild(table);

        el("studentAccountOverviewStatus").textContent =
            "Danh sách tài khoản theo bộ lọc hiện tại.";
    }

    function renderUnissuedList() {
        const container = el("studentUnissuedTable");
        container.replaceChildren();

        const available = displayRecords.filter(function (record) {
            return Array.isArray(record.accounts) &&
                record.accounts.length === 0;
        });

        // Figma trang 14: bang gom dung 3 cot.
        const table = makeTable(
            ["Mã HS", "Học sinh", "Trạng thái"],
            []
        );

        const tbody = table.querySelector("tbody");

        available.forEach(function (record) {
            const student = record.student;
            const row = document.createElement("tr");

            row.className = "student-unissued-row";
            row.title = "Chọn học sinh để cấp tài khoản";

            const codeCell = makeCell(student.studentCode);
            codeCell.title = String(student.studentCode);

            const nameCell = document.createElement("td");
            const chooseButton = document.createElement("button");

            chooseButton.type = "button";
            chooseButton.className = "student-unissued-name-button";
            chooseButton.textContent = student.fullName;

            chooseButton.setAttribute(
                "aria-label",
                "Chọn học sinh " + student.fullName +
                    ", mã " + student.studentCode +
                    " để cấp tài khoản"
            );

            nameCell.appendChild(chooseButton);

            row.append(
                codeCell,
                nameCell,
                makeCell("Chưa cấp")
            );

            function openAccount() {
                // Su dung chinh luong cap tai khoan da PASS.
                const accountButton = actionButtons.get(
                    String(student.studentId)
                )?.account;

                if (!accountButton) {
                    console.warn(
                        "Không tìm thấy thao tác cấp tài khoản:",
                        student.studentCode
                    );
                    return;
                }

                accountButton.click();

                // Hien thi hoc sinh da chon theo Figma.
                const info = el("studentAccountSelected");
                const heading = document.createElement("strong");

                heading.textContent =
                    student.studentCode + " • " + student.fullName;

                info.replaceChildren(heading);

                // Hien thi lop va nien khoa neu co du lieu.
                const enrollment = record.enrollment;

                if (
                    enrollment?.classCode &&
                    enrollment?.academicYearCode
                ) {
                    const subline = document.createElement("span");
                    subline.className = "student-account-class-info";

                    subline.textContent =
                        "Lớp " + enrollment.classCode +
                        " – Niên khóa " + enrollment.academicYearCode;

                    info.appendChild(subline);
                }
            }

            // Cho phep chon bang cach nhan vao ca dong.
            row.addEventListener("click", openAccount);

            // Ho tro chon bang ban phim.
            chooseButton.addEventListener("click", function (event) {
                event.stopPropagation();
                openAccount();
            });

            tbody.appendChild(row);
        });

        container.appendChild(table);

        if (available.length === 0) {
            const message = document.createElement("p");
            message.className = "student-muted-note";

            message.textContent =
                "Không có học sinh chưa cấp tài khoản " +
                "trong danh sách đã tra cứu.";

            container.appendChild(message);
        }
    }

    const titles = {
        list: [
            "Quản lý học sinh",
            "Tra cứu, thêm và cập nhật học sinh " +
            "theo niên khóa, khối và lớp."
        ],
        form: [
            "Quản lý học sinh",
            "Thêm mới học sinh, bảo toàn lịch sử " +
            "phân lớp theo từng niên khóa."
        ],
        accounts: [
            "Quản lý tài khoản học sinh",
            "Cấp và quản lý trạng thái tài khoản; " +
            "học sinh chỉ được xem điểm của chính mình."
        ],
        grant: [
            "Quản lý tài khoản học sinh",
            "Cấp tên đăng nhập cho học sinh " +
            "chưa có tài khoản."
        ],
        utility: [
            "Quản lý học sinh",
            "Phân lớp, chuyển lớp và tra cứu lịch sử " +
            "theo đúng quy tắc nghiệp vụ."
        ]
    };

    function activate(mode, panelId) {
        screen = mode;
        activePanelId = panelId || null;

        panelIds.forEach(function (id) {
            if (id !== activePanelId) {
                el(id).hidden = true;
            }
        });

        el("studentListScreen").hidden = mode !== "list";
        el("studentFormScreen").hidden = mode !== "form";
        el("studentAccountsScreen").hidden = mode !== "accounts";
        el("studentGrantScreen").hidden = mode !== "grant";
        el("studentUtilityScreen").hidden = mode !== "utility";

        if (activePanelId) {
            el(activePanelId).hidden = false;
        }

        el("studentGrantPlaceholder").hidden =
            mode === "grant" && !!activePanelId;

        const title = titles[mode];
        el("studentPageTitle").textContent = title[0];
        el("studentPageDescription").textContent = title[1];

        if (mode === "form") {
            renderMiniList();
        }

        if (mode === "accounts") {
            renderAccountOverview();
        }

        if (mode === "grant") {
            renderUnissuedList();
        }

        window.scrollTo(0, 0);
    }

    function returnToPreviousScreen() {
        if (screen === "grant" &&
            returnFromGrant === "accounts") {
            activate("accounts", null);
            loadStudents();
        } else {
            activate("list", null);
        }
    }

    function watchPanelChanges() {
        const observer = new MutationObserver(function (mutations) {
            const opened = mutations
                .filter(function (mutation) {
                    return mutation.attributeName === "hidden" &&
                        !mutation.target.hidden;
                })
                .map(function (mutation) {
                    return mutation.target.id;
                })
                .filter(function (id) {
                    return panelIds.includes(id);
                });

            if (opened.length > 0) {
                const last = opened[opened.length - 1];

                if (last === "studentFormPanel") {
                    activate("form", last);
                } else if (last === "studentAccountPanel") {
                    activate("grant", last);
                } else {
                    activate("utility", last);
                }

                return;
            }

            if (activePanelId && el(activePanelId).hidden) {
                returnToPreviousScreen();
            }
        });

        panelIds.forEach(function (id) {
            observer.observe(el(id), {
                attributes: true,
                attributeFilter: ["hidden"]
            });
        });
    }

    function watchDuplicateErrors() {
        [
            ["studentFormMessage", "studentFormPanel"],
            ["studentAccountMessage", "studentAccountPanel"]
        ].forEach(function (pair) {
            const message = el(pair[0]);
            const panel = el(pair[1]);

            const observer = new MutationObserver(function () {
                const text = normalizeText(message.textContent);

                const duplicate =
                    text.includes("ton tai") ||
                    text.includes("da duoc su dung") ||
                    text.includes("duplicate") ||
                    text.includes("already exists") ||
                    text.includes("student_code_exists") ||
                    text.includes("username_exists");

                panel.classList.toggle(
                    "has-duplicate",
                    duplicate
                );
            });

            observer.observe(message, {
                childList: true,
                subtree: true,
                characterData: true
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        renderNavigation("admin", "sidebarNavigation");

        watchPanelChanges();
        watchDuplicateErrors();

        el("studentGradeFilter")
            .addEventListener("change", function () {
                filterClassesByGrade();
                loadStudents();
            });

        el("studentKeywordFilter")
            .addEventListener("input", function () {
                // Loc khi nhan Tim kiem, tranh goi API
                // lien tuc trong luc go.
            });

        el("studentFilterForm")
            .addEventListener("submit", function () {
                // loadStudents duoc xu ly o file nghiep vu.
            });

        el("resetStudentFilterButton")
            .addEventListener("click", function () {
                el("studentGradeFilter").value = "";
                el("studentKeywordFilter").value = "";
            });

        el("studentFormClose")
            .addEventListener("click", function () {
                el("cancelStudentButton").click();
            });

        el("studentAccountClose")
            .addEventListener("click", function () {
                el("cancelStudentAccountButton").click();
            });

        el("studentCreateAccount")
            .addEventListener("change", function () {
                // Tai khoan se duoc cap sau khi
                // ho so hoc sinh duoc tao thanh cong.
            });

        el("studentForm")
            .addEventListener("submit", function () {
                if (
                    !el("studentForm").dataset.editStudentId &&
                    el("studentCreateAccount").checked
                ) {
                    pendingAccountCode =
                        el("studentCodeInput").value.trim();
                } else {
                    pendingAccountCode = null;
                }
            }, true);

        el("cancelStudentButton")
            .addEventListener("click", function () {
                pendingAccountCode = null;
                el("studentCreateAccount").checked = false;
            });

        el("manageStudentAccountsButton")
            .addEventListener("click", function () {
                prepareAccountFilters();
                activate("accounts", null);
            });

        el("closeAccountOverviewButton")
            .addEventListener("click", function () {
                activate("list", null);
            });

        el("accountFilterForm")
            .addEventListener("submit", function (event) {
                event.preventDefault();
                renderAccountOverview();
            });

        el("openGrantScreenButton")
            .addEventListener("click", function () {
                returnFromGrant = "accounts";
                activate("grant", null);
            });

        el("accountYearFilter")
            .addEventListener("change", function () {
                // Loc theo nien khoa hien tai.
                renderAccountOverview();
            });

        el("accountClassFilter")
            .addEventListener("change", renderAccountOverview);

        el("cancelStudentAccountButton")
            .addEventListener("click", function () {
                // File nghiep vu dong bieu mau;
                // MutationObserver chuyen man hinh.
            });
    });
})();
