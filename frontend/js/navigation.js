
/* =====================================================
   VT2-02 - SHARED NAVIGATION
   Menu dung chung cho hai vai tro
   Chua xu ly dang nhap va phan quyen backend
   ===================================================== */

// Danh sach menu theo tung vai tro
const NAVIGATION_MENUS = {
    admin: [
        { label: "Trang chủ", url: "dashboard.html" },
        { label: "Niên khóa / Khối / Lớp", url: null },
        { label: "Học sinh / Tài khoản", url: null },
        { label: "Môn học", url: null },
        { label: "Bảng điểm", url: null },
        { label: "Khóa / Mở khóa", url: null },
        { label: "Audit Log", url: null },
        { label: "Import / Export CSV", url: null }
    ],

    student: [
        { label: "Kết quả học tập", url: null }
    ]
};

// Hien thi menu theo vai tro duoc truyen vao
function renderNavigation(role, containerId) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.warn("Khong tim thay khu vuc menu.");
        return;
    }

    // Khong hien menu neu vai tro khong hop le
    const menuItems = NAVIGATION_MENUS[role];

    if (!menuItems) {
        container.replaceChildren();
        console.warn("Vai tro khong hop le.");
        return;
    }

    container.replaceChildren();

    menuItems.forEach(function (item) {
        const link = document.createElement("a");
        link.textContent = item.label;

        if (item.url) {
            link.href = item.url;

            // Danh dau menu cua trang hien tai
            const currentPage = window.location.pathname
                .split("/")
                .pop();

            if (currentPage === item.url) {
                link.classList.add("active");
            }
        } else {
            // Chua co trang dich, khong dieu huong gia
            link.removeAttribute("href");
            link.classList.add("menu-placeholder");
            link.setAttribute("aria-disabled", "true");
        }

        container.appendChild(link);
    });
}

