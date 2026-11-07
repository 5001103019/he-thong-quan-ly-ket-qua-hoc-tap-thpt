
   //Cac thanh phan giao dien dung chung

const UIComponents = {

    // Hien thi thong bao thanh cong, canh bao hoac loi
    showAlert: function (containerId, message, type = "success") {
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn("Khong tim thay vung thong bao.");
            return;
        }

        const allowedTypes = ["success", "warning", "error"];

        if (!allowedTypes.includes(type)) {
            type = "warning";
        }

        const alert = document.createElement("div");
        alert.className = "alert alert-" + type;
        alert.setAttribute("role", "alert");

        const msgSpan = document.createElement("span");
        msgSpan.className = "alert-message";
        msgSpan.textContent = message;

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "alert-close-btn";
        closeBtn.setAttribute("aria-label", "Đóng thông báo");
        closeBtn.innerHTML = "&times;";
        closeBtn.addEventListener("click", function () {
            alert.remove();
        });

        alert.appendChild(msgSpan);
        alert.appendChild(closeBtn);

        container.replaceChildren(alert);

        // Tu dong an sau 6 giay
        setTimeout(function () {
            if (alert.parentElement) {
                alert.style.transition = "opacity 0.3s ease";
                alert.style.opacity = "0";
                setTimeout(function () {
                    if (alert.parentElement) {
                        alert.remove();
                    }
                }, 300);
            }
        }, 6000);
    },

    // Hien thi trang thai dang tai du lieu
    showLoading: function (containerId) {
        this.showState(containerId, "Đang tải dữ liệu...");
    },

    // Hien thi khi chua co du lieu
    showEmpty: function (containerId) {
        this.showState(containerId, "Chưa có dữ liệu để hiển thị.");
    },

    // Hien thi loi tai du lieu
    showError: function (containerId) {
        this.showAlert(
            containerId,
            "Không thể tải dữ liệu. Vui lòng thử lại.",
            "error"
        );
    },

    // Ham dung chung cho cac trang thai
    showState: function (containerId, message) {
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn("Khong tim thay vung hien thi.");
            return;
        }

        const state = document.createElement("div");
        state.className = "state-message";
        state.textContent = message;

        container.replaceChildren(state);
    },

    // Xoa noi dung hien tai
    clear: function (containerId) {
        const container = document.getElementById(containerId);

        if (container) {
            container.replaceChildren();
        }
    },

    // Tao o nhap lieu voi nhan
    createInput: function (labelText, inputId, placeholder = "") {
        const wrapper = document.createElement("div");
        wrapper.className = "form-group";

        const label = document.createElement("label");
        label.htmlFor = inputId;
        label.textContent = labelText;

        const input = document.createElement("input");
        input.type = "text";
        input.id = inputId;
        input.className = "form-control";
        input.placeholder = placeholder;

        wrapper.appendChild(label);
        wrapper.appendChild(input);

        return wrapper;
    },

    // Tao bang tu danh sach cot va du lieu
    createTable: function (columns, rows) {
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";

        const table = document.createElement("table");
        table.className = "data-table";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        columns.forEach(function (column) {
            const th = document.createElement("th");
            th.textContent = column.label;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        rows.forEach(function (row) {
            const tr = document.createElement("tr");

            columns.forEach(function (column) {
                const td = document.createElement("td");

                const value = row[column.key];

                td.textContent =
                    value === null || value === undefined
                        ? ""
                        : String(value);

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        wrapper.appendChild(table);

        return wrapper;
    }
};

