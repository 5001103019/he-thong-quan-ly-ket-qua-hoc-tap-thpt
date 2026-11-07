
/*
 * VT3-04 - Quan ly mon hoc
 * Lay danh sach mon hoc tu SQL Server qua API.
 * Su dung apiClient va UIComponents chung cua nhom.
 */

// Kiem tra cau truc du lieu tra ve tu Backend.
function getSubjectData(response) {
    if (
        !response ||
        response.success !== true ||
        !Array.isArray(response.data)
    ) {
        throw new Error("Dữ liệu môn học từ API không hợp lệ.");
    }

    return response.data;
}

// Chuyen doi hai man hinh quan ly mon hoc.
function showSubjectScreen(screen) {

    const isFormScreen = screen !== "list";

    const filterForm =
        document.getElementById("subjectFilterForm");

    const listSection =
        document.getElementById("subjectTitle").closest("section");

    const formPanel =
        document.getElementById("subjectFormPanel");

    const description =
        document.querySelector(".page-description");

    // An bo loc va danh sach khi mo bieu mau.
    filterForm.hidden = isFormScreen;
    listSection.hidden = isFormScreen;

    // Chi hien bieu mau o man hinh them hoac sua.
    formPanel.hidden = !isFormScreen;

    // Cap nhat mo ta theo man hinh.
    if (screen === "add") {
        description.textContent =
            "Thêm thông tin môn học và kiểm tra mã trùng trước khi lưu.";
    } else if (screen === "edit") {
        description.textContent =
            "Chỉnh sửa thông tin môn học đã có trong hệ thống.";
    } else {
        description.textContent =
            "Theo dõi danh mục môn học phục vụ nhập và hiển thị kết quả học tập.";
    }

    // Dua trang ve dau khi chuyen man hinh.
    window.scrollTo(0, 0);
}

// Tai danh sach mon hoc tu Backend.
async function loadSubjects() {

    const subjectTable =
        document.getElementById("subjectTable");

    // Hien thi trang thai dang tai.
    UIComponents.showLoading("subjectListStatus");

    // Xoa bang cu truoc khi tai lai.
    UIComponents.clear("subjectTable");

    try {
        // Goi API GET /api/v1/subjects.
        const response = await apiClient.get("/subjects");

        // Lay tu khoa tim kiem.
        const keyword = document
            .getElementById("subjectSearchFilter")
            .value.trim().toLocaleLowerCase("vi");

        // Lay trang thai dang loc.
        const selectedStatus = document
            .getElementById("subjectStatusFilter")
            .value;

        // Loc danh sach mon hoc tu du lieu API.
        const subjects = getSubjectData(response).filter(function (subject) {

            const code = String(subject.code || "")
                .toLocaleLowerCase("vi");

            const name = String(subject.name || "")
                .toLocaleLowerCase("vi");

            // Tim theo ma mon hoac ten mon hoc.
            const matchesKeyword =
                keyword === "" ||
                code.includes(keyword) ||
                name.includes(keyword);

            // Loc theo trang thai.
            const matchesStatus =
                selectedStatus === "" ||
                subject.status === selectedStatus;

            return matchesKeyword && matchesStatus;
        });

        // Khai bao cac cot cua bang.
        const columns = [
            {
                key: "code",
                label: "Mã môn"
            },
            {
                key: "name",
                label: "Tên môn học"
            },
            {
                key: "status",
                label: "Trạng thái"
            }
        ];

        // Hien thi bang khi co du lieu.
        if (subjects.length > 0) {

            // Tao bang bang component chung cua Yen.
            const table = UIComponents.createTable(
                columns,
                subjects
            );

            // Them cot Thao tac.
            const actionHeader = document.createElement("th");
            actionHeader.textContent = "Thao tác";

            table.querySelector("thead tr")
                .appendChild(actionHeader);

            // Lay cac dong cua bang.
            const tableRows = table.querySelectorAll("tbody tr");

            // Them nut Sua cho tung mon hoc.
            subjects.forEach(function (subject, index) {

                // Hien thi trang thai bang tieng Viet theo Figma.
                const statusCell = tableRows[index].querySelectorAll("td")[2];

                if (subject.status === "ACTIVE") {
                    statusCell.textContent = "Đang sử dụng";
                } else if (subject.status === "INACTIVE") {
                    statusCell.textContent = "Ngừng hoạt động";
                } else {
                    statusCell.textContent = subject.status;
                }

                const actionCell = document.createElement("td");

                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.textContent = "Xem / Sửa";
                editButton.className = "subject-action-link";
                editButton.setAttribute(
                    "aria-label",
                    "Xem và sửa môn học " + subject.name
                );

                // Xu ly khi nguoi dung nhan Sua.
                editButton.addEventListener("click", function () {

                    const form = document.getElementById(
                        "subjectForm"
                    );

                    const formPanel = document.getElementById(
                        "subjectFormPanel"
                    );

                    // Xoa du lieu cu.
                    form.reset();

                    // Luu ID mon hoc dang chinh sua.
                    form.dataset.editSubjectId =
                        String(subject.subjectId);

                    // Doi tieu de bieu mau.
                    document.getElementById(
                        "subjectFormTitle"
                    ).textContent = "Sửa môn học";

                    // Doi ten nut Luu.
                    document.getElementById(
                        "saveSubjectButton"
                    ).textContent = "Lưu thay đổi";

                    // Dien ma mon hoc.
                    document.getElementById(
                        "subjectCode"
                    ).value = subject.code;

                    // Dien ten mon hoc.
                    document.getElementById(
                        "subjectName"
                    ).value = subject.name;

                    // Dien trang thai hien tai.
                    document.getElementById(
                        "subjectStatus"
                    ).value = subject.status;

                    // Xoa thong bao cu.
                    UIComponents.clear("subjectFormMessage");

                    // Chuyen sang man hinh sua mon hoc.
                    showSubjectScreen("edit");

                    // Dua con tro vao o ten mon hoc.
                    document.getElementById(
                        "subjectName"
                    ).focus();
                });

                // Dua nut Sua vao cot Thao tac.
                actionCell.appendChild(editButton);

                // Dua cot Thao tac vao dong tuong ung.
                tableRows[index].appendChild(actionCell);
            });

            // Dua bang hoan chinh len giao dien.
            subjectTable.appendChild(table);

        } else {
            // Thong bao neu database chua co mon hoc.
            UIComponents.showEmpty("subjectTable");
        }

        // Xoa thong bao dang tai.
        UIComponents.clear("subjectListStatus");

    } catch (error) {

        // Hien thi loi tu API neu tai that bai.
        UIComponents.showAlert(
            "subjectListStatus",
            "Không thể tải danh sách môn học: " +
                error.message,
            "error"
        );
    }
}

/*
 * Khoi tao trang quan ly mon hoc.
 * Xu ly mo va dong bieu mau them mon.
 */
document.addEventListener("DOMContentLoaded", function () {

    // Hien thi menu quan tri.
    renderNavigation("admin", "sidebarNavigation");

    // Lay cac thanh phan HTML.
    const addButton =
        document.getElementById("addSubjectButton");

    const cancelButton =
        document.getElementById("cancelSubjectButton");

    const formPanel =
        document.getElementById("subjectFormPanel");

    const form =
        document.getElementById("subjectForm");

    const codeInput =
        document.getElementById("subjectCode");

    const statusSelect =
        document.getElementById("subjectStatus");

    // Mo bieu mau khi nhan Them mon hoc.
    addButton.addEventListener("click", function () {

        // Xoa du lieu cua lan nhap truoc.
        form.reset();

        // Bao dam dang o che do them moi.
        delete form.dataset.editSubjectId;

        // Dat lai tieu de bieu mau.
        document.getElementById(
            "subjectFormTitle"
        ).textContent = "Thêm môn học";

        // Dat lai ten nut Luu.
        document.getElementById(
            "saveSubjectButton"
        ).textContent = "Lưu môn học";

        // Mac dinh mon hoc dang hoat dong.
        statusSelect.value = "ACTIVE";

        // Xoa thong bao cu.
        UIComponents.clear("subjectFormMessage");

        // Chuyen sang man hinh them mon hoc.
        showSubjectScreen("add");

        // Dua con tro vao o ma mon hoc.
        codeInput.focus();
    });

    // Dong bieu mau khi nhan Huy.
    cancelButton.addEventListener("click", function () {

        // Quay ve man hinh danh muc mon hoc.
        showSubjectScreen("list");

        // Xoa du lieu da nhap.
        form.reset();

        // Xoa trang thai chinh sua neu co.
        delete form.dataset.editSubjectId;

        // Xoa thong bao.
        UIComponents.clear("subjectFormMessage");
    });

    // Xu ly them mon hoc bang API Backend.
    form.addEventListener("submit", async function (event) {

        // Khong cho trinh duyet tai lai trang.
        event.preventDefault();

        // Xac dinh nguoi dung dang them hay sua mon hoc.
        const editSubjectId = form.dataset.editSubjectId;
        const isEditing = Boolean(editSubjectId);

        // Lay du lieu tu bieu mau.
        const code = document
            .getElementById("subjectCode")
            .value.trim().toUpperCase();

        const name = document
            .getElementById("subjectName")
            .value.trim();

        const status = document
            .getElementById("subjectStatus")
            .value;

        // Kiem tra ma mon hoc theo quy tac Backend.
        if (code.length === 0 || code.length > 20) {
            UIComponents.showAlert(
                "subjectFormMessage",
                "Mã môn học phải có từ 1 đến 20 ký tự.",
                "error"
            );
            return;
        }

        // Kiem tra ten mon hoc.
        if (name.length === 0 || name.length > 100) {
            UIComponents.showAlert(
                "subjectFormMessage",
                "Tên môn học phải có từ 1 đến 100 ký tự.",
                "error"
            );
            return;
        }

        // Kiem tra trang thai.
        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            UIComponents.showAlert(
                "subjectFormMessage",
                "Trạng thái môn học không hợp lệ.",
                "error"
            );
            return;
        }

        const saveButton =
            document.getElementById("saveSubjectButton");

        // Ngan gui yeu cau nhieu lan.
        saveButton.disabled = true;

        UIComponents.showLoading("subjectFormMessage");
        UIComponents.clear("subjectSaveMessage");

        try {
            // Gui yeu cau phu hop voi thao tac Them hoac Sua.
            let response;

            if (isEditing) {

                // Sua mon hoc da ton tai.
                response = await apiClient.patch(
                    "/subjects/" + editSubjectId,
                    {
                        code: code,
                        name: name,
                        status: status
                    }
                );

            } else {

                // Them mon hoc moi.
                response = await apiClient.post(
                    "/subjects",
                    {
                        code: code,
                        name: name,
                        status: status
                    }
                );

            }

            // Kiem tra ket qua tra ve.
            if (!response || response.success !== true) {
                throw new Error("Không thể lưu môn học.");
            }

            // Quay lai danh muc sau khi luu thanh cong.
            showSubjectScreen("list");

            // Xoa du lieu va trang thai cu.
            form.reset();
            delete form.dataset.editSubjectId;

            UIComponents.clear("subjectFormMessage");

            // Thong bao dung voi thao tac vua thuc hien.
            const successMessage = isEditing
                ? "Đã cập nhật môn học " + code + " thành công."
                : "Đã thêm môn học " + code + " thành công.";

            UIComponents.showAlert(
                "subjectSaveMessage",
                successMessage,
                "success"
            );

            // Tai lai danh sach mon hoc tu Backend.
            await loadSubjects();

        } catch (error) {
            // Hien thi loi Backend tra ve.
            UIComponents.showAlert(
                "subjectFormMessage",
                error.message,
                "error"
            );

        } finally {
            // Mo lai nut Luu khi ket thuc xu ly.
            saveButton.disabled = false;
        }
    });

    // Xu ly tim kiem va loc mon hoc.
    const subjectFilterForm =
        document.getElementById("subjectFilterForm");

    subjectFilterForm.addEventListener("submit", function (event) {

        // Khong tai lai toan bo trang.
        event.preventDefault();

        // Tai va loc lai danh sach mon hoc.
        loadSubjects();
    });

    // Tai danh sach mon hoc tu API.
    loadSubjects();
});
