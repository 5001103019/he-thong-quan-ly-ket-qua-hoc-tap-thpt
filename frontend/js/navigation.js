
/* =====================================================
   VT2-02 - SHARED NAVIGATION
   Menu dung chung cho hai vai tro.
   File nay chi phu trach hien thi va dieu huong.
   Phan quyen API do Backend kiem tra.
   ===================================================== */

const NAVIGATION_MENUS = {
    admin: [

        {
            label: "Trang chủ",
            url: "/pages/dashboard.html"
        },
        {
            label: "Niên khóa / Khối / Lớp",
            url: "/pages/academic-management.html"
        },
        {
            label: "Học sinh / Tài khoản",
            url: "/pages/student-management.html"
        },
        {
            label: "Môn học",
            url: "/pages/subject-management.html"
        },
        {
            label: "Bảng điểm",
            url: "/pages/score-grid.html"
        },
        {
            label: "Khóa / Mở khóa",
            url: "/pages/lock-unlock.html"
        },
        {
            label: "Nhật ký thao tác",
            url: "/pages/audit-log.html"
        },
        {
            label: "Import / Export CSV",
            url: "/pages/score-csv-import.html"
        },
    ],

    student: [
        {
            label: "Kết quả học tập",
            url: null
        }
    ]
};

// Hien thi menu theo vai tro duoc truyen vao.
function renderNavigation(role, containerId) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.warn("Khong tim thay khu vuc menu.");
        return;
    }

    const menuItems = NAVIGATION_MENUS[role];

    if (!menuItems) {
        container.replaceChildren();
        console.warn("Vai tro khong hop le.");
        return;
    }

    container.replaceChildren();

    const currentPath = window.location.pathname;

    menuItems.forEach(function (item) {
        const link = document.createElement("a");

        link.textContent = item.label;

        if (item.url) {
            link.href = item.url;

            // Danh dau trang dang duoc mo.
            if (currentPath === new URL(item.url, window.location.href).pathname) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");
            }
        } else {
            // Chua co trang dich, khong dieu huong gia.
            link.classList.add("menu-placeholder");
            link.setAttribute("aria-disabled", "true");
            link.setAttribute(
                "title",
                "Chuc nang chua duoc ket noi giao dien."
            );
        }

        container.appendChild(link);
    });
}
