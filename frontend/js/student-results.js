
"use strict";

document.addEventListener("DOMContentLoaded", async function () {
    const yearSelect = document.getElementById("studentYear");
    const termSelect = document.getElementById("studentTerm");
    const rows = document.getElementById("studentScoreRows");
    const message = document.getElementById("studentScoreMessage");
    const button = document.getElementById("studentViewButton");
    const studentName = document.getElementById("studentTopName");
    const title = document.getElementById("studentScoresTitle");
    const logout = document.getElementById("studentLogoutLink");
    const form = document.getElementById("studentScoreFilter");

    let profile = null;

    // Hien thi thong bao
    function setMessage(text, error = false) {
        message.textContent = text;
        message.classList.toggle("error", error);
    }

    // Hien thi bang rong
    function empty(text) {
        rows.replaceChildren();

        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan =
    document.querySelectorAll(".student-table thead th").length || 9;
        td.className = "student-empty";
        td.textContent = text;

        tr.appendChild(td);
        rows.appendChild(tr);
    }

    function displayValue(value) {
        if (value === null || value === undefined || value === "") {
            return "—";
        }

        return String(value);
    }

    // Hien thi bang diem do API hoc sinh tra ve
    
function renderScores(list, term) {
    const isYear = term === "YEAR";

    const columns = isYear
        ? [
            "subjectCode",
            "subjectName",
            "scoreHK1",
            "scoreHK2",
            "finalScore",
            "status"
        ]
        : [
            "subjectCode",
            "subjectName",
            "QT1", "QT2", "QT3",
            "GK", "CK",
            "finalScore",
            "status"
        ];

    const headers = isYear
        ? [
            "Mã môn", "Môn học",
            "HK1", "HK2", "Cả năm",
            "Trạng thái"
        ]
        : [
            "Mã môn", "Môn học",
            "QT1", "QT2", "QT3",
            "GK", "CK",
            "Tổng kết", "Trạng thái"
        ];

    const head = document.querySelector(
        ".student-table thead tr"
    );

    head.replaceChildren();

    for (const label of headers) {
        const th = document.createElement("th");
        th.textContent = label;
        head.appendChild(th);
    }

    rows.replaceChildren();

    if (!Array.isArray(list) || list.length === 0) {
        empty("Chưa có điểm được công bố.");
        return;
    }

    for (const item of list) {
        const tr = document.createElement("tr");

        for (const key of columns) {
            const td = document.createElement("td");
            td.textContent = displayValue(item[key]);
            tr.appendChild(td);
        }

        rows.appendChild(tr);
    }
}


    // DANG XUAT
    logout.addEventListener("click", async function (event) {
        event.preventDefault();

        logout.textContent = "Đang đăng xuất...";

        try {
            await apiClient.post("/auth/logout", {});
            window.location.replace("login.html");
        } catch (error) {
            logout.textContent = "Đăng xuất";
            setMessage("Không thể đăng xuất: " + error.message, true);
        }
    });

    // KIEM TRA TAI KHOAN DANG NHAP
    try {
        const me = await apiClient.get("/auth/me");

        if (!me || !me.success ||
            me.data?.roleCode !== "HOC_SINH") {
            window.location.replace("login.html");
            return;
        }

        // LAY HO SO VA NIEN KHOA CUA HOC SINH
       
const [profileResponse, yearsResponse] =
    await Promise.all([
        apiClient.get("/hoc-sinh/profile"),
        apiClient.get("/hoc-sinh/results/academic-years")
    ]);

// Kiem tra ho so hoc sinh
if (!profileResponse.success || !profileResponse.data) {
    throw new Error("Không tải được hồ sơ học sinh.");
}

profile = profileResponse.data;

// Hien thi ten hoc sinh
studentName.textContent =
    "Học sinh: " + profile.fullName;

// Kiem tra danh sach nien khoa
if (!yearsResponse.success ||
    !Array.isArray(yearsResponse.data)) {
    throw new Error("Không tải được danh sách niên khóa.");
}

// Chi hien thi 2 nien khoa cua he thong
const allowedYears = ["2025-2026", "2026-2027"];

const years = yearsResponse.data.filter(item =>
    allowedYears.includes(item.code)
);

// Xoa cac lua chon cu
yearSelect.replaceChildren(
    new Option("Chọn niên khóa", "")
);

// Them nien khoa vao danh sach
for (const code of allowedYears) {
    const item = years.find(year => year.code === code);

    if (item) {
        yearSelect.add(
            new Option(
                item.code,
                String(item.academicYearId)
            )
        );
    }
}

// Mac dinh chon nien khoa 2026-2027
const currentYear = years.find(
    item => item.code === "2026-2027"
);

if (currentYear) {
    yearSelect.value = String(currentYear.academicYearId);
} else if (yearSelect.options.length > 1) {
    yearSelect.selectedIndex = 1;
} else {
    setMessage("Chưa tìm thấy dữ liệu niên khóa.", true);
}

// Hien thi giao dien
document.body.hidden = false;


    } catch (error) {
        if (/401|403|Chua dang nhap|Phiên|Phien|Khong co quyen/i
            .test(error.message)) {
            window.location.replace("login.html");
            return;
        }

        document.body.hidden = false;
        setMessage(
            "Không tải được thông tin học sinh: " + error.message,
            true
        );
    }

    // XEM BANG DIEM
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!profile || !yearSelect.value) {
            setMessage("Vui lòng chọn niên khóa của học sinh.", true);
            return;
        }

        const term = termSelect.value;
        const label = termSelect.selectedOptions[0].textContent;

        title.textContent =
            "Bảng điểm " + label.toLowerCase() +
            " – " + profile.fullName +
            " (" + profile.studentCode + ")";

        button.disabled = true;
        empty("Đang tải kết quả...");
        setMessage("");

        try {
            // API nay can duoc Backend bo sung.
            // Backend phai lay studentId tu session.
            // Chi tra cac diem da cong bo cua hoc sinh.
            const result = await apiClient.get(
                "/hoc-sinh/results?academicYearId=" +
                encodeURIComponent(yearSelect.value) +
                "&term=" + encodeURIComponent(term)
            );

            if (!result?.success ||
                !Array.isArray(result.data?.rows)) {
                throw new Error(
                    "API bảng điểm học sinh trả về dữ liệu không hợp lệ."
                );
            }

            renderScores(result.data.rows, term);

        } catch (error) {
            empty("Chưa có dữ liệu kết quả để hiển thị.");

            setMessage(
                "Chưa kết nối được API xem điểm của học sinh. " +
                "Chi tiết: " + error.message,
                true
            );

        } finally {
            button.disabled = false;
        }
    });
});
