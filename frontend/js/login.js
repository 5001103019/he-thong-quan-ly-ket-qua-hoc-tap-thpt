
"use strict";

// VT1-04 - Xu ly dang nhap theo hai vai tro

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("loginMessage");
    const buttons = document.querySelectorAll(".login-role-button");

    function showMessage(text, isError = true) {
        message.textContent = text;
        message.style.color = isError ? "#C62828" : "#166534";
    }

    function setLoading(loading) {
        buttons.forEach(function (button) {
            button.disabled = loading;
        });
    }

    form.addEventListener("submit", async function (event) {
        // Ngan form gui GET, khong dua mat khau len URL
        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const expectedRole = event.submitter
            ? event.submitter.dataset.expectedRole
            : null;

        if (!username || !password) {
            showMessage("Vui lòng nhập tên đăng nhập và mật khẩu.");
            return;
        }

        if (!expectedRole) {
            showMessage("Vui lòng chọn vai trò đăng nhập.");
            return;
        }

        setLoading(true);
        showMessage("Đang đăng nhập...", false);

        try {
            const result = await apiClient.post("/auth/login", {
                username: username,
                password: password
            });

            if (!result || !result.success || !result.data) {
                throw new Error("Đăng nhập không thành công.");
            }

            const roleCode = result.data.roleCode;

            if (roleCode !== expectedRole) {
                await apiClient.post("/auth/logout", {});
                showMessage("Tài khoản không thuộc vai trò đã chọn.");
                return;
            }

            if (roleCode === "KHAO_THI") {
                window.location.replace("dashboard.html");
                return;
            }

            
if (roleCode === "HOC_SINH") {
    window.location.replace("student-results.html");
    return;
}


            showMessage("Vai trò không hợp lệ.");
        } catch (error) {
            showMessage(error.message || "Không thể đăng nhập.");
        } finally {
            setLoading(false);
        }
    });
});
