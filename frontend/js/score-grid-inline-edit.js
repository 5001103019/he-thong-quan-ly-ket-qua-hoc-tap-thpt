
"use strict";

// Sua diem truc tiep tren trang Bang diem.
// Cot chua khoa duoc sua, khong can nhap ly do.
document.addEventListener("DOMContentLoaded", function () {

    const TYPES = ["QT1", "QT2", "QT3", "GK", "CK"];
    const get = id => document.getElementById(id);
    
    // Goi API truc tiep qua fetch
    const scoreEditApi = {
        async request(path, method = "GET", body) {
            const response = await fetch("/api/v1" + path, {
                method: method,
                credentials: "same-origin",
                headers: body === undefined
                    ? {}
                    : { "Content-Type": "application/json" },
                body: body === undefined
                    ? undefined
                    : JSON.stringify(body)
            });

            let result;

            try {
                result = await response.json();
            } catch {
                throw new Error(
                    "API không trả về dữ liệu JSON hợp lệ."
                );
            }

            if (!response.ok || result.success !== true) {
                throw new Error(
                    result.error?.message ||
                    "Lỗi API: " + response.status
                );
            }

            return result;
        },

        get(path) {
            return this.request(path);
        },

        post(path, body) {
            return this.request(path, "POST", body);
        },

        patch(path, body) {
            return this.request(path, "PATCH", body);
        }
    };

    // Tim dung bang diem
    function isScoreTable(table) {
        if (!table) return false;

        const titles = [...table.querySelectorAll("thead th")]
            .map(th => th.textContent.trim().toUpperCase());

        return TYPES.every(type => titles.includes(type));
    }

    const table = [...document.querySelectorAll("table")]
        .find(isScoreTable);

    const selects = [...document.querySelectorAll("select")];

    const year =
        get("scoreAcademicYear") || selects[0];

    const classroom =
        get("scoreClass") || selects[2];

    const subject =
        get("scoreSubject") || selects[3];

    const loadButton =
        get("btnLoadScores") ||
        [...document.querySelectorAll("button")].find(
            button => button.textContent.includes("Xem bảng điểm")
        );

    // Kiem tra thanh phan giao dien
    if (!table || !year || !classroom ||
        !subject || !loadButton) {

        console.error("Khong tim thay thanh phan de sua diem.", {
            table: !!table,
            year: !!year,
            classroom: !!classroom,
            subject: !!subject,
            loadButton: !!loadButton
        });

        return;
    }

    // Vung thong bao
    const notice = document.createElement("div");
    notice.setAttribute("role", "status");
    notice.style.cssText =
        "margin:10px 0;padding:10px;" +
        "border-radius:6px;display:none";

    table.before(notice);

    // Huong dan nguoi dung
    const hint = document.createElement("p");
    hint.textContent =
        "Nhấp vào ô điểm chưa khóa để chỉnh sửa trực tiếp.";

    hint.style.cssText =
        "font-size:13px;color:#607998;margin:10px 0";

    table.before(hint);

    function show(text, error = false) {
        notice.textContent = text;
        notice.style.display = "block";
        notice.style.background =
            error ? "#fff0ee" : "#e4f7ee";
        notice.style.color =
            error ? "#a52d27" : "#087b53";
    }

    // Lay bo loc hien tai
    function scopeQuery() {
        return new URLSearchParams({
            academicYearId: year.value,
            classId: classroom.value,
            subjectId: subject.value,
            term: document.getElementById("scoreTerm")?.value || "HK1"
        }).toString();
    }

    let editing = false;

    // Bat su kien nhan vao bang diem
    document.addEventListener("click", async function (event) {

        if (
            editing ||
            event.target.closest("button,input,select")
        ) {
            return;
        }

        const selectedTerm =
            document.getElementById("scoreTerm")?.value;

        if (selectedTerm !== "HK1") {
            return;
        }

        const cell = event.target.closest("td");

        if (!cell || cell.closest("table") !== table) {
            return;
        }

        const tr = cell.closest("tr");
        if (!tr) return;

        // Xac dinh cot diem qua tieu de
        const headerCells =
            [...table.querySelectorAll("thead th")];

        const type = headerCells[cell.cellIndex]
            ?.textContent.trim().toUpperCase();

        if (!TYPES.includes(type)) return;

        if (get("scoreTerm")?.value !== "HK1") {
            show(
                "Hien tai chi ho tro sua diem HK1. " +
                "Chuc nang sua HK2 dang duoc ket noi.",
                true
            );
            return;
        }

        const studentCode =
            tr.cells[0]?.textContent.trim();

        if (!studentCode) return;

        // Khong cho sua cot co bieu tuong khoa
        if (
            /🔒|🔐/.test(cell.textContent) ||
            cell.dataset.locked === "true"
        ) {
            show(
                "Cột " + type + " đã khóa, không thể sửa.",
                true
            );
            return;
        }

        editing = true;

        const oldHtml = cell.innerHTML;
        const originalScope = scopeQuery();

        function restore() {
            if (cell.isConnected) {
                cell.innerHTML = oldHtml;
            }
            editing = false;
        }

        try {
            // Kiem tra API
            
        
            // Lay diem moi nhat tu SQL Server
            const response = await scoreEditApi.get(
                "/scores?" + originalScope
            );


            const list = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.data?.rows)
                    ? response.data.rows
                    : null;

            if (response?.success !== true || !list) {
                throw new Error(
                    response?.error?.message ||
                    "API bảng điểm trả dữ liệu không hợp lệ."
                );
            }

            // Tim hoc sinh duoc chon
            const record = list.find(item =>
                String(
                    item.studentCode ??
                    item.student?.studentCode ??
                    ""
                ).trim() === studentCode
            );

            if (!record) {
                throw new Error(
                    "Không tìm thấy học sinh " +
                    studentCode + " trong API."
                );
            }

            const components =
                Array.isArray(record.components)
                    ? record.components
                    : [];

            const part = components.find(
                item => item.componentType === type
            );

            // Kiem tra khoa tu du lieu API
            const isLocked =
                part?.lockStatus === "LOCKED" ||
                part?.isLocked === true ||
                part?.locked === true ||
                (
                    Array.isArray(record.lockedComponents) &&
                    record.lockedComponents.includes(type)
                );

            if (isLocked) {
                show(
                    "Cột " + type +
                    " đã khóa. Cần mở khóa trước khi sửa.",
                    true
                );

                editing = false;
                return;
            }

            // Gia tri diem hien tai
            const oldScore =
                part?.scoreValue ?? record[type] ?? null;

            const oldStatus =
                part?.scoreStatus ||
                (
                    oldScore === null
                        ? "NOT_ENTERED"
                        : "SCORED"
                );

            // Tao o nhap diem
            const input = document.createElement("input");

            input.type = "number";
            input.min = "0";
            input.max = "10";

            input.step = type.startsWith("QT")
                ? "1"
                : "0.25";

            input.value =
                oldStatus === "SCORED" &&
                oldScore !== null
                    ? String(oldScore)
                    : "";

            input.style.cssText =
                "width:70px;padding:6px;" +
                "border:1px solid #2563eb;" +
                "border-radius:5px";

            // Nut Luu
            const save = document.createElement("button");
            save.type = "button";
            save.textContent = "Lưu";

            save.style.cssText =
                "margin:3px;padding:6px 8px;" +
                "background:#1d62e7;color:white;" +
                "border:0;border-radius:5px;" +
                "cursor:pointer";

            // Nut Huy
            const cancel = document.createElement("button");
            cancel.type = "button";
            cancel.textContent = "Hủy";

            cancel.style.cssText =
                "margin:3px;padding:6px 8px;" +
                "border:0;border-radius:5px;" +
                "cursor:pointer";

            // Hien thi o sua
            cell.replaceChildren(input, save, cancel);

            cancel.addEventListener("click", restore);

            // Enter de luu, Escape de huy
            input.addEventListener("keydown", function (e) {

                if (e.key === "Escape") {
                    restore();
                }

                if (e.key === "Enter") {
                    e.preventDefault();
                    save.click();
                }
            });

            // XU LY LUU DIEM
            save.addEventListener("click", async function () {

                const raw = input.value.trim();

                const scoreValue =
                    raw === "" ? null : Number(raw);

                const scoreStatus =
                    scoreValue === null
                        ? "NOT_ENTERED"
                        : "SCORED";

                // Kiem tra diem hop le
                const valid = raw === "" || (
                    Number.isFinite(scoreValue) &&
                    scoreValue >= 0 &&
                    scoreValue <= 10 &&
                    (
                        type.startsWith("QT")
                            ? Number.isInteger(scoreValue)
                            : Number.isInteger(scoreValue * 4)
                    )
                );

                if (!valid) {
                    show(
                        "QT phải là số nguyên 0–10; " +
                        "GK và CK theo bước 0,25.",
                        true
                    );
                    return;
                }

                // Khong luu neu diem khong thay doi
                const oldNumeric =
                    oldScore === null
                        ? null
                        : Number(oldScore);

                if (
                    oldNumeric === scoreValue &&
                    oldStatus === scoreStatus
                ) {
                    restore();
                    return;
                }

                save.disabled = true;
                cancel.disabled = true;
                input.disabled = true;

                try {
                    // Kiem tra bo loc co thay doi khong
                    if (scopeQuery() !== originalScope) {
                        throw new Error(
                            "Bộ lọc đã thay đổi. " +
                            "Hãy tải lại bảng điểm."
                        );
                    }

                    let recordId = record.scoreRecordId;
                    let version = record.version;

                    // Tao ban ghi neu chua ton tai
                    if (!recordId) {

                        if (
                            !record.enrollmentId ||
                            !subject.value
                        ) {
                            throw new Error(
                                "Thiếu enrollmentId hoặc " +
                                "subjectId để tạo bản ghi điểm."
                            );
                        }

                        const created = await scoreEditApi.post(
                            "/score-records",
                            {
                                enrollmentId:
                                    Number(record.enrollmentId),

                                subjectId:
                                    Number(subject.value)
                            }
                        );

                        if (
                            created?.success !== true ||
                            !created.data
                        ) {
                            throw new Error(
                                created?.error?.message ||
                                "Không tạo được bản ghi điểm."
                            );
                        }

                        recordId =
                            created.data.scoreRecordId;

                        version =
                            created.data.version;
                    }

                    if (
                        !recordId ||
                        !Number.isSafeInteger(Number(version))
                    ) {
                        throw new Error(
                            "API thiếu scoreRecordId hoặc version."
                        );
                    }

                    // KHONG HIEN HOP THOAI NHAP LY DO.
                    // Gui ly do mac dinh de Backend ghi nhat ky.
                    const saved = await scoreEditApi.patch(
                        "/score-records/" + recordId +
                        "/components/" + type,
                        {
                            scoreValue: scoreValue,
                            scoreStatus: scoreStatus,

                            expectedVersion:
                                Number(version),

                            reason:
                                "Cập nhật điểm khi cột chưa khóa"
                        }
                    );

                    if (saved?.success !== true) {
                        throw new Error(
                            saved?.error?.message ||
                            "API không lưu được điểm."
                        );
                    }

                    // Luu thanh cong
                    restore();

                    // Tai lai bang diem tu SQL Server
                    loadButton.click();

                    show(
                        "Đã lưu điểm " + type +
                        " của " +
                        (record.fullName || studentCode) +
                        ". Kiểm tra Nhật ký thao tác."
                    );

                } catch (error) {

                    restore();

                    show(
                        "Không lưu được điểm: " +
                        error.message,
                        true
                    );
                }
            });

            input.focus();
            input.select();

        } catch (error) {

            restore();

            show(
                "Không mở được ô sửa điểm: " +
                error.message,
                true
            );
        }
    });

    console.log(
        "Đã bật chức năng sửa điểm trực tiếp."
    );
});
