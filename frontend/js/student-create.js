
/*
 * VT3-04 - THEM HOC SINH
 *
 * - Tai nien khoa, khoi, lop tu API
 * - Tao ho so va ghi nhan phan lop
 * - Luu thanh cong thi o lai trang Them hoc sinh
 * - Cap nhat danh sach ben trai
 * - Cho phep them lien tiep nhieu hoc sinh
 * - Giu luong Sua va Cap tai khoan hien co
 */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const el = (id) => document.getElementById(id);

    const form = el("studentForm");
    const panel = el("studentFormPanel");
    const year = el("studentCreateYear");
    const grade = el("studentCreateGrade");
    const classroom = el("studentCreateClass");
    const startDate = el("studentCreateStartDate");
    const saveButton = el("saveStudentButton");

    let availableClasses = [];
    let yearVersion = 0;
    let classVersion = 0;
    let saving = false;

    function editing() {
        return Boolean(form.dataset.editStudentId);
    }

    // Tao danh sach tuy chon
    function optionsFor(
        select,
        list,
        getValue,
        getLabel,
        placeholder
    ) {
        select.replaceChildren(new Option(placeholder, ""));

        for (const item of list) {
            const value = getValue(item);

            if (
                value !== null &&
                value !== undefined &&
                value !== ""
            ) {
                select.add(
                    new Option(
                        String(getLabel(item)),
                        String(value)
                    )
                );
            }
        }
    }

    function alertForm(message, type = "error") {
        UIComponents.showAlert(
            "studentFormMessage",
            message,
            type
        );
    }

    function clearClassChoices() {
        availableClasses = [];

        optionsFor(
            grade, [], x => x, x => x, "Chọn khối"
        );

        optionsFor(
            classroom, [], x => x, x => x, "Chọn lớp"
        );

        grade.disabled = true;
        classroom.disabled = true;
    }

    // Truong phan lop chi bat buoc khi Them
    function syncRequired() {
        const required = !editing();

        [year, grade, classroom, startDate].forEach(
            function (input) {
                input.required = required;
            }
        );

        if (!required) {
            yearVersion++;
            classVersion++;
        }
    }

    // Hien thi lop theo khoi
    function showClassesForGrade() {
        const list = availableClasses.filter(
            function (item) {
                return String(item.gradeNumber) === grade.value;
            }
        );

        optionsFor(
            classroom,
            list,
            item => item.classId,
            item => item.name || item.code ||
                String(item.classId),
            "Chọn lớp"
        );

        classroom.disabled = list.length === 0;

        const preferred = el("studentClassFilter").value;

        if (
            list.some(
                item => String(item.classId) === preferred
            )
        ) {
            classroom.value = preferred;
        }
    }

    // Tai lop theo nien khoa
    async function loadClasses() {
        const version = ++classVersion;

        clearClassChoices();

        if (!year.value || editing()) {
            return;
        }

        try {
            const response = await apiClient.get(
                "/classes?academicYearId=" +
                encodeURIComponent(year.value)
            );

            const data = getStudentCatalogData(response);

            if (version !== classVersion || editing()) {
                return;
            }

            if (!Array.isArray(data)) {
                throw new Error(
                    "Danh sách lớp không hợp lệ."
                );
            }

            availableClasses = data.filter(
                function (item) {
                    return (
                        item.status === "ACTIVE" &&
                        item.classId != null &&
                        item.gradeNumber != null &&
                        String(item.academicYearId) ===
                            year.value
                    );
                }
            );

            const grades = [
                ...new Set(
                    availableClasses.map(
                        item => String(item.gradeNumber)
                    )
                )
            ].sort(
                (a, b) => Number(a) - Number(b)
            );

            optionsFor(
                grade,
                grades,
                x => x,
                x => x,
                "Chọn khối"
            );

            grade.disabled = grades.length === 0;

            if (grades.length === 0) {
                alertForm(
                    "Niên khóa này chưa có lớp đang hoạt động.",
                    "warning"
                );
                return;
            }

            const preferred =
                el("studentGradeFilter").value;

            if (grades.includes(preferred)) {
                grade.value = preferred;
                showClassesForGrade();
            }

        } catch (error) {
            if (
                version === classVersion &&
                !editing()
            ) {
                alertForm(
                    "Không thể tải lớp: " +
                    error.message
                );
            }
        }
    }

    // Tai danh sach nien khoa
    async function loadYears() {
        const version = ++yearVersion;

        classVersion++;
        clearClassChoices();

        optionsFor(
            year,
            [],
            x => x,
            x => x,
            "Đang tải niên khóa..."
        );

        year.disabled = true;
        startDate.value = "";

        syncRequired();

        try {
            const response = await apiClient.get(
                "/academic-years"
            );

            const data = getStudentCatalogData(response);

            if (version !== yearVersion || editing()) {
                return;
            }

            if (!Array.isArray(data)) {
                throw new Error(
                    "Danh sách niên khóa không hợp lệ."
                );
            }

            // Khong cho chon nien khoa da ket thuc
            const years = data.filter(
                function (item) {
                    return (
                        item.academicYearId != null &&
                        item.status !== "CLOSED"
                    );
                }
            );

            optionsFor(
                year,
                years,
                item => item.academicYearId,
                item => item.code,
                "Chọn niên khóa"
            );

            year.disabled = years.length === 0;

            if (!years.length) {
                alertForm(
                    "Không có niên khóa được phép phân lớp.",
                    "warning"
                );
                return;
            }

            const preferred =
                el("studentYearFilter").value;

            if (
                years.some(
                    item =>
                        String(item.academicYearId) ===
                        preferred
                )
            ) {
                year.value = preferred;
                await loadClasses();
            }

        } catch (error) {
            if (
                version === yearVersion &&
                !editing()
            ) {
                alertForm(
                    "Không thể tải niên khóa: " +
                    error.message
                );
            }
        }
    }

    // Mo form Them hoc sinh
    el("addStudentButton").addEventListener(
        "click",
        function () {
            UIComponents.clear("studentFormMessage");

            saveButton.textContent = "Lưu";

            void loadYears();
        }
    );

    year.addEventListener("change", function () {
        UIComponents.clear("studentFormMessage");
        void loadClasses();
    });

    grade.addEventListener("change", function () {
        UIComponents.clear("studentFormMessage");
        showClassesForGrade();
    });

    new MutationObserver(syncRequired).observe(
        form,
        {
            attributes: true,
            attributeFilter: ["data-edit-student-id"]
        }
    );

    syncRequired();

    /*
     * XU LY LUU HOC SINH
     *
     * Dung capture listener de ngan
     * POST /students bi gui trung hai lan.
     */

    form.addEventListener(
        "submit",
        async function (event) {

            // Luong Sua giu cho JS nghiep vu cu
            if (editing()) {
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();

            if (saving) {
                return;
            }

            // Thong tin hoc sinh
            const code = el(
                "studentCodeInput"
            ).value.trim();

            const name = el(
                "studentNameInput"
            ).value.trim();

            const birth = el(
                "studentBirthInput"
            ).value;

            const status = el(
                "studentStatusInput"
            ).value;

            // Thong tin phan lop
            const academicYearId = year.value;
            const gradeNumber = grade.value;
            const classId = classroom.value;
            const date = startDate.value;

            const wantsAccount = el(
                "studentCreateAccount"
            ).checked;

            // Kiem tra thong tin ca nhan
            if (
                !code ||
                code.length > 30 ||
                !name ||
                name.length > 150 ||
                !/^\d{4}-\d{2}-\d{2}$/.test(birth) ||
                !["ACTIVE", "INACTIVE"].includes(status)
            ) {
                alertForm(
                    "Vui lòng kiểm tra mã học sinh, " +
                    "họ tên, ngày sinh và trạng thái."
                );
                return;
            }

            // Kiem tra lop hop le
            const chosen = availableClasses.find(
                function (item) {
                    return (
                        String(item.classId) === classId &&
                        String(item.academicYearId) ===
                            academicYearId &&
                        String(item.gradeNumber) ===
                            gradeNumber
                    );
                }
            );

            if (
                !chosen ||
                !/^\d{4}-\d{2}-\d{2}$/.test(date)
            ) {
                alertForm(
                    "Vui lòng chọn niên khóa, khối, lớp " +
                    "và ngày bắt đầu phân lớp hợp lệ."
                );
                return;
            }

            // Bat dau luu
            saving = true;
            saveButton.disabled = true;

            UIComponents.showLoading(
                "studentFormMessage"
            );

            UIComponents.clear(
                "studentSaveMessage"
            );

            let profileCreated = false;
            let enrollmentCreated = false;
            let enrollmentIssue = "";

            try {

                /*
                 * BUOC 1: TAO HO SO HOC SINH
                 */
                const created = await apiClient.post(
                    "/students",
                    {
                        studentCode: code,
                        fullName: name,
                        dateOfBirth: birth,
                        status: status
                    }
                );

                if (
                    !created ||
                    created.success !== true
                ) {
                    throw new Error(
                        "API không xác nhận tạo hồ sơ thành công."
                    );
                }

                profileCreated = true;

                /*
                 * BUOC 2: GHI NHAN PHAN LOP
                 */
                try {
                    let studentId =
                        created.data?.studentId ||
                        created.data?.student?.studentId;

                    if (!studentId) {
                        const result = await apiClient.get(
                            "/students?studentCode=" +
                            encodeURIComponent(code)
                        );

                        const rows =
                            getStudentCatalogData(result);

                        const student = rows.find(
                            item => item.studentCode === code
                        );

                        studentId = student?.studentId;
                    }

                    if (!studentId) {
                        throw new Error(
                            "Không tìm được ID học sinh vừa tạo."
                        );
                    }

                    const enrolled = await apiClient.post(
                        "/students/" +
                        encodeURIComponent(studentId) +
                        "/enrollments",
                        {
                            academicYearId: academicYearId,
                            classId: classId,
                            startDate: date
                        }
                    );

                    if (
                        !enrolled ||
                        enrolled.success !== true ||
                        !enrolled.data?.enrollmentId
                    ) {
                        throw new Error(
                            "API không xác nhận phân lớp thành công."
                        );
                    }

                    enrollmentCreated = true;

                } catch (error) {
                    enrollmentIssue = error.message;
                }

                /*
                 * BUOC 3: THONG BAO KET QUA
                 */
                const message = enrollmentCreated
                    ? "Đã thêm và phân lớp học sinh " +
                      code + " - " + name +
                      " thành công. Bạn có thể thêm học sinh tiếp theo."
                    : "Đã tạo hồ sơ " + code +
                      " nhưng chưa phân lớp: " +
                      enrollmentIssue +
                      ". Không tạo lại mã này; hãy dùng " +
                      "chức năng Phân lớp để hoàn tất.";

                /*
                 * Chi chuyen sang cap tai khoan
                 * khi da chon Tao tai khoan
                 * va phan lop thanh cong.
                 */
                const goToAccount =
                    wantsAccount && enrollmentCreated;

                if (goToAccount) {

                    // Tai lai danh sach KHI form Them van dang mo.
                    // Viec nay tranh kich hoat chuyen man hinh cu.
                    try {
                        await loadStudents();
                    } catch (reloadError) {
                        console.warn(
                            "Khong tai lai duoc danh sach hoc sinh:",
                            reloadError
                        );
                    }

                    // Lay truc tiep ID hoc sinh da duoc tao.
                    let newStudentId =
                        created.data?.studentId ||
                        created.data?.student?.studentId;

                    // Phong truong hop API tao ho so khong tra ID.
                    if (!newStudentId) {
                        try {
                            const lookup = await apiClient.get(
                                "/students?studentCode=" +
                                encodeURIComponent(code)
                            );
                            const students = getStudentCatalogData(lookup);
                            newStudentId = Array.isArray(students)
                                ? students.find(
                                    item => item.studentCode === code
                                )?.studentId
                                : null;
                        } catch (lookupError) {
                            console.warn(
                                "Khong tim duoc ID hoc sinh vua tao:",
                                lookupError
                            );
                        }
                    }

                    if (!newStudentId) {
                        // Ho so DA duoc tao: khong cho luu lai ma cu.
                        el("cancelStudentButton").click();
                        UIComponents.showAlert(
                            "studentSaveMessage",
                            "Đã tạo và phân lớp học sinh " + code +
                                " thành công, nhưng chưa mở được biểu mẫu " +
                                "cấp tài khoản vì không tìm thấy ID học sinh. " +
                                "Hãy cấp tài khoản từ danh sách có sẵn; " +
                                "không thêm lại hồ sơ.",
                            "warning"
                        );
                        return;
                    }

                    // Dong form Them va xoa trang thai
                    // cho cap tai khoan cua luong cu.
                    el("cancelStudentButton").click();

                    const accountForm = el("studentAccountForm");
                    const accountPanel = el("studentAccountPanel");
                    const accountSaveButton = el(
                        "saveStudentAccountButton"
                    );

                    // Gan truc tiep dung hoc sinh vua tao.
                    // Khong phu thuoc vao bang dang hien thi.
                    accountForm.reset();
                    accountForm.dataset.studentId = String(newStudentId);

                    el("studentAccountSelected").textContent =
                        "Học sinh: " + code + " - " + name;

                    accountSaveButton.disabled = true;

                    UIComponents.clear("studentSaveMessage");
                    UIComponents.clear("studentAccountMessage");

                    // Mo man hinh Cap tai khoan.
                    accountPanel.hidden = false;
                    UIComponents.showLoading("studentAccountMessage");

                    // Kiem tra tai khoan da ton tai hay chua.
                    try {
                        const accountResult = await apiClient.get(
                            "/khao-thi/demo-accounts?studentId=" +
                            encodeURIComponent(newStudentId)
                        );

                        // Bo qua ket qua neu da chon hoc sinh khac.
                        if (
                            accountForm.dataset.studentId !==
                            String(newStudentId)
                        ) {
                            return;
                        }

                        if (
                            !accountResult ||
                            accountResult.success !== true ||
                            !Array.isArray(
                                accountResult.data?.accounts
                            )
                        ) {
                            throw new Error(
                                "Không nhận được dữ liệu tài khoản hợp lệ."
                            );
                        }

                        if (accountResult.data.accounts.length > 0) {
                            UIComponents.showAlert(
                                "studentAccountMessage",
                                "Học sinh đã có tài khoản. " +
                                    "Không cấp thêm tài khoản trùng.",
                                "warning"
                            );
                        } else {
                            accountSaveButton.disabled = false;

                            UIComponents.showAlert(
                                "studentAccountMessage",
                                "Đã tạo và phân lớp học sinh " + code +
                                    " thành công. Vui lòng nhập thông tin " +
                                    "để cấp tài khoản cho học sinh này.",
                                "success"
                            );

                            el("studentAccountUsername").focus();
                        }

                    } catch (accountError) {
                        // Khong cho cap tai khoan neu chua
                        // kiem tra duoc trang thai tai khoan.
                        UIComponents.showAlert(
                            "studentAccountMessage",
                            "Đã tạo học sinh thành công, nhưng chưa " +
                                "kiểm tra được trạng thái tài khoản: " +
                                accountError.message +
                                ". Hãy chọn lại học sinh từ danh sách.",
                            "error"
                        );
                    }

                    // Ket thuc luong Tao hoc sinh + Cap tai khoan.
                    // Khong chay tiep doan tim nut trong bang.
                    return;

                } else {

                    /*
                     * BUOC 4: GIU MAN HINH THEM HOC SINH
                     *
                     * Xoa thong tin ca nhan.
                     * Giu thong tin phan lop.
                     */

                    el("studentCodeInput").value = "";
                    el("studentNameInput").value = "";
                    el("studentBirthInput").value = "";

                    el("studentStatusInput").value =
                        "ACTIVE";

                    el("studentCreateAccount").checked =
                        false;

                    delete form.dataset.editStudentId;

                    /*
                     * KHONG DONG FORM
                     * KHONG RESET TOAN BO FORM
                     */

                    UIComponents.showAlert(
                        "studentFormMessage",
                        message,
                        enrollmentCreated
                            ? "success"
                            : "warning"
                    );
                }

                /*
                 * BUOC 5: CAP NHAT DANH SACH
                 *
                 * Ham loadStudents() da duoc
                 * student-figma.js mo rong de
                 * cap nhat bang ben trai.
                 */

                try {
                    // Tai lai danh sach hoc sinh tu API.
                    await loadStudents();

                    /*
                     * Neu da chon Tao tai khoan,
                     * mo truc tiep bieu mau cap tai khoan
                     * cho hoc sinh vua duoc tao.
                     */
                    if (goToAccount) {

                        const accountPanel = el(
                            "studentAccountPanel"
                        );

                        const selectedStudent = el(
                            "studentAccountSelected"
                        );

                        // Kiem tra co che cu da mo dung
                        // hoc sinh nay hay chua.
                        const alreadyOpened =
                            !accountPanel.hidden &&
                            selectedStudent.textContent.includes(code);

                        if (!alreadyOpened) {

                            // Tim dung hoc sinh vua tao
                            // trong bang da tai lai.
                            const rows = Array.from(
                                document.querySelectorAll(
                                    "#studentTable tbody tr"
                                )
                            );

                            const studentRow = rows.find(
                                function (row) {
                                    return (
                                        row.cells[0]?.textContent.trim() ===
                                        code
                                    );
                                }
                            );

                            // Su dung chinh nut Cap tai khoan
                            // va luong nghiep vu da kiem thu.
                            const accountButton = studentRow
                                ? Array.from(
                                    studentRow.querySelectorAll("button")
                                ).find(function (button) {
                                    return (
                                        button.textContent.trim() ===
                                        "Cấp tài khoản"
                                    );
                                })
                                : null;

                            if (accountButton) {

                                accountButton.click();

                                // Khong de thong bao cu
                                // o trang Danh sach hoc sinh.
                                UIComponents.clear(
                                    "studentSaveMessage"
                                );

                            } else {

                                // Ho so da duoc tao, khong
                                // duoc thu POST /students lan nua.
                                UIComponents.showAlert(
                                    "studentSaveMessage",
                                    "Đã tạo và phân lớp học sinh " +
                                        code +
                                        " thành công, nhưng chưa tự " +
                                        "mở được biểu mẫu cấp tài khoản. " +
                                        "Hãy vào Quản lý tài khoản " +
                                        "học sinh để cấp tài khoản. " +
                                        "Không tạo lại hồ sơ.",
                                    "warning"
                                );
                            }

                        } else {

                            // Luong chuyen man hinh cu
                            // da mo dung hoc sinh.
                            UIComponents.clear(
                                "studentSaveMessage"
                            );
                        }
                    }

                } catch (error) {

                    UIComponents.showAlert(
                        goToAccount
                            ? "studentSaveMessage"
                            : "studentFormMessage",
                        message +
                            " Không thể tải lại danh sách: " +
                            error.message,
                        "warning"
                    );
                }

                /*
                 * BUOC 6: SAN SANG THEM HOC SINH TIEP
                 */

                if (!goToAccount) {

                    // Dam bao form van mo
                    panel.hidden = false;

                    // Dua con tro ve o Ma hoc sinh
                    el("studentCodeInput").focus();
                }

            } catch (error) {

                alertForm(
                    profileCreated
                        ? "Hồ sơ đã tạo, có lỗi tiếp theo: " +
                          error.message +
                          ". Không tạo lại mã này."
                        : "Không thể tạo học sinh: " +
                          error.message
                );

            } finally {

                saving = false;
                saveButton.disabled = false;
            }
        },
        true
    );
});
