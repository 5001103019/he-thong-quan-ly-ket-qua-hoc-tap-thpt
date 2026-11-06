
/*
 * VT3-04 - Quan ly hoc sinh
 * Hien thi danh sach, tim kiem va loc ho so.
 * Su dung API va component dung chung cua nhom.
 */

// Kiem tra du lieu danh sach tu Backend.
function getStudentCatalogData(response) {
    if (
        !response ||
        response.success !== true ||
        !Array.isArray(response.data)
    ) {
        throw new Error("Dữ liệu API không hợp lệ.");
    }

    return response.data;
}

// Tao cac lua chon trong bo loc.
function fillStudentSelect(
    selectId,
    items,
    valueKey,
    labelKey,
    defaultLabel
) {
    const select = document.getElementById(selectId);
    const oldValue = select.value;

    select.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultLabel;
    select.appendChild(defaultOption);

    items.forEach(function (item) {
        const option = document.createElement("option");

        option.value = String(item[valueKey]);
        option.textContent = String(item[labelKey]);

        select.appendChild(option);
    });

    // Chi giu gia tri cu neu no van ton tai.
    const exists = Array.from(select.options).some(
        function (option) {
            return option.value === oldValue;
        }
    );

    select.value = exists ? oldValue : "";
}

// Danh sach ID nien khoa dang hoat dong.
let activeStudentAcademicYearIds = [];

// Tai danh sach nien khoa cho bo loc.
async function loadStudentAcademicYears() {
    const yearSelect =
        document.getElementById("studentYearFilter");

    yearSelect.disabled = true;

    try {
        const response = await apiClient.get("/academic-years");
        const years = getStudentCatalogData(response);

        // Chi xet nien khoa ACTIVE khi quyet dinh chuyen lop.
        activeStudentAcademicYearIds = years
            .filter(function (year) {
                return year.status === "ACTIVE";
            })
            .map(function (year) {
                return String(year.academicYearId);
            });

        fillStudentSelect(
            "studentYearFilter",
            years,
            "academicYearId",
            "code",
            "Tất cả niên khóa"
        );

    } catch (error) {
        UIComponents.showAlert(
            "studentFilterStatus",
            "Không thể tải danh sách niên khóa: " +
                error.message,
            "error"
        );

    } finally {
        yearSelect.disabled = false;
    }
}

// So thu tu yeu cau de tranh du lieu lop cu ghi de.
let latestStudentClassRequest = 0;

// Tai danh sach lop theo nien khoa dang chon.
async function loadStudentClasses() {
    const requestId = ++latestStudentClassRequest;

    const yearId =
        document.getElementById("studentYearFilter").value;

    const classSelect =
        document.getElementById("studentClassFilter");

    classSelect.disabled = true;

    // Xoa lua chon cu ngay khi doi nien khoa.
    fillStudentSelect(
        "studentClassFilter",
        [],
        "classId",
        "name",
        "Tất cả lớp"
    );

    try {
        const endpoint = yearId
            ? "/classes?academicYearId=" + encodeURIComponent(yearId)
            : "/classes";

        const response = await apiClient.get(endpoint);
        const classes = getStudentCatalogData(response);

        // Khong su dung ket qua cua yeu cau cu.
        if (requestId !== latestStudentClassRequest) {
            return;
        }

        fillStudentSelect(
            "studentClassFilter",
            classes,
            "classId",
            "name",
            "Tất cả lớp"
        );

        UIComponents.clear("studentFilterStatus");

    } catch (error) {
        if (requestId !== latestStudentClassRequest) {
            return;
        }

        UIComponents.showAlert(
            "studentFilterStatus",
            "Không thể tải danh sách lớp: " +
                error.message,
            "error"
        );

    } finally {
        if (requestId === latestStudentClassRequest) {
            classSelect.disabled = false;
        }
    }
}

// So thu tu yeu cau danh sach hoc sinh.
let latestStudentListRequest = 0;

// Tai danh sach hoc sinh theo bo loc.
async function loadStudents() {
    const requestId = ++latestStudentListRequest;

    const studentCode = document
        .getElementById("studentCodeFilter").value.trim();

    const fullName = document
        .getElementById("studentNameFilter").value.trim();

    const academicYearId =
        document.getElementById("studentYearFilter").value;

    const classId =
        document.getElementById("studentClassFilter").value;

    const status =
        document.getElementById("studentStatusFilter").value;

    // Tao tham so URL tu du lieu nguoi dung chon.
    const params = new URLSearchParams();

    if (studentCode) {
        params.set("studentCode", studentCode);
    }

    if (fullName) {
        params.set("fullName", fullName);
    }

    if (academicYearId) {
        params.set("academicYearId", academicYearId);
    }

    if (classId) {
        params.set("classId", classId);
    }

    if (status) {
        params.set("status", status);
    }

    const query = params.toString();

    const endpoint = "/students" + (query ? "?" + query : "");

    UIComponents.showLoading("studentListStatus");
    UIComponents.clear("studentTable");

    try {
        const response = await apiClient.get(endpoint);
        const students = getStudentCatalogData(response);

        if (requestId !== latestStudentListRequest) {
            return;
        }

        const columns = [
            { key: "studentCode", label: "Mã học sinh" },
            { key: "fullName", label: "Họ và tên" },
            { key: "dateOfBirth", label: "Ngày sinh" },
            { key: "status", label: "Trạng thái" }
        ];

        const tableContainer =
            document.getElementById("studentTable");

        if (students.length > 0) {

            // Tao bang hoc sinh bang component chung.
            const table = UIComponents.createTable(
                columns,
                students
            );

            // Bo sung cot Thao tac vao bang.
            const actionHeader = document.createElement("th");
            actionHeader.textContent = "Thao tác";

            table.querySelector("thead tr").appendChild(
                actionHeader
            );

            // Lay danh sach cac dong trong bang.
            const tableRows = table.querySelectorAll(
                "tbody tr"
            );

            // Tao nut Sua cho tung hoc sinh.
            students.forEach(function (student, index) {

                const actionCell = document.createElement("td");

                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.textContent = "Sửa";

                editButton.addEventListener("click", function () {

                    const studentForm = document.getElementById(
                        "studentForm"
                    );

                    const studentFormPanel = document.getElementById(
                        "studentFormPanel"
                    );

                    // Xoa du lieu bieu mau cu.
                    studentForm.reset();

                    // Luu ID cua hoc sinh dang sua.
                    studentForm.dataset.editStudentId = String(
                        student.studentId
                    );

                    // Doi tieu de bieu mau.
                    document.getElementById(
                        "studentFormTitle"
                    ).textContent = "Sửa hồ sơ học sinh";

                    // Doi ten nut Luu.
                    document.getElementById(
                        "saveStudentButton"
                    ).textContent = "Lưu thay đổi";

                    // Dien ma hoc sinh.
                    document.getElementById(
                        "studentCodeInput"
                    ).value = student.studentCode;

                    // Dien ho va ten.
                    document.getElementById(
                        "studentNameInput"
                    ).value = student.fullName;

                    // Dien ngay sinh theo dinh dang YYYY-MM-DD.
                    document.getElementById(
                        "studentBirthInput"
                    ).value = student.dateOfBirth;

                    // Hien thi trang thai hien tai.
                    // Trang thai duoc cap nhat bang API rieng.
                    const statusInput = document.getElementById(
                        "studentStatusInput"
                    );

                    statusInput.value = student.status;
                    statusInput.disabled = true;

                    // Xoa thong bao cu.
                    UIComponents.clear("studentFormMessage");
                    UIComponents.clear("studentSaveMessage");

                    // Mo bieu mau.
                    studentFormPanel.hidden = false;

                    // Dua con tro vao o ho ten.
                    document.getElementById(
                        "studentNameInput"
                    ).focus();
                });

                // Dua nut Sua vao o thao tac.
                actionCell.appendChild(editButton);

                // Nut cap tai khoan cho hoc sinh.
                const accountButton = document.createElement("button");
                accountButton.type = "button";
                accountButton.textContent = "Cấp tài khoản";

                accountButton.addEventListener("click", async function () {
                    const accountPanel = document.getElementById(
                        "studentAccountPanel"
                    );

                    const accountForm = document.getElementById(
                        "studentAccountForm"
                    );

                    // Xoa du lieu lan mo truoc.
                    accountForm.reset();
                    document.getElementById("saveStudentAccountButton").disabled = true;

                    // Ghi nhan ID cua hoc sinh duoc chon.
                    accountForm.dataset.studentId = String(student.studentId);

                    // Hien thi hoc sinh dang duoc cap tai khoan.
                    document.getElementById(
                        "studentAccountSelected"
                    ).textContent =
                        "Học sinh: " +
                        student.studentCode +
                        " - " +
                        student.fullName;

                    UIComponents.clear("studentAccountMessage");

                    // Mo bieu mau.
                    accountPanel.hidden = false;

                    // Kiem tra hoc sinh da co tai khoan hay chua.
                    UIComponents.showLoading("studentAccountMessage");

                    try {
                        const response = await apiClient.get(
                            "/khao-thi/demo-accounts?studentId=" +
                            encodeURIComponent(student.studentId)
                        );

                        if (
                            !response ||
                            response.success !== true ||
                            !response.data ||
                            !Array.isArray(response.data.accounts)
                        ) {
                            throw new Error("Dữ liệu tài khoản không hợp lệ.");
                        }

                        // Khong hien ket qua cu neu da chon hoc sinh khac.
                        if (
                            accountForm.dataset.studentId !==
                            String(student.studentId)
                        ) {
                            return;
                        }

                        const accounts = response.data.accounts;

                        if (accounts.length > 0) {
                            const accountInfo = accounts.map(function (account) {
                                return account.username +
                                    " (" +
                                    (account.isActive
                                        ? "Đang hoạt động"
                                        : "Đã vô hiệu hóa") +
                                    ")";
                            }).join(", ");

                            UIComponents.showAlert(
                                "studentAccountMessage",
                                "Học sinh đã có tài khoản: " + accountInfo,
                                "success"
                            );

                            // Khong tao them tai khoan trong bieu mau nay.
                            return;
                        }

                        // Chua co tai khoan: cho phep cap tai khoan.
                        UIComponents.clear("studentAccountMessage");

                        document.getElementById(
                            "saveStudentAccountButton"
                        ).disabled = false;

                        document.getElementById(
                            "studentAccountUsername"
                        ).focus();

                    } catch (error) {
                        if (
                            accountForm.dataset.studentId !==
                            String(student.studentId)
                        ) {
                            return;
                        }

                        UIComponents.showAlert(
                            "studentAccountMessage",
                            "Không thể tra cứu tài khoản: " + error.message,
                            "error"
                        );
                    }
                });

                // Dua nut vao cot Thao tac.
                actionCell.appendChild(accountButton);

                // Nut phan hoc sinh vao lop.
                if (student.status === "ACTIVE") {
                    const assignButton =
                        document.createElement("button");

                    assignButton.type = "button";
                    assignButton.textContent = "Phân lớp";

                    assignButton.addEventListener(
                        "click",
                        async function () {
                            const assignPanel =
                                document.getElementById(
                                    "studentAssignPanel"
                                );

                            const assignForm =
                                document.getElementById(
                                    "studentAssignForm"
                                );

                            // Xoa thong tin cua lan mo truoc.
                            assignForm.reset();

                            // Mo lai nut Luu cho lan phan lop moi.
                            document.getElementById(
                                "saveStudentAssignButton"
                            ).disabled = false;

                            // Ghi nhan dung hoc sinh duoc chon.
                            assignForm.dataset.studentId =
                                String(student.studentId);

                            document.getElementById(
                                "studentAssignSelected"
                            ).textContent =
                                "Học sinh: " +
                                student.studentCode +
                                " - " +
                                student.fullName;

                            UIComponents.clear(
                                "studentAssignMessage"
                            );

                            // Mo bieu mau phan lop.
                            assignPanel.hidden = false;

                            // Chua cho chon lop truoc khi chon nien khoa.
                            const classSelect =
                                document.getElementById(
                                    "studentAssignClass"
                                );

                            classSelect.replaceChildren();

                            const defaultClass =
                                document.createElement("option");

                            defaultClass.value = "";
                            defaultClass.textContent = "Chọn lớp học";

                            classSelect.appendChild(defaultClass);
                            classSelect.disabled = true;

                            // Tai nien khoa tu Backend.
                            const yearSelect =
                                document.getElementById(
                                    "studentAssignYear"
                                );

                            yearSelect.disabled = true;

                            try {
                                const response = await apiClient.get(
                                    "/academic-years"
                                );

                                const years = getStudentCatalogData(
                                    response
                                ).filter(function (year) {
                                    return year.status !== "CLOSED";
                                });

                                fillStudentSelect(
                                    "studentAssignYear",
                                    years,
                                    "academicYearId",
                                    "code",
                                    "Chọn niên khóa"
                                );

                            } catch (error) {
                                UIComponents.showAlert(
                                    "studentAssignMessage",
                                    "Không thể tải niên khóa: " +
                                        error.message,
                                    "error"
                                );

                            } finally {
                                yearSelect.disabled = false;
                            }

                            assignPanel.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });

                        }
                    );

                    actionCell.appendChild(assignButton);

                    // Tam khoa nut trong luc kiem tra lich su.
                    assignButton.disabled = true;

                    // Tao nut Chuyen lop, ban dau chua hien thi.
                    const transferButton =
                        document.createElement("button");

                    transferButton.type = "button";
                    transferButton.textContent = "Chuyển lớp";
                    transferButton.hidden = true;

                    actionCell.appendChild(transferButton);

                    // Kiem tra phan lop hien tai tu Backend.
                    getCurrentStudentEnrollments(student.studentId)
                        .then(function (enrollments) {

                            const currentEnrollment = enrollments.find(
                                function (enrollment) {
                                    return activeStudentAcademicYearIds.includes(
                                        String(enrollment.academicYearId)
                                    );
                                }
                            );

                            // Chua co lop trong nien khoa ACTIVE.
                            if (!currentEnrollment) {
                                assignButton.disabled = false;
                                return;
                            }

                            // Da co lop: hien Chuyen lop.
                            assignButton.hidden = true;
                            transferButton.hidden = false;

                            transferButton.addEventListener(
                                "click",
                                async function () {
                                    const transferPanel =
                                        document.getElementById(
                                            "studentTransferPanel"
                                        );

                                    const transferForm =
                                        document.getElementById(
                                            "studentTransferForm"
                                        );

                                    transferForm.reset();

                                    // Mo nut Xac nhan cho lan chuyen lop moi.
                                    document.getElementById(
                                        "saveStudentTransferButton"
                                    ).disabled = false;

                                    transferForm.dataset.studentId =
                                        String(student.studentId);

                                    transferForm.dataset.academicYearId =
                                        String(currentEnrollment.academicYearId);

                                    transferForm.dataset.currentClassId =
                                        String(currentEnrollment.classId);

                                    transferForm.dataset.gradeNumber =
                                        String(currentEnrollment.gradeNumber);

                                    document.getElementById(
                                        "studentTransferSelected"
                                    ).textContent =
                                        "Học sinh: " +
                                        student.studentCode +
                                        " - " +
                                        student.fullName;

                                    document.getElementById(
                                        "studentTransferCurrent"
                                    ).textContent =
                                        "Lớp hiện tại: " +
                                        currentEnrollment.classCode +
                                        " - Bắt đầu: " +
                                        currentEnrollment.startDate;

                                    document.getElementById(
                                        "studentTransferYear"
                                    ).value =
                                        currentEnrollment.academicYearCode;

                                    // Chuan bi danh sach lop moi.
                                    const classSelect =
                                        document.getElementById(
                                            "studentTransferClass"
                                        );

                                    classSelect.replaceChildren();

                                    const option =
                                        document.createElement("option");

                                    option.value = "";
                                    option.textContent = "Chọn lớp mới";
                                    classSelect.appendChild(option);
                                    classSelect.disabled = true;

                                    UIComponents.clear(
                                        "studentTransferMessage"
                                    );

                                    transferPanel.hidden = false;

                                    transferPanel.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start"
                                    });

                                    // Tai danh sach lop moi tu Backend.
                                    UIComponents.showLoading(
                                        "studentTransferMessage"
                                    );

                                    try {
                                        const response = await apiClient.get(
                                            "/classes?academicYearId=" +
                                            encodeURIComponent(
                                                currentEnrollment.academicYearId
                                            )
                                        );

                                        const classes =
                                            getStudentCatalogData(response);

                                        // Chi giu lop ACTIVE, cung khoi
                                        // va khac lop hien tai.
                                        const targetClasses = classes.filter(
                                            function (item) {
                                                return (
                                                    item.status === "ACTIVE" &&
                                                    String(item.gradeNumber) ===
                                                        String(currentEnrollment.gradeNumber) &&
                                                    String(item.classId) !==
                                                        String(currentEnrollment.classId)
                                                );
                                            }
                                        );

                                        // Bo qua ket qua neu da chon
                                        // hoc sinh khac hoac dong bieu mau.
                                        if (
                                            transferForm.dataset.studentId !==
                                                String(student.studentId) ||
                                            transferPanel.hidden
                                        ) {
                                            return;
                                        }

                                        fillStudentSelect(
                                            "studentTransferClass",
                                            targetClasses,
                                            "classId",
                                            "name",
                                            "Chọn lớp mới"
                                        );

                                        classSelect.disabled =
                                            targetClasses.length === 0;

                                        if (targetClasses.length === 0) {
                                            UIComponents.showAlert(
                                                "studentTransferMessage",
                                                "Không có lớp phù hợp để chuyển.",
                                                "error"
                                            );
                                        } else {
                                            UIComponents.clear(
                                                "studentTransferMessage"
                                            );
                                        }

                                    } catch (error) {
                                        if (
                                            transferForm.dataset.studentId !==
                                                String(student.studentId) ||
                                            transferPanel.hidden
                                        ) {
                                            return;
                                        }

                                        UIComponents.showAlert(
                                            "studentTransferMessage",
                                            "Không thể tải lớp mới: " +
                                                error.message,
                                            "error"
                                        );
                                    }
                                }
                            );
                        })
                        .catch(function (error) {
                            assignButton.textContent =
                                "Không tải được lớp";

                            assignButton.title = error.message;
                        });
                }

                // Nut xem lich su phan lop.
                // Hien thi cho ca ACTIVE va INACTIVE.
                const historyButton =
                    document.createElement("button");

                historyButton.type = "button";
                historyButton.textContent = "Lịch sử lớp";

                actionCell.appendChild(historyButton);

                historyButton.addEventListener(
                    "click",
                    async function () {
                        const panel = document.getElementById(
                            "studentEnrollmentPanel"
                        );

                        const status = document.getElementById(
                            "studentEnrollmentStatus"
                        );

                        const container = document.getElementById(
                            "studentEnrollmentTable"
                        );

                        panel.hidden = false;
                        container.replaceChildren();
                        status.textContent =
                            "Đang tải lịch sử phân lớp...";

                        panel.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                        try {
                            const response = await apiClient.get(
                                "/students/" +
                                encodeURIComponent(student.studentId) +
                                "/enrollments"
                            );

                            if (
                                !response ||
                                response.success !== true ||
                                !Array.isArray(response.data)
                            ) {
                                throw new Error(
                                    "Dữ liệu lịch sử không hợp lệ."
                                );
                            }

                            const history = response.data;

                            if (history.length === 0) {
                                status.textContent =
                                    "Học sinh chưa có lịch sử phân lớp.";
                                return;
                            }

                            const table =
                                document.createElement("table");

                            table.className = "data-table";

                            const thead =
                                document.createElement("thead");

                            const headerRow =
                                document.createElement("tr");

                            [
                                "Niên khóa",
                                "Lớp",
                                "Khối",
                                "Bắt đầu",
                                "Kết thúc",
                                "Lý do"
                            ].forEach(function (name) {
                                const th =
                                    document.createElement("th");

                                th.textContent = name;
                                headerRow.appendChild(th);
                            });

                            thead.appendChild(headerRow);
                            table.appendChild(thead);

                            const tbody =
                                document.createElement("tbody");

                            history.forEach(function (item) {
                                const tr =
                                    document.createElement("tr");

                                const values = [
                                    item.academicYearCode,
                                    item.classCode,
                                    item.gradeNumber,
                                    item.startDate,
                                    item.endDate === null
                                        ? "Đang học"
                                        : item.endDate,
                                    item.exitReason || "-"
                                ];

                                values.forEach(function (value) {
                                    const td =
                                        document.createElement("td");

                                    td.textContent = String(value ?? "");
                                    tr.appendChild(td);
                                });

                                tbody.appendChild(tr);
                            });

                            table.appendChild(tbody);
                            container.appendChild(table);

                            status.textContent =
                                "Lịch sử phân lớp: " +
                                student.studentCode;

                        } catch (error) {
                            status.textContent =
                                "Không tải được lịch sử: " +
                                error.message;
                        }
                    }
                );

                // Chi cho phep doi trang thai hop le.
                if (
                    student.status === "ACTIVE" ||
                    student.status === "INACTIVE"
                ) {
                    const nextStatus =
                        student.status === "ACTIVE"
                            ? "INACTIVE"
                            : "ACTIVE";

                    const statusButton =
                        document.createElement("button");

                    statusButton.type = "button";
                    statusButton.textContent =
                        nextStatus === "INACTIVE"
                            ? "Ngừng hoạt động"
                            : "Kích hoạt lại";

                    statusButton.addEventListener(
                        "click",
                        async function () {

                            const confirmed = window.confirm(
                                "Bạn có chắc muốn " +
                                statusButton.textContent.toLowerCase() +
                                " học sinh " +
                                student.studentCode +
                                " không?"
                            );

                            if (!confirmed) {
                                return;
                            }

                            statusButton.disabled = true;

                            try {
                                const response =
                                    await apiClient.patch(
                                        "/students/" +
                                        encodeURIComponent(
                                            student.studentId
                                        ) +
                                        "/status",
                                        {
                                            status: nextStatus
                                        }
                                    );

                                if (
                                    !response ||
                                    response.success !== true
                                ) {
                                    throw new Error(
                                        "API không xác nhận cập nhật thành công."
                                    );
                                }

                                // Tai lai danh sach theo bo loc.
                                await loadStudents();

                                UIComponents.showAlert(
                                    "studentSaveMessage",
                                    "Đã cập nhật trạng thái học sinh " +
                                        student.studentCode +
                                        " thành công.",
                                    "success"
                                );

                            } catch (error) {
                                UIComponents.showAlert(
                                    "studentListStatus",
                                    "Không thể hoàn tất thao tác: " +
                                        error.message,
                                    "error"
                                );

                            } finally {
                                statusButton.disabled = false;
                            }
                        }
                    );

                    actionCell.appendChild(statusButton);
                }

                // Dua o thao tac vao dong hoc sinh tuong ung.
                tableRows[index].appendChild(actionCell);

            });

            // Hien thi bang sau khi bo sung cot.
            tableContainer.appendChild(table);

        } else {
            UIComponents.showEmpty("studentTable");
        }

        UIComponents.clear("studentListStatus");

    } catch (error) {
        if (requestId !== latestStudentListRequest) {
            return;
        }

        UIComponents.showAlert(
            "studentListStatus",
            "Không thể tải danh sách học sinh: " +
                error.message,
            "error"
        );
    }
}

// Lay cac phan lop hien tai cua hoc sinh.
async function getCurrentStudentEnrollments(studentId) {
    const response = await apiClient.get(
        "/students/" +
        encodeURIComponent(studentId) +
        "/enrollments"
    );

    const history = getStudentCatalogData(response);

    // endDate = null nghia la phan lop chua ket thuc.
    return history.filter(function (enrollment) {
        return enrollment.endDate === null;
    });
}

// Khoi tao trang khi HTML tai xong.
document.addEventListener("DOMContentLoaded", async function () {

    // Hien thi menu quan tri.
    renderNavigation("admin", "sidebarNavigation");

    const filterForm =
        document.getElementById("studentFilterForm");

    const yearSelect =
        document.getElementById("studentYearFilter");

    const resetButton =
        document.getElementById("resetStudentFilterButton");

    // Lay cac thanh phan cua bieu mau hoc sinh.
    const addStudentButton =
        document.getElementById("addStudentButton");

    const cancelStudentButton =
        document.getElementById("cancelStudentButton");

    const studentFormPanel =
        document.getElementById("studentFormPanel");

    const studentForm =
        document.getElementById("studentForm");

    const saveStudentButton =
        document.getElementById("saveStudentButton");

    // Mo bieu mau them hoc sinh.
    addStudentButton.addEventListener("click", function () {

        studentForm.reset();

        // Xoa trang thai chinh sua neu co.
        delete studentForm.dataset.editStudentId;

        document.getElementById(
            "studentFormTitle"
        ).textContent = "Thêm học sinh";

        saveStudentButton.textContent = "Lưu";

        // Cho phep chon trang thai khi them hoc sinh.
        const studentStatusInput = document.getElementById(
            "studentStatusInput"
        );

        studentStatusInput.disabled = false;
        studentStatusInput.value = "ACTIVE";

        UIComponents.clear("studentFormMessage");
        UIComponents.clear("studentSaveMessage");

        studentFormPanel.hidden = false;

        document.getElementById(
            "studentCodeInput"
        ).focus();
    });

    // Dong bieu mau khi nhan Huy.
    cancelStudentButton.addEventListener("click", function () {

        studentFormPanel.hidden = true;

        studentForm.reset();

        delete studentForm.dataset.editStudentId;

        UIComponents.clear("studentFormMessage");
    });

    // Luu ho so hoc sinh bang API.
    studentForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            // Xac dinh dang Them hay Sua ho so.
            const editStudentId =
                studentForm.dataset.editStudentId;

            const isEditing = Boolean(editStudentId);

            // Lay du lieu tu bieu mau.
            const studentCode = document
                .getElementById("studentCodeInput")
                .value.trim();

            const fullName = document
                .getElementById("studentNameInput")
                .value.trim();

            const dateOfBirth = document
                .getElementById("studentBirthInput")
                .value;

            const status = document
                .getElementById("studentStatusInput")
                .value;

            // Kiem tra ma hoc sinh.
            if (
                studentCode.length === 0 ||
                studentCode.length > 30
            ) {
                UIComponents.showAlert(
                    "studentFormMessage",
                    "Mã học sinh phải có từ 1 đến 30 ký tự.",
                    "error"
                );
                return;
            }

            // Kiem tra ho ten hoc sinh.
            if (
                fullName.length === 0 ||
                fullName.length > 150
            ) {
                UIComponents.showAlert(
                    "studentFormMessage",
                    "Họ tên phải có từ 1 đến 150 ký tự.",
                    "error"
                );
                return;
            }

            // Kiem tra dinh dang ngay sinh.
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
                UIComponents.showAlert(
                    "studentFormMessage",
                    "Vui lòng chọn ngày sinh hợp lệ.",
                    "error"
                );
                return;
            }

            // Kiem tra trang thai.
            if (!["ACTIVE", "INACTIVE"].includes(status)) {
                UIComponents.showAlert(
                    "studentFormMessage",
                    "Trạng thái học sinh không hợp lệ.",
                    "error"
                );
                return;
            }

            // Ngan nhan Luu lien tuc.
            saveStudentButton.disabled = true;

            UIComponents.showLoading("studentFormMessage");
            UIComponents.clear("studentSaveMessage");

            try {
                // Gui API phu hop voi thao tac Them hoac Sua.
                let response;

                if (isEditing) {

                    // Sua ho so: Backend chi cho phep 3 truong.
                    response = await apiClient.patch(
                        "/students/" + encodeURIComponent(editStudentId),
                        {
                            studentCode: studentCode,
                            fullName: fullName,
                            dateOfBirth: dateOfBirth
                        }
                    );

                } else {

                    // Them hoc sinh: Backend cho phep 4 truong.
                    response = await apiClient.post(
                        "/students",
                        {
                            studentCode: studentCode,
                            fullName: fullName,
                            dateOfBirth: dateOfBirth,
                            status: status
                        }
                    );

                }

                if (
                    !response ||
                    response.success !== true
                ) {
                    throw new Error(
                        "Không thể thêm hồ sơ học sinh."
                    );
                }

                // Dong bieu mau sau khi them thanh cong.
                studentFormPanel.hidden = true;

                studentForm.reset();

                delete studentForm.dataset.editStudentId;

                UIComponents.clear("studentFormMessage");

                const successMessage = isEditing
                    ? "Đã cập nhật hồ sơ học sinh " +
                        studentCode + " thành công."
                    : "Đã thêm học sinh " +
                        studentCode + " thành công.";

                UIComponents.showAlert(
                    "studentSaveMessage",
                    successMessage,
                    "success"
                );

                // Tai lai danh sach theo bo loc hien tai.
                await loadStudents();

            } catch (error) {

                UIComponents.showAlert(
                    "studentFormMessage",
                    "Không thể lưu học sinh: " +
                        error.message,
                    "error"
                );

            } finally {

                saveStudentButton.disabled = false;
            }
        }
    );

    // Tim kiem hoc sinh khi nhan nut Tim kiem.
    filterForm.addEventListener("submit", function (event) {
        event.preventDefault();
        loadStudents();
    });

    // Khi doi nien khoa, tai lai danh sach lop.
    yearSelect.addEventListener("change", async function () {
        await loadStudentClasses();
        loadStudents();
    });

    // Xoa bo loc va tai lai danh sach.
    resetButton.addEventListener("click", async function () {
        filterForm.reset();

        await loadStudentClasses();
        loadStudents();
    });

    // Huy thao tac cap tai khoan hoc sinh.
    document.getElementById("cancelStudentAccountButton")
        .addEventListener("click", function () {
            const accountForm =
                document.getElementById("studentAccountForm");

            accountForm.reset();
            delete accountForm.dataset.studentId;

            UIComponents.clear("studentAccountMessage");

            document.getElementById(
                "studentAccountPanel"
            ).hidden = true;
        });

    // Tao tai khoan va lien ket truc tiep voi hoc sinh.
    const studentAccountForm = document.getElementById(
        "studentAccountForm"
    );

    const saveAccountButton = document.getElementById(
        "saveStudentAccountButton"
    );

    studentAccountForm.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            // Lay ID hoc sinh da chon tu danh sach.
            const studentId = studentAccountForm.dataset.studentId;

            const username = document.getElementById(
                "studentAccountUsername"
            ).value.trim();

            const passwordInput = document.getElementById(
                "studentAccountPassword"
            );

            const password = passwordInput.value;

            if (!studentId) {
                UIComponents.showAlert(
                    "studentAccountMessage",
                    "Chưa chọn học sinh cần cấp tài khoản.",
                    "error"
                );
                return;
            }

            if (
                !/^[A-Za-z0-9._-]{3,50}$/.test(username) ||
                password.length < 12 ||
                password.length > 128
            ) {
                UIComponents.showAlert(
                    "studentAccountMessage",
                    "Tên đăng nhập hoặc mật khẩu không hợp lệ.",
                    "error"
                );
                return;
            }

            saveAccountButton.disabled = true;

            UIComponents.showLoading("studentAccountMessage");

            try {
                const response = await apiClient.post(
                    "/khao-thi/demo-accounts",
                    {
                        username: username,
                        password: password,
                        roleCode: "HOC_SINH",
                        studentId: studentId
                    }
                );

                if (
                    !response ||
                    response.success !== true ||
                    !response.data ||
                    !response.data.userId
                ) {
                    throw new Error(
                        "API không xác nhận tạo tài khoản thành công."
                    );
                }

                // Khong giu mat khau trong bieu mau.
                passwordInput.value = "";

                    UIComponents.showAlert(
                    "studentAccountMessage",
                    "Đã tạo và liên kết tài khoản " +
                        username +
                        " thành công.",
                    "success"
                );

                // Cap nhat danh sach sau khi cap tai khoan.
                // Neu tai lai that bai, khong duoc coi la
                // thao tac tao tai khoan that bai.
                try {
                    await loadStudents();
                } catch (reloadError) {
                    UIComponents.showAlert(
                        "studentAccountMessage",
                        "Đã tạo tài khoản " + username +
                            " thành công, nhưng chưa tải lại " +
                            "được danh sách: " +
                            reloadError.message,
                        "warning"
                    );
                }

                // Khong cho phep gui lai tai khoan da tao.
                return;

            } catch (error) {
                UIComponents.showAlert(
                    "studentAccountMessage",
                    "Không thể cấp tài khoản: " +
                        error.message,
                    "error"
                );

                saveAccountButton.disabled = false;
            }
        }
    );

    // Tai danh sach lop khi chon nien khoa phan lop.
    const assignYearSelect = document.getElementById(
        "studentAssignYear"
    );

    const assignClassSelect = document.getElementById(
        "studentAssignClass"
    );

    let latestAssignClassRequest = 0;

    assignYearSelect.addEventListener("change", async function () {
        const requestId = ++latestAssignClassRequest;
        const academicYearId = assignYearSelect.value;

        // Xoa danh sach lop cu.
        fillStudentSelect(
            "studentAssignClass",
            [],
            "classId",
            "name",
            "Chọn lớp học"
        );

        assignClassSelect.disabled = true;
        UIComponents.clear("studentAssignMessage");

        if (!academicYearId) {
            return;
        }

        try {
            const response = await apiClient.get(
                "/classes?academicYearId=" +
                encodeURIComponent(academicYearId)
            );

            const classes = getStudentCatalogData(
                response
            ).filter(function (item) {
                return item.status === "ACTIVE";
            });

            // Khong dung ket qua cua yeu cau cu.
            if (requestId !== latestAssignClassRequest) {
                return;
            }

            fillStudentSelect(
                "studentAssignClass",
                classes,
                "classId",
                "name",
                "Chọn lớp học"
            );

            assignClassSelect.disabled = classes.length === 0;

            if (classes.length === 0) {
                UIComponents.showAlert(
                    "studentAssignMessage",
                    "Niên khóa này chưa có lớp đang hoạt động.",
                    "error"
                );
            }

        } catch (error) {
            if (requestId !== latestAssignClassRequest) {
                return;
            }

            UIComponents.showAlert(
                "studentAssignMessage",
                "Không thể tải danh sách lớp: " +
                    error.message,
                "error"
            );
        }
    });

    // Luu phan lop hoc sinh bang API.
    const studentAssignForm = document.getElementById(
        "studentAssignForm"
    );

    const saveAssignButton = document.getElementById(
        "saveStudentAssignButton"
    );

    studentAssignForm.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            // Lay hoc sinh da chon.
            const studentId = studentAssignForm.dataset.studentId;

            // Lay nien khoa, lop va ngay bat dau.
            const academicYearId = document.getElementById(
                "studentAssignYear"
            ).value;

            const classId = document.getElementById(
                "studentAssignClass"
            ).value;

            const startDate = document.getElementById(
                "studentAssignStartDate"
            ).value;

            // Kiem tra du lieu truoc khi gui.
            if (
                !studentId ||
                !academicYearId ||
                !classId ||
                !startDate
            ) {
                UIComponents.showAlert(
                    "studentAssignMessage",
                    "Vui lòng nhập đầy đủ thông tin phân lớp.",
                    "error"
                );
                return;
            }

            saveAssignButton.disabled = true;

            UIComponents.showLoading(
                "studentAssignMessage"
            );

            try {
                // Goi API phan hoc sinh vao lop.
                const response = await apiClient.post(
                    "/students/" +
                        encodeURIComponent(studentId) +
                        "/enrollments",
                    {
                        academicYearId: academicYearId,
                        classId: classId,
                        startDate: startDate
                    }
                );

                if (
                    !response ||
                    response.success !== true ||
                    !response.data ||
                    !response.data.enrollmentId
                ) {
                    throw new Error(
                        "API không xác nhận phân lớp thành công."
                    );
                }

                UIComponents.showAlert(
                    "studentAssignMessage",
                    "Đã phân học sinh vào lớp thành công.",
                    "success"
                );

                // Giu nut bi khoa de tranh luu trung.
                // Khi mo bieu mau lan moi se mo lai nut.

            } catch (error) {
                UIComponents.showAlert(
                    "studentAssignMessage",
                    "Không thể phân lớp: " +
                        error.message,
                    "error"
                );

                saveAssignButton.disabled = false;
            }
        }
    );

    // Huy thao tac phan hoc sinh vao lop.
    const cancelStudentAssignButton = document.getElementById(
        "cancelStudentAssignButton"
    );

    cancelStudentAssignButton.addEventListener(
        "click",
        function (event) {
            event.preventDefault();

            const assignForm = document.getElementById(
                "studentAssignForm"
            );

            const assignPanel = document.getElementById(
                "studentAssignPanel"
            );

            // Xoa thong tin dang nhap.
            assignForm.reset();
            delete assignForm.dataset.studentId;

            // Xoa thong bao cu.
            UIComponents.clear("studentAssignMessage");

            // Khoa danh sach lop cho den khi chon nien khoa moi.
            document.getElementById(
                "studentAssignClass"
            ).disabled = true;

            // Dong bieu mau phan lop.
            assignPanel.hidden = true;
        }
    );

    // Huy thao tac chuyen lop hoc sinh.
    const cancelStudentTransferButton =
        document.getElementById(
            "cancelStudentTransferButton"
        );

    cancelStudentTransferButton.addEventListener(
        "click",
        function () {
            const transferForm =
                document.getElementById(
                    "studentTransferForm"
                );

            const transferPanel =
                document.getElementById(
                    "studentTransferPanel"
                );

            // Xoa du lieu cua lan chuyen lop dang thuc hien.
            transferForm.reset();

            delete transferForm.dataset.studentId;
            delete transferForm.dataset.academicYearId;
            delete transferForm.dataset.currentClassId;
            delete transferForm.dataset.gradeNumber;

            // Xoa thong bao cu.
            UIComponents.clear(
                "studentTransferMessage"
            );

            // Khoa danh sach lop cho den khi mo lai.
            document.getElementById(
                "studentTransferClass"
            ).disabled = true;

            // Dong bieu mau chuyen lop.
            transferPanel.hidden = true;
        }
    );

    // Xu ly luu chuyen lop hoc sinh.
    const studentTransferForm = document.getElementById(
        "studentTransferForm"
    );

    const saveTransferButton = document.getElementById(
        "saveStudentTransferButton"
    );

    studentTransferForm.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            // Lay thong tin hoc sinh va nien khoa hien tai.
            const studentId =
                studentTransferForm.dataset.studentId;

            const academicYearId =
                studentTransferForm.dataset.academicYearId;

            const currentClassId =
                studentTransferForm.dataset.currentClassId;

            // Lay lop moi va ngay chuyen lop.
            const newClassId = document.getElementById(
                "studentTransferClass"
            ).value;

            const transferDate = document.getElementById(
                "studentTransferDate"
            ).value;

            // Kiem tra cac truong bat buoc.
            if (
                !studentId ||
                !academicYearId ||
                !newClassId ||
                !transferDate
            ) {
                UIComponents.showAlert(
                    "studentTransferMessage",
                    "Vui lòng nhập đầy đủ thông tin chuyển lớp.",
                    "error"
                );
                return;
            }

            // Khong cho chuyen ve chinh lop hien tai.
            if (String(newClassId) === String(currentClassId)) {
                UIComponents.showAlert(
                    "studentTransferMessage",
                    "Lớp mới phải khác lớp hiện tại.",
                    "error"
                );
                return;
            }

            // Ngan gui yeu cau nhieu lan.
            saveTransferButton.disabled = true;

            UIComponents.showLoading(
                "studentTransferMessage"
            );

            try {
                const response = await apiClient.post(
                    "/students/" +
                        encodeURIComponent(studentId) +
                        "/transfers",
                    {
                        academicYearId: academicYearId,
                        newClassId: newClassId,
                        transferDate: transferDate
                    }
                );

                if (
                    !response ||
                    response.success !== true ||
                    !response.data ||
                    !response.data.newEnrollmentId
                ) {
                    throw new Error(
                        "API không xác nhận chuyển lớp thành công."
                    );
                }

                UIComponents.showAlert(
                    "studentTransferMessage",
                    "Đã chuyển lớp học sinh thành công.",
                    "success"
                );

                // Giu nut bi khoa de tranh chuyen trung.
                // Du lieu se duoc kiem tra lai tren SQL Server.

            } catch (error) {
                UIComponents.showAlert(
                    "studentTransferMessage",
                    "Không thể chuyển lớp: " +
                        error.message,
                    "error"
                );

                saveTransferButton.disabled = false;
            }
        }
    );

    // Dong bang lich su phan lop.
    const closeEnrollmentButton = document.getElementById(
        "closeEnrollmentButton"
    );

    closeEnrollmentButton.addEventListener(
        "click",
        function () {
            // An khung lich su phan lop.
            document.getElementById(
                "studentEnrollmentPanel"
            ).hidden = true;
        }
    );

    // Tai danh muc va danh sach luc mo trang.
    await loadStudentAcademicYears();
    await loadStudentClasses();
    await loadStudents();
});
