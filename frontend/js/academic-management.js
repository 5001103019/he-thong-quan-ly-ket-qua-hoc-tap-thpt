
/*
 * VT3-04 - Quan ly nien khoa, khoi va lop
 * Su dung API client va UI components chung cua nhom.
 */

// Lay du lieu danh sach tu phan hoi API.
function getCatalogData(response) {
    if (
        !response ||
        response.success !== true ||
        !Array.isArray(response.data)
    ) {
        throw new Error("Du lieu API khong hop le.");
    }

    return response.data;
}

// Tao cac lua chon cho bo loc.
function renderFilter(selectId, rows, valueKey, labelKey, prefix = "") {
    const select = document.getElementById(selectId);

    // Giu lai lua chon "Tat ca" da co trong HTML.
    select.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Tất cả";
    select.appendChild(allOption);

    rows.forEach(function (row) {
        const option = document.createElement("option");

        option.value = String(row[valueKey]);
        option.textContent = prefix + String(row[labelKey]);

        select.appendChild(option);
    });
}

// Dua du lieu danh muc vao o chon cua form lop hoc.
function renderClassFormOptions(
    selectId,
    rows,
    valueKey,
    labelKey,
    placeholder,
    prefix = ""
) {
    const select = document.getElementById(selectId);

    // Ghi nho gia tri dang chon.
    const previousValue = select.value;

    // Xoa cac lua chon cu.
    select.replaceChildren();

    // Tao lua chon mac dinh.
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = placeholder;
    select.appendChild(defaultOption);

    // Tao lua chon tu du lieu API.
    rows.forEach(function (row) {
        const option = document.createElement("option");

        option.value = String(row[valueKey]);
        option.textContent = prefix + String(row[labelKey]);

        // Luu so khoi de kiem tra ma lop khi them.
        if (row.gradeNumber !== undefined) {
            option.dataset.gradeNumber = String(row.gradeNumber);
        }

        select.appendChild(option);
    });

    // Giu lai gia tri cu neu van ton tai.
    const stillExists = Array.from(select.options).some(
        function (option) {
            return option.value === previousValue;
        }
    );

    if (stillExists) {
        select.value = previousValue;
    }
}

// Tai danh sach nien khoa va khoi.
async function loadAcademicCatalogs() {
    UIComponents.showLoading("academicYearStatus");
    UIComponents.showLoading("gradeStatus");

    try {
        const [yearResponse, gradeResponse] = await Promise.all([
            apiClient.get("/academic-years"),
            apiClient.get("/grades")
        ]);

        const academicYears = getCatalogData(yearResponse);
        const grades = getCatalogData(gradeResponse);

        // He thong chi cho phep toi da 2 nien khoa.
        const addAcademicYearButton =
            document.getElementById("addAcademicYearButton");

        if (academicYears.length >= 2) {
            addAcademicYearButton.disabled = true;
            addAcademicYearButton.title =
                "Hệ thống đã có đủ 2 niên khóa.";
        } else {
            addAcademicYearButton.disabled = false;
            addAcademicYearButton.removeAttribute("title");
        }

        // Hien thi bang nien khoa.
        const yearColumns = [
            { key: "code", label: "Niên khóa" },
            { key: "startYear", label: "Năm bắt đầu" },
            { key: "endYear", label: "Năm kết thúc" },
            { key: "status", label: "Trạng thái" }
        ];

        const yearTable = document.getElementById("academicYearTable");
        yearTable.replaceChildren();

        if (academicYears.length > 0) {

            // Tao bang nien khoa bang component chung.
            const table = UIComponents.createTable(
                yearColumns,
                academicYears
            );

            // Them cot thao tac.
            const actionHeader = document.createElement("th");
            actionHeader.textContent = "Thao tác";

            table.querySelector("thead tr")
                .appendChild(actionHeader);

            const tableRows = table.querySelectorAll("tbody tr");

            academicYears.forEach(function (year, index) {
                // Hien thi trang thai nien khoa bang tieng Viet.
                const statusCell = tableRows[index].querySelectorAll("td")[3];

                const statusLabels = {
                    PLANNED: "Dự kiến",
                    ACTIVE: "Đang hoạt động",
                    CLOSED: "Đã kết thúc"
                };

                statusCell.textContent =
                    statusLabels[year.status] || year.status;

                const actionCell = document.createElement("td");

                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.textContent = "Sửa trạng thái";
                editButton.className = "academic-action-link";

                editButton.addEventListener("click", function () {

                    const form = document.getElementById(
                        "academicYearForm"
                    );

                    form.reset();

                    // Ghi nhan dang chinh sua nien khoa nao.
                    form.dataset.editYearId = String(
                        year.academicYearId
                    );

                    document.getElementById(
                        "academicYearFormTitle"
                    ).textContent = "Sửa trạng thái niên khóa";

                    // Hien thi nam hoc hien tai, khong cho sua.
                    const startField = document.getElementById(
                        "yearStart"
                    );

                    startField.value = String(year.startYear);
                    startField.readOnly = true;

                    document.getElementById("yearEnd").value =
                        String(year.endYear);

                    document.getElementById("yearCode").value =
                        year.code;

                    // Hien thi trang thai hien tai.
                    document.getElementById("yearStatus").value =
                        year.status;

                    document.getElementById(
                        "saveAcademicYearButton"
                    ).textContent = "Lưu trạng thái";

                    UIComponents.clear("academicYearFormMessage");

                    document.getElementById(
                        "academicYearFormPanel"
                    ).hidden = false;

                    document.getElementById("yearStatus").focus();
                });

                actionCell.appendChild(editButton);
                tableRows[index].appendChild(actionCell);
            });

            yearTable.appendChild(table);

        } else {
            UIComponents.showEmpty("academicYearTable");
        }

        // Hien thi bang khoi.
        const gradeColumns = [
            { key: "gradeNumber", label: "Khối" }
        ];

        const gradeTable = document.getElementById("gradeTable");
        gradeTable.replaceChildren();

        if (grades.length > 0) {
            gradeTable.appendChild(
                UIComponents.createTable(gradeColumns, grades)
            );
        } else {
            UIComponents.showEmpty("gradeTable");
        }

        // Do du lieu that vao bo loc.
        renderFilter(
            "academicYearFilter",
            academicYears,
            "academicYearId",
            "code"
        );

        renderFilter(
            "gradeFilter",
            grades,
            "gradeId",
            "gradeNumber",
            "Khối "
        );

        // Nap danh sach nien khoa tu API vao form them lop.
        renderClassFormOptions(
            "classYearSelect",
            academicYears,
            "academicYearId",
            "code",
            "Chọn niên khóa"
        );

        // Nap danh sach khoi tu API vao form them lop.
        renderClassFormOptions(
            "classGradeSelect",
            grades,
            "gradeId",
            "gradeNumber",
            "Chọn khối",
            "Khối "
        );

        // Chi cho them lop khi da co du hai danh muc.
        const addClassButton =
            document.getElementById("addClassButton");

        addClassButton.disabled =
            academicYears.length === 0 || grades.length === 0;

        UIComponents.clear("academicYearStatus");
        UIComponents.clear("gradeStatus");

        // Sau khi tai danh muc thi tai danh sach lop.
        await loadClasses();

    } catch (error) {
        // Khoa nut Them lop neu khong tai duoc danh muc.
        document.getElementById("addClassButton").disabled = true;

        UIComponents.showAlert(
            "academicYearStatus",
            "Không thể tải danh mục niên khóa và khối: " + error.message,
            "error"
        );

        UIComponents.clear("gradeStatus");
        UIComponents.clear("classStatus");
    }
}

// Dem yeu cau de tranh hien ket qua cu khi doi bo loc nhanh.
let latestClassRequest = 0;

// Tai danh sach lop theo bo loc.
async function loadClasses() {
    const requestNumber = ++latestClassRequest;

    const academicYearId =
        document.getElementById("academicYearFilter").value;

    const gradeId =
        document.getElementById("gradeFilter").value;

    // Chi gui tham so loc khi nguoi dung da chon.
    const params = new URLSearchParams();

    if (academicYearId !== "") {
        params.set("academicYearId", academicYearId);
    }

    if (gradeId !== "") {
        params.set("gradeId", gradeId);
    }

    const query = params.toString();
    const endpoint = "/classes" + (query ? "?" + query : "");

    UIComponents.showLoading("classStatus");
    UIComponents.clear("classTable");

    try {
        const response = await apiClient.get(endpoint);
        const allClasses = getCatalogData(response);

        // Bo qua phan hoi cu truoc khi cap nhat giao dien.
        if (requestNumber !== latestClassRequest) {
            return;
        }

        // Cap nhat danh sach lop theo nien khoa va khoi.
        const classFilter = document.getElementById("classFilter");
        const previouslySelectedClass = classFilter.value;

        classFilter.replaceChildren();

        const defaultClassOption = document.createElement("option");
        defaultClassOption.value = "";
        defaultClassOption.textContent = "Tất cả";
        classFilter.appendChild(defaultClassOption);

        allClasses.forEach(function (classItem) {
            const option = document.createElement("option");
            option.value = String(classItem.classId);
            option.textContent = String(classItem.code || classItem.name);
            classFilter.appendChild(option);
        });

        // Giu lai lop da chon neu van nam trong danh sach.
        if (
            Array.from(classFilter.options).some(function (option) {
                return option.value === previouslySelectedClass;
            })
        ) {
            classFilter.value = previouslySelectedClass;
        }

        const selectedClassId = classFilter.value;

        const selectedStatus = document
            .getElementById("classStatusFilter")
            .value;

        // Loc theo lop va trang thai.
        const classes = allClasses.filter(function (classItem) {
            const matchesClass =
                selectedClassId === "" ||
                String(classItem.classId) === selectedClassId;

            const matchesStatus =
                selectedStatus === "" ||
                classItem.status === selectedStatus;

            return matchesClass && matchesStatus;
        });

        const classColumns = [
            { key: "academicYearCode", label: "Niên khóa" },
            { key: "gradeNumber", label: "Khối" },
            { key: "code", label: "Mã lớp" },
            { key: "name", label: "Tên lớp" },
            { key: "status", label: "Trạng thái" }
        ];

        const classTable = document.getElementById("classTable");

        if (classes.length > 0) {

            // Tao bang lop bang component chung cua Yen.
            const table = UIComponents.createTable(
                classColumns,
                classes
            );

            // Them cot thao tac.
            const actionHeader = document.createElement("th");
            actionHeader.textContent = "Thao tác";

            table.querySelector("thead tr")
                .appendChild(actionHeader);

            const tableRows = table.querySelectorAll("tbody tr");

            // Them nut Sua cho tung lop.
            classes.forEach(function (classItem, index) {

            // Hien thi trang thai bang tieng Viet, giu nguyen du lieu API.
            const statusCell = tableRows[index].querySelectorAll("td")[4];

            if (statusCell) {
                if (classItem.status === "ACTIVE") {
                    statusCell.textContent = "Đang sử dụng";
                } else if (classItem.status === "INACTIVE") {
                    statusCell.textContent = "Ngừng hoạt động";
                } else {
                    statusCell.textContent = String(classItem.status || "");
                }
            }

                const actionCell = document.createElement("td");

                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.textContent = "Xem / Sửa";
                editButton.className = "academic-action-link";

                editButton.addEventListener("click", function () {

                    // Lay bieu mau lop hoc da tao.
                    const form = document.getElementById("classForm");

                    const formPanel =
                        document.getElementById("classFormPanel");

                    form.reset();

                    // Ghi nhan ID lop dang chinh sua.
                    form.dataset.editClassId =
                        String(classItem.classId);

                    form.dataset.originalClassCode = String(classItem.code);

                    // Hien thi tieu de va nut luu.
                    document.getElementById(
                        "classFormTitle"
                    ).textContent = "Sửa lớp học";

                    document.getElementById(
                        "saveClassButton"
                    ).textContent = "Lưu thay đổi";

                    // Dien thong tin nien khoa.
                    const yearSelect = document.getElementById(
                        "classYearSelect"
                    );

                    yearSelect.value =
                        String(classItem.academicYearId);

                    // Dien thong tin khoi.
                    const gradeSelect = document.getElementById(
                        "classGradeSelect"
                    );

                    gradeSelect.value =
                        String(classItem.gradeId);

                    // Khong cho doi nien khoa va khoi khi sua.
                    // Bao ve lich su phan lop cua hoc sinh.
                    yearSelect.disabled = true;
                    gradeSelect.disabled = true;

                    // Dien ma lop.
                    document.getElementById(
                        "classCodeInput"
                    ).value = classItem.code;

                    // Dien ten lop.
                    document.getElementById(
                        "classNameInput"
                    ).value = classItem.name;

                    // Dien trang thai lop.
                    document.getElementById(
                        "classStatusSelect"
                    ).value = classItem.status;

                    // Xoa thong bao cu.
                    UIComponents.clear("classFormMessage");

                    // Mo bieu mau.
                    formPanel.hidden = false;

                    // Dua con tro vao o ma lop.
                    document.getElementById(
                        "classCodeInput"
                    ).focus();
                });

                actionCell.appendChild(editButton);
                tableRows[index].appendChild(actionCell);
            });

            classTable.appendChild(table);

        } else {
            UIComponents.showEmpty("classTable");
        }

        UIComponents.clear("classStatus");

    } catch (error) {
        if (requestNumber !== latestClassRequest) {
            return;
        }

        UIComponents.showAlert(
            "classStatus",
            "Không thể tải danh sách lớp: " + error.message,
            "error"
        );
    }
}

/*
 * VT3-04 - Xu ly bieu mau them nien khoa.
 * Bieu mau chi hien khi nguoi dung nhan nut Them.
 */
document.addEventListener("DOMContentLoaded", function () {

    // Hien thi menu quan tri.
    renderNavigation("admin", "sidebarNavigation");

    // Lay cac thanh phan HTML.
    const addButton =
        document.getElementById("addAcademicYearButton");

    const cancelButton =
        document.getElementById("cancelAcademicYearButton");

    const formPanel =
        document.getElementById("academicYearFormPanel");

    const form =
        document.getElementById("academicYearForm");

    const yearStart =
        document.getElementById("yearStart");

    const yearEnd =
        document.getElementById("yearEnd");

    const yearCode =
        document.getElementById("yearCode");

    const yearStatus =
        document.getElementById("yearStatus");

    // Mo bieu mau khi nhan Them nien khoa.
    addButton.addEventListener("click", function () {

        form.reset();

        // Chuyen ve che do them moi.
        delete form.dataset.editYearId;

        document.getElementById(
            "academicYearFormTitle"
        ).textContent = "Thêm niên khóa";

        document.getElementById(
            "saveAcademicYearButton"
        ).textContent = "Lưu niên khóa";

        yearStart.readOnly = false;

        yearEnd.value = "";
        yearCode.value = "";
        yearStatus.value = "PLANNED";

        UIComponents.clear("academicYearFormMessage");

        formPanel.hidden = false;

        // Dua con tro vao o nam bat dau.
        yearStart.focus();
    });

    // Dong bieu mau khi nhan Huy.
    cancelButton.addEventListener("click", function () {

        formPanel.hidden = true;

        form.reset();

        UIComponents.clear("academicYearFormMessage");
    });

    // Tu tinh nam ket thuc va ma nien khoa.
    yearStart.addEventListener("input", function () {

        const startYear = Number(yearStart.value);

        // Chi xu ly khi nam bat dau hop le.
        if (
            yearStart.value === "" ||
            !Number.isInteger(startYear) ||
            startYear < 1000 ||
            startYear > 9998
        ) {
            yearEnd.value = "";
            yearCode.value = "";
            return;
        }

        const endYear = startYear + 1;

        yearEnd.value = String(endYear);
        yearCode.value = startYear + "-" + endYear;
    });

    // Gui du lieu them nien khoa den Backend.
    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        // Xac dinh dang them moi hay sua nien khoa.
        const editYearId = form.dataset.editYearId;
        const isEditing = Boolean(editYearId);

        // Lay nam bat dau do nguoi dung nhap.
        const startYear = Number(yearStart.value);

        // Kiem tra nam bat dau.
        if (
            yearStart.value === "" ||
            !Number.isInteger(startYear) ||
            startYear < 1000 ||
            startYear > 9998
        ) {
            UIComponents.showAlert(
                "academicYearFormMessage",
                "Năm bắt đầu phải là số nguyên từ 1000 đến 9998.",
                "error"
            );
            return;
        }

        // Tu tinh nam ket thuc va ma nien khoa.
        const endYear = startYear + 1;
        const code = `${startYear}-${endYear}`;
        const status = yearStatus.value;

        // Kiem tra trang thai.
        const validStatuses = ["PLANNED", "ACTIVE", "CLOSED"];

        if (!validStatuses.includes(status)) {
            UIComponents.showAlert(
                "academicYearFormMessage",
                "Trạng thái niên khóa không hợp lệ.",
                "error"
            );
            return;
        }

        const saveButton =
            document.getElementById("saveAcademicYearButton");

        // Khong cho nhan Luu nhieu lan trong khi xu ly.
        saveButton.disabled = true;
        UIComponents.showLoading("academicYearFormMessage");

        try {
            // Sua chi gui trang thai, khong thay doi ma va nam hoc.
            // Them moi van gui day du 4 truong.
            let response;

            if (isEditing) {
                response = await apiClient.patch(
                    "/academic-years/" + editYearId,
                    {
                        status: status
                    }
                );
            } else {
                response = await apiClient.post(
                    "/academic-years",
                    {
                        code: code,
                        startYear: startYear,
                        endYear: endYear,
                        status: status
                    }
                );
            }

            // Kiem tra ket qua tu Backend.
            if (!response || response.success !== true) {
                throw new Error("Không thể thêm niên khóa.");
            }

            // Dong va dat lai bieu mau sau khi luu.
            formPanel.hidden = true;
            form.reset();

            // Xoa che do sua, dua form ve trang thai ban dau.
            delete form.dataset.editYearId;
            yearStart.readOnly = false;

            UIComponents.clear("academicYearFormMessage");

            // Tai lai danh sach tu Backend.
            await loadAcademicCatalogs();

            // Hien thi thong bao phu hop voi thao tac.
            const successMessage = isEditing
                ? "Đã cập nhật trạng thái niên khóa " +
                  code + " thành công."
                : "Đã thêm niên khóa " +
                  code + " thành công.";

            UIComponents.showAlert(
                "academicYearStatus",
                successMessage,
                "success"
            );

        } catch (error) {
            // Hien thi loi do API tra ve.
            UIComponents.showAlert(
                "academicYearFormMessage",
                error.message,
                "error"
            );

        } finally {
            // Cho phep thao tac lai sau khi yeu cau ket thuc.
            saveButton.disabled = false;
        }
    });

    // Giu nguyen chuc nang loc lop da lam.
    document
        .getElementById("academicYearFilter")
        .addEventListener("change", loadClasses);

    document
        .getElementById("gradeFilter")
        .addEventListener("change", loadClasses);

    // ===== BIEU MAU THEM LOP =====

    // Lay cac thanh phan HTML.
    const addClassButton =
        document.getElementById("addClassButton");

    const cancelClassButton =
        document.getElementById("cancelClassButton");

    const classFormPanel =
        document.getElementById("classFormPanel");

    const classForm =
        document.getElementById("classForm");

    const classYearSelect =
        document.getElementById("classYearSelect");

    const classGradeSelect =
        document.getElementById("classGradeSelect");

    // Mo bieu mau khi nhan Them lop.
    addClassButton.addEventListener("click", function () {

        // Khong mo form neu chua tai duoc danh muc.
        if (addClassButton.disabled) {
            return;
        }

        // Xoa du lieu cua lan nhap truoc.
        classForm.reset();
        delete classForm.dataset.editClassId;

        classYearSelect.disabled = false;
        classGradeSelect.disabled = false;

        document.getElementById(
            "classFormTitle"
        ).textContent = "Thêm lớp học";

        document.getElementById(
            "saveClassButton"
        ).textContent = "Lưu lớp học";

        document.getElementById(
            "classStatusSelect"
        ).value = "ACTIVE";

        UIComponents.clear("classFormMessage");

        // Lay gia tri dang chon o bo loc lop.
        const selectedYear =
            document.getElementById("academicYearFilter").value;

        const selectedGrade =
            document.getElementById("gradeFilter").value;

        // Tu dong chon nien khoa neu dang loc.
        if (selectedYear !== "") {
            classYearSelect.value = selectedYear;
        }

        // Tu dong chon khoi neu dang loc.
        if (selectedGrade !== "") {
            classGradeSelect.value = selectedGrade;
        }

        // Hien thi bieu mau.
        classFormPanel.hidden = false;

        // Dua con tro vao o nhap ma lop.
        document.getElementById(
            "classCodeInput"
        ).focus();
    });

    // Dong bieu mau khi nhan Huy.
    cancelClassButton.addEventListener("click", function () {

        classFormPanel.hidden = true;

        classForm.reset();
        delete classForm.dataset.editClassId;

        UIComponents.clear("classFormMessage");
    });

    // Them lop hoc bang API cua Backend.
    classForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        // Xac dinh dang them lop hay sua lop.
        const editClassId = classForm.dataset.editClassId;
        const isEditing = Boolean(editClassId);

        // Lay du lieu nguoi dung nhap.
        const yearValue = classYearSelect.value;
        const gradeValue = classGradeSelect.value;

        const academicYearId = Number(yearValue);
        const gradeId = Number(gradeValue);

        const code = document
            .getElementById("classCodeInput")
            .value.trim();

        const name = document
            .getElementById("classNameInput")
            .value.trim();

        const status = document
            .getElementById("classStatusSelect")
            .value;

        // Lay so khoi that tu danh muc API.
        const gradeOption = classGradeSelect.selectedOptions[0];

        const gradeNumber = gradeOption
            ? gradeOption.dataset.gradeNumber
            : "";

        // Kiem tra nien khoa va khoi.
        if (
            yearValue === "" ||
            gradeValue === "" ||
            !Number.isSafeInteger(academicYearId) ||
            academicYearId <= 0 ||
            !Number.isInteger(gradeId) ||
            gradeId <= 0 ||
            gradeId > 32767
        ) {
            UIComponents.showAlert(
                "classFormMessage",
                "Vui lòng chọn niên khóa và khối hợp lệ.",
                "error"
            );
            return;
        }

        // Ma lop chi nhan chu khong dau, so, _ va -.
        if (!/^[A-Za-z0-9_-]{1,20}$/.test(code)) {
            UIComponents.showAlert(
                "classFormMessage",
                "Mã lớp phải có 1–20 ký tự, " +
                "chỉ gồm chữ không dấu, số, _ hoặc -.",
                "error"
            );
            return;
        }

        // Ma lop phai bat dau bang so khoi.
        // Vi du khoi 10: 10A1.
        const unchangedExistingCode = isEditing &&
            code === classForm.dataset.originalClassCode;

        if (
            !unchangedExistingCode &&
            (
                !gradeNumber ||
                !code.startsWith(gradeNumber) ||
                code.length <= gradeNumber.length
            )
        ) {
            UIComponents.showAlert(
                "classFormMessage",
                "Mã lớp không phù hợp với khối đã chọn.",
                "error"
            );
            return;
        }

        // Kiem tra ten lop.
        if (name.length === 0 || name.length > 100) {
            UIComponents.showAlert(
                "classFormMessage",
                "Tên lớp phải có từ 1 đến 100 ký tự.",
                "error"
            );
            return;
        }

        // Kiem tra trang thai.
        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            UIComponents.showAlert(
                "classFormMessage",
                "Trạng thái lớp không hợp lệ.",
                "error"
            );
            return;
        }

        const saveButton =
            document.getElementById("saveClassButton");

        saveButton.disabled = true;

        UIComponents.showLoading("classFormMessage");
        UIComponents.clear("classSaveMessage");

        try {
            // Goi API phu hop voi thao tac.
            let response;

            if (isEditing) {

                // Khi sua, khong thay doi nien khoa va khoi.
                response = await apiClient.patch(
                    "/classes/" + editClassId,
                    {
                        code: code,
                        name: name,
                        status: status
                    }
                );

            } else {

                // Khi them moi, gui day du thong tin lop.
                response = await apiClient.post(
                    "/classes",
                    {
                        academicYearId: academicYearId,
                        gradeId: gradeId,
                        code: code,
                        name: name,
                        status: status
                    }
                );

            }

            if (!response || response.success !== true) {
                throw new Error("Không thể thêm lớp học.");
            }

            // Dong va xoa du lieu bieu mau.
            classFormPanel.hidden = true;
            classForm.reset();
            delete classForm.dataset.editClassId;

            UIComponents.clear("classFormMessage");

            // Thong bao phu hop voi thao tac.
            const successMessage = isEditing
                ? "Đã cập nhật lớp " + code + " thành công."
                : "Đã thêm lớp " + code + " thành công.";

            UIComponents.showAlert(
                "classSaveMessage",
                successMessage,
                "success"
            );

            // Tai lai danh sach lop sau khi luu.
            await loadClasses();

        } catch (error) {
            UIComponents.showAlert(
                "classFormMessage",
                error.message,
                "error"
            );

        } finally {
            // Cho phep bam Luu lai sau khi xu ly xong.
            saveButton.disabled = false;
        }
    });

    // Bo loc theo giao dien Figma.
    document.getElementById("academicClassFilterForm")
        .addEventListener("submit", function (event) {
            event.preventDefault();
            loadClasses();
        });

    // Cap nhat khi thay doi lop.
    document.getElementById("classFilter")
        .addEventListener("change", loadClasses);

    // Cap nhat khi thay doi trang thai.
    document.getElementById("classStatusFilter")
        .addEventListener("change", loadClasses);

    // Tai du lieu danh muc tu API.
    loadAcademicCatalogs();
});
