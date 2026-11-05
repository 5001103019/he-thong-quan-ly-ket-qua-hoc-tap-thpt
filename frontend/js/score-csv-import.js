
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // Giu nguyen menu chung cua nhom
    if (typeof renderNavigation === "function") {
        renderNavigation("admin", "sidebarNavigation");

        document.querySelectorAll("#sidebarNavigation a")
            .forEach(function (link) {
                if (
                    link.textContent.trim() ===
                    "Import / Export CSV"
                ) {
                    link.href = "score-csv-import.html";
                    link.classList.remove("menu-placeholder");
                    link.removeAttribute("aria-disabled");
                    link.classList.add("active");
                }
            });
    }

    const API = "/api/v1/score-import";
    const COMPONENTS = ["QT1", "QT2", "QT3", "GK", "CK"];

    const $ = function (id) {
        return document.getElementById(id);
    };

    // Cac thanh phan giao dien
    const yearSelect = $("academicYear");
    const gradeSelect = $("grade");
    const classSelect = $("classroom");
    const subjectSelect = $("subject");

    const fileInput = $("csvFile");
    const selectedFileName = $("selectedFileName");

    const nextButton = $("nextButton");
    const confirmButton = $("confirmImportButton");
    const showErrorsButton = $("showCsvErrorsButton");

    const importCard = document.querySelector(
        ".csv-import-card"
    );

    const importActions = document.querySelector(
        ".csv-actions"
    );

    const previewStep = $("csvPreviewStep");
    const errorStep = $("csvErrorStep");

    const pageTitle = document.querySelector(
        ".page-title"
    );

    const pageDescription = document.querySelector(
        ".csv-page > .page-description"
    );

    const previewWarning = document.querySelector(
        ".csv-preview-warning"
    );

    const errorAlert = document.querySelector(
        ".csv-error-alert"
    );

    const previewBody = $("csvPreviewBody");
    const errorBody = $("csvErrorBody");

    const message = $("csvMessage");
    const previewStatus = $("csvPreviewStatus");
    

    // Du lieu cua mot lan Import
    let csvText = "";
    let previewData = null;
    let busy = false;

   
    // Lay du lieu bo loc tu API that.
    let allClasses = [];

    function setOptions(select, items, getValue, getLabel) {
        select.replaceChildren(
            new Option("-- Chon --", "")
        );

        for (const item of items) {
            select.add(new Option(
                getLabel(item),
                String(getValue(item))
            ));
        }

        select.disabled = items.length === 0;

        if (items.length > 0) {
            select.selectedIndex = 1;
        }
    }

    // Chi hien thi lop thuoc nien khoa va khoi da chon.
    function updateClassByGrade() {
        const classes = allClasses.filter(function (item) {
            return (
                item.academicYearCode === yearSelect.value &&
                String(item.gradeNumber) === gradeSelect.value
            );
        });

        setOptions(
            classSelect,
            classes,
            item => item.code,
            item => item.name + " (" + item.code + ")"
        );
    }

    async function loadFiltersFromApi() {
        const selects = [
            yearSelect,
            gradeSelect,
            classSelect,
            subjectSelect
        ];

        for (const select of selects) {
            select.replaceChildren(
                new Option("Dang tai du lieu...", "")
            );
            select.disabled = true;
        }

        try {
            const paths = [
                "academic-years",
                "grades",
                "classes",
                "subjects"
            ];

            const datasets = await Promise.all(
                paths.map(async function (path) {
                    const response = await fetch(
                        "/api/v1/" + path,
                        { credentials: "same-origin" }
                    );

                    if (!response.ok) {
                        throw new Error(
                            path + ": HTTP " + response.status
                        );
                    }

                    const result = await response.json();

                    if (
                        result.success !== true ||
                        !Array.isArray(result.data)
                    ) {
                        throw new Error(
                            path + ": Du lieu khong hop le"
                        );
                    }

                    return result.data;
                })
            );

            const [years, grades, classes, subjects] =
                datasets;

            allClasses = classes;

            setOptions(
                yearSelect,
                years,
                item => item.code,
                item => item.code
            );

            setOptions(
                gradeSelect,
                grades,
                item => item.gradeNumber,
                item => "Khoi " + item.gradeNumber
            );

            setOptions(
                subjectSelect,
                subjects,
                item => item.code,
                item => item.name
            );

            updateClassByGrade();

        } catch (error) {
            report(
                message,
                "Khong tai duoc bo loc: " + error.message,
                true
            );
        }
    }

    yearSelect.addEventListener(
        "change",
        updateClassByGrade
    );

    gradeSelect.addEventListener(
        "change",
        updateClassByGrade
    );

    loadFiltersFromApi();

    // Chuyen giua ba man hinh
    function showStep(step) {
        importCard.hidden = step !== "import";
        importActions.hidden = step !== "import";

        previewStep.hidden = step !== "preview";
        errorStep.hidden = step !== "errors";

        const titles = {
            import: "Import điểm từ CSV",
            preview: "Xem trước dữ liệu CSV",
            errors: "Kiểm tra lỗi CSV"
        };

        const descriptions = {
            import:
                "Tải tệp điểm lên để kiểm tra trước khi ghi dữ liệu.",

            preview:
                "Bước 2 – Kiểm tra từng dòng trước khi xác nhận nhập.",

            errors:
                "Các bản ghi không hợp lệ cần được sửa trước khi nhập."
        };

        pageTitle.textContent = titles[step];
        pageDescription.textContent = descriptions[step];

        window.scrollTo(0, 0);
    }

    // Thong bao trang thai
    function report(element, content, isError = false) {
        element.textContent = content || "";

        element.classList.toggle(
            "csv-status-error",
            Boolean(isError)
        );
    }

    // Tao o bang bang textContent de tranh HTML khong an toan
    function addCell(row, value, className = "") {
        const cell = document.createElement("td");

        cell.textContent =
            value === null ||
            value === undefined ||
            value === ""
                ? "—"
                : String(value);

        if (className) {
            cell.className = className;
        }

        row.append(cell);
    }

    // Lay gia tri diem tu ket qua Preview
    function scoreOf(row, component) {
        const raw =
            row.scores?.[component] ??
            row.values?.[component] ??
            row.raw?.[component];

        // Diem 0 la gia tri hop le
        if (
            typeof raw === "number" ||
            typeof raw === "string"
        ) {
            return raw;
        }

        if (raw && typeof raw === "object") {
            if (
                raw.scoreValue !== null &&
                raw.scoreValue !== undefined
            ) {
                return raw.scoreValue;
            }

            if (
                raw.value !== null &&
                raw.value !== undefined
            ) {
                return raw.value;
            }
        }

        const changes = [
            ...(Array.isArray(row.changes)
                ? row.changes
                : []),

            ...(Array.isArray(row.updates)
                ? row.updates
                : [])
        ];

        const change = changes.find(function (item) {
            return (
                item.componentType === component ||
                item.component === component
            );
        });

        return (
            change?.scoreValue ??
            change?.newValue ??
            change?.value ??
            null
        );
    }

    // Lay danh sach loi cua mot dong
    function issuesFor(row, issues) {
        return issues.filter(function (issue) {
            return Number(issue.lineNumber) ===
                Number(row.lineNumber);
        });
    }

    // Hien thi man hinh loi CSV
    function renderIssues(data) {
        errorBody.replaceChildren();

        const errors = Array.isArray(data.errors)
            ? data.errors
            : [];

        const warnings = Array.isArray(data.warnings)
            ? data.warnings
            : [];

        const rows = Array.isArray(data.rows)
            ? data.rows
            : [];

        const issues = [
            ...errors.map(function (item) {
                return {
                    ...item,
                    kind: "error"
                };
            }),

            ...warnings.map(function (item) {
                return {
                    ...item,
                    kind: "warning"
                };
            })
        ];

        issues.forEach(function (issue) {
            const tr = document.createElement("tr");

            const sourceRow = rows.find(function (row) {
                return Number(row.lineNumber) ===
                    Number(issue.lineNumber);
            });

            const column =
                issue.column ||
                issue.component ||
                "—";

            const value =
                issue.value ??
                issue.scoreValue ??
                (
                    sourceRow &&
                    COMPONENTS.includes(column)
                        ? scoreOf(sourceRow, column)
                        : null
                );

            let styleName = "csv-warning-text";

            if (issue.code === "SCORE_LOCKED") {
                styleName = "csv-locked-text";
            } else if (issue.kind === "error") {
                styleName = "csv-error-text";
            }

            addCell(tr, issue.lineNumber);

            addCell(
                tr,
                issue.studentCode ||
                sourceRow?.codes?.studentCode ||
                "—"
            );

            addCell(tr, column);
            addCell(tr, value);

            addCell(
                tr,
                (
                    issue.code || "NOTICE"
                ) +
                ": " +
                (
                    issue.message || "Cần kiểm tra"
                ),
                styleName
            );

            errorBody.append(tr);
        });

        // Trang thai khong co loi
        if (issues.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");

            td.colSpan = 5;
            td.className = "csv-empty-cell";
            td.textContent =
                "Không có lỗi hoặc cảnh báo trong tệp CSV.";

            tr.append(td);
            errorBody.append(tr);
        }

        // Chi hien lien ket khi co loi/canh bao
        showErrorsButton.hidden = issues.length === 0;

        showErrorsButton.textContent =
            "Xem chi tiết lỗi/cảnh báo (" +
            issues.length +
            ")";

        const title = errorAlert.querySelector("strong");
        const description = errorAlert.querySelector("p");

        title.textContent =
            errors.length > 0
                ? "Không thể nhập toàn bộ dữ liệu"
                : "Không có lỗi chặn Import";

        description.textContent =
            errors.length > 0
                ? errors.length +
                  " lỗi, " +
                  warnings.length +
                  " cảnh báo. Các dòng lỗi hoặc cột bị khóa " +
                  "không được ghi đè."

                : warnings.length +
                  " cảnh báo. Chỉ những thay đổi hợp lệ " +
                  "mới được ghi.";

        errorAlert.classList.toggle(
            "is-warning",
            errors.length === 0
        );
    }

    // Dem dong du dieu kien
    function eligibleCount(data) {
        if (Array.isArray(data.eligibleRows)) {
            return data.eligibleRows.length;
        }

        const number = Number(data.eligibleRows);

        if (
            data.eligibleRows !== undefined &&
            Number.isFinite(number)
        ) {
            return number;
        }

        return (data.rows || []).filter(function (row) {
            return row.eligible === true;
        }).length;
    }

    // Hien thi man hinh Preview
    function renderPreview(data, canConfirm) {
        previewBody.replaceChildren();

        const rows = Array.isArray(data.rows)
            ? data.rows
            : [];

        const errors = Array.isArray(data.errors)
            ? data.errors
            : [];

        const warnings = Array.isArray(data.warnings)
            ? data.warnings
            : [];

        rows.forEach(function (row) {
            const tr = document.createElement("tr");

            addCell(tr, row.lineNumber);

            addCell(
                tr,
                row.codes?.studentCode ||
                row.studentCode ||
                "—"
            );

            COMPONENTS.forEach(function (component) {
                addCell(
                    tr,
                    scoreOf(row, component)
                );
            });

            const rowErrors = issuesFor(
                row,
                errors
            );

            const rowWarnings = issuesFor(
                row,
                warnings
            );

            let status;

            if (rowErrors.length > 0) {
                status = "Không hợp lệ";
            } else if (row.eligible) {
                status = "Hợp lệ";
            } else {
                status = "Không có điểm cần cập nhật";
            }

            if (rowWarnings.length > 0) {
                status +=
                    "; " +
                    rowWarnings.length +
                    " cảnh báo";
            }

            addCell(
                tr,
                status,
                rowErrors.length > 0
                    ? "csv-error-text"
                    : ""
            );

            previewBody.append(tr);
        });

        // Trang thai khong co du lieu
        if (rows.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");

            td.colSpan = 8;
            td.className = "csv-empty-cell";

            td.textContent =
                "Chưa có dữ liệu để xem trước. " +
                "Hãy kiểm tra tệp CSV.";

            tr.append(td);
            previewBody.append(tr);
        }

        const eligible = eligibleCount(data);

        const warningTitle =
            previewWarning.querySelector("strong");

        const warningDescription =
            previewWarning.querySelector("p");

        if (
            errors.length > 0 ||
            warnings.length > 0
        ) {
            warningTitle.textContent =
                eligible +
                " dòng đủ điều kiện, " +
                errors.length +
                " lỗi, " +
                warnings.length +
                " cảnh báo";
        } else {
            warningTitle.textContent =
                eligible + " dòng hợp lệ";
        }

        warningDescription.textContent =
            "Chỉ nhập các thay đổi hợp lệ; " +
            "cột điểm bị khóa không được ghi đè. " +
            "Ô trống không tự chuyển thành điểm 0.";

        renderIssues(data);

        confirmButton.disabled =
            !canConfirm ||
            eligible === 0;
    }

    // Kiem tra pham vi CSV theo bo loc
    function scopeIssue(row) {
        const codes = row.codes || {};

        if (
            !codes.academicYearCode ||
            !codes.classCode ||
            !codes.subjectCode
        ) {
            // API se bao loi thieu ma rieng
            return null;
        }

        const yearMatches =
            String(codes.academicYearCode) ===
            yearSelect.value;

        const subjectMatches =
            String(codes.subjectCode).toUpperCase() ===
            subjectSelect.value.toUpperCase();

        const actualClass =
            String(codes.classCode).toUpperCase();

        const wantedClass =
            classSelect.value.toUpperCase();

        // Tuong thich ma lop demo da su dung
        const classMatches =
            actualClass === wantedClass ||
            actualClass.endsWith("_" + wantedClass);

        if (
            yearMatches &&
            subjectMatches &&
            classMatches
        ) {
            return null;
        }

        return {
            lineNumber: row.lineNumber,

            studentCode:
                codes.studentCode || "—",

            column: "Phạm vi",

            value:
                codes.academicYearCode +
                " / " +
                codes.classCode +
                " / " +
                codes.subjectCode,

            code: "SCOPE_MISMATCH",

            message:
                "Niên khóa, lớp hoặc môn trong CSV " +
                "không khớp bộ lọc đã chọn. " +
                "Quay lại chọn đúng phạm vi."
        };
    }

    // Goi API Backend
    async function apiPost(endpoint, payload) {
        const response = await fetch(
            API + endpoint,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify(payload)
            }
        );

        let result;

        try {
            result = await response.json();
        } catch (error) {
            throw new Error(
                "HTTP " +
                response.status +
                ": Máy chủ không trả dữ liệu JSON."
            );
        }

        if (
            !response.ok ||
            result.success !== true
        ) {
            const code =
                result.error?.code ||
                "HTTP_" + response.status;

            const detail =
                result.error?.message ||
                result.message ||
                "Không thể thực hiện yêu cầu.";

            if (response.status === 401) {
                throw new Error(
                    "Chưa đăng nhập. Vui lòng đăng nhập " +
                    "tài khoản Phòng Khảo thí trên hệ thống."
                );
            }

            if (response.status === 403) {
                throw new Error(
                    "Tài khoản không có quyền Import điểm CSV."
                );
            }

            throw new Error(
                code + ": " + detail
            );
        }

        return result.data;
    }

    // Chi mo trang qua Backend
    function requireServerPage() {
        if (
            location.protocol !== "http:" &&
            location.protocol !== "https:"
        ) {
            throw new Error(
                "Hãy mở giao diện qua Backend localhost:3000, " +
                "không mở bằng file://."
            );
        }
    }

    // Mo cua so chon tep CSV
    $("selectCsvButton").addEventListener(
        "click",
        function () {
            fileInput.click();
        }
    );

    // Kiem tra tep CSV da chon
    fileInput.addEventListener(
        "change",
        function () {
            const file = fileInput.files[0];

            csvText = "";
            previewData = null;

            confirmButton.disabled = true;
            report(message, "");

            if (!file) {
                selectedFileName.textContent = "";
                nextButton.disabled = true;
                return;
            }

            const valid =
                file.name.toLowerCase().endsWith(".csv") &&
                file.size <= 1024 * 1024;

            if (!valid) {
                fileInput.value = "";
                selectedFileName.textContent = "";
                nextButton.disabled = true;

                report(
                    message,
                    "Chỉ chấp nhận tệp .csv tối đa 1 MB.",
                    true
                );

                return;
            }

            selectedFileName.textContent =
                "Đã chọn: " + file.name;

            nextButton.disabled = false;
        }
    );

    // Thay doi bo loc thi huy ket qua Preview cu
    [
        yearSelect,
        gradeSelect,
        classSelect,
        subjectSelect
    ].forEach(function (select) {
        select.addEventListener(
            "change",
            function () {
                previewData = null;
                confirmButton.disabled = true;
            }
        );
    });

    // BUOC 1 -> BUOC 2: GOI PREVIEW
    nextButton.addEventListener(
        "click",
        async function () {
            if (
                busy ||
                !fileInput.files[0]
            ) {
                return;
            }

            busy = true;
            nextButton.disabled = true;

            report(
                message,
                "Đang kiểm tra tệp CSV..."
            );

            try {
                requireServerPage();

                csvText =
                    await fileInput.files[0].text();

                if (!csvText.trim()) {
                    throw new Error(
                        "Tệp CSV rỗng."
                    );
                }

                const data = await apiPost(
                    "/preview",
                    { csvText: csvText }
                );

                if (
                    !data ||
                    !Array.isArray(data.rows) ||
                    !Array.isArray(data.errors)
                ) {
                    throw new Error(
                        "API Preview trả về dữ liệu " +
                        "không đúng cấu trúc."
                    );
                }

                // Doi chieu pham vi cua tep
                const mismatches = data.rows
                    .map(scopeIssue)
                    .filter(Boolean);

                const displayData = {
                    ...data,

                    errors: [
                        ...data.errors,
                        ...mismatches
                    ],

                    eligibleRows:
                        mismatches.length > 0
                            ? 0
                            : eligibleCount(data)
                };

                // Neu sai pham vi, khong cho Confirm
                previewData =
                    mismatches.length > 0
                        ? null
                        : data;

                $("csvPreviewFileName").textContent =
                    "Xem trước: " +
                    fileInput.files[0].name;

                $("csvPreviewScope").textContent =
                    "Niên khóa " +
                    yearSelect.selectedOptions[0]
                        .textContent.trim() +
                    " • Lớp " +
                    classSelect.selectedOptions[0]
                        .textContent.trim() +
                    " • Môn " +
                    subjectSelect.selectedOptions[0]
                        .textContent.trim();

                renderPreview(
                    displayData,
                    mismatches.length === 0
                );

                if (mismatches.length > 0) {
                    report(
                        previewStatus,
                        "Phạm vi tệp không khớp lựa chọn. " +
                        "Vui lòng xem chi tiết lỗi và chọn lại.",
                        true
                    );
                } else {
                    report(
                        previewStatus,
                        ""
                    );
                }

                showStep("preview");

                report(
                    message,
                    ""
                );

            } catch (error) {
                previewData = null;

                report(
                    message,
                    error.message,
                    true
                );
            } finally {
                busy = false;

                nextButton.disabled =
                    !fileInput.files[0];
            }
        }
    );

    // Quay lai trang chon tep
    $("backToImportButton").addEventListener(
        "click",
        function () {
            showStep("import");
        }
    );

    // Mo trang chi tiet loi
    showErrorsButton.addEventListener(
        "click",
        function () {
            showStep("errors");
        }
    );

    // Quay lai trang Preview
    $("backToPreviewButton").addEventListener(
        "click",
        function () {
            showStep("preview");
        }
    );

    // Chon tep khac
    $("chooseAnotherCsvButton").addEventListener(
        "click",
        function () {
            showStep("import");

            csvText = "";
            previewData = null;

            fileInput.value = "";
            selectedFileName.textContent = "";

            report(message, "");

            nextButton.disabled = true;
            confirmButton.disabled = true;

            fileInput.click();
        }
    );

    // BUOC 2: XAC NHAN IMPORT
    confirmButton.addEventListener(
        "click",
        async function () {
            if (
                busy ||
                !previewData ||
                eligibleCount(previewData) === 0
            ) {
                return;
            }

            const accepted = window.confirm(
                "Xác nhận nhập các dòng điểm hợp lệ " +
                "vào hệ thống?"
            );

            if (!accepted) {
                return;
            }

            busy = true;
            confirmButton.disabled = true;

            report(
                previewStatus,
                "Đang nhập điểm..."
            );

            const previousRows =
                previewData.rows;

            try {
                requireServerPage();

                // Snapshot giup kiem tra version truoc ghi
                const previewRows = previousRows.map(
                    function (row) {
                        return {
                            lineNumber:
                                row.lineNumber,

                            scoreRecordId:
                                row.scoreRecordId ?? null,

                            expectedVersion:
                                row.expectedVersion ?? null
                        };
                    }
                );
               
                
                // Import khong yeu cau ly do rieng.
                // Backend truy vet qua related_log_id cua UNLOCK.
                const result = await apiPost(
                    "/confirm",
                    {
                        csvText: csvText,
                        previewRows: previewRows
                    }
                );

                // Khong su dung lai Preview sau Confirm
                previewData = null;

                const summary =
                    "Đã nhập " +
                    (result.importedRows || 0) +
                    " dòng; bỏ qua " +
                    (result.skippedRows || 0) +
                    " dòng; thay đổi " +
                    (result.changedComponents || 0) +
                    " cột điểm.";

                // Hien thi loi phat sinh luc Confirm
                renderIssues({
                    rows: previousRows,
                    errors: result.errors || [],
                    warnings: result.warnings || []
                });

                previewWarning.querySelector("strong")
                    .textContent =
                    "Kết quả xác nhận nhập";

                previewWarning.querySelector("p")
                    .textContent =
                    summary +
                    " Muốn nhập tiếp, hãy xem trước " +
                    "tệp một lần nữa.";

                report(
                    previewStatus,
                    summary
                );

            } catch (error) {
                previewData = null;

                report(
                    previewStatus,
                    error.message +
                    " Hãy xem trước lại " +
                    "trước khi thử xác nhận.",
                    true
                );
            } finally {
                busy = false;
                confirmButton.disabled = true;
            }
        }
    );

    // Khong Confirm khi chua Preview
    confirmButton.disabled = true;
});
