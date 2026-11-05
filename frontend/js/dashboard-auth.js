
"use strict";

// VT1-04 - Kiem tra phien va xu ly dang xuat Dashboard

document.addEventListener("DOMContentLoaded", async function () {
    const logoutLink = document.getElementById("logoutLink");

    try {
        // Lay thong tin tai khoan tu session cookie
        const result = await apiClient.get("/auth/me");

        // Chi Phong Khao thi duoc vao Dashboard nay
        if (
            !result ||
            result.success !== true ||
            !result.data ||
            result.data.roleCode !== "KHAO_THI"
        ) {
            window.location.replace("login.html");
            return;
        }

        // Hien thi menu quan tri sau khi xac thuc thanh cong
        renderNavigation("admin", "sidebarNavigation");

        // Hien thi giao dien
        document.body.hidden = false;

    } catch (error) {
        // Chua dang nhap hoac phien het han
        window.location.replace("login.html");
        return;
    }

    // Xu ly dang xuat
    if (logoutLink) {
        logoutLink.addEventListener("click", async function (event) {
            event.preventDefault();

            logoutLink.textContent = "Đang đăng xuất...";

            try {
                await apiClient.post("/auth/logout", {});
                window.location.replace("login.html");
            } catch (error) {
                alert("Không thể đăng xuất. Vui lòng thử lại.");
                logoutLink.textContent = "Đăng xuất";
            }
        });
    }
});
