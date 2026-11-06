"use strict";

// Tra cuu nhat ky kiem toan (Audit Log)
// Ho tro loc theo thoi gian, nguoi thuc hien, cot diem va loai thao tac

document.addEventListener("DOMContentLoaded", function () {
    // 1. Cac phan tu DOM
    const fromDateInput = document.getElementById("fromDateInput");
    const toDateInput = document.getElementById("toDateInput");
    const actionTypeSelect = document.getElementById("actionTypeSelect");
    const componentSelect = document.getElementById("componentSelect");
    const academicYearSelect = document.getElementById("academicYearSelect");
    const classSelect = document.getElementById("classSelect");
    const subjectSelect = document.getElementById("subjectSelect");
    const performedByInput = document.getElementById("performedByInput");

    const applyFilterBtn = document.getElementById("applyFilterBtn");
    const resetFilterBtn = document.getElementById("resetFilterBtn");

    const alertContainer = document.getElementById("alertContainer");
    const auditLogTableContainer = document.getElementById("auditLogTableContainer");
    const logSummaryLabel = document.getElementById("logSummaryLabel");

    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageIndicator = document.getElementById("pageIndicator");

    // State noi bo
    let currentPage = 1;
    const pageSize = 20;
    let totalPages = 1;

    // 2. Khoi tao danh muc dropdown
    initCatalogs();
    loadAuditLogs(1);

    async function initCatalogs() {
        try {
            // Tai nien khoa
            const yearsRes = await apiClient.get("/academic-years");
            if (yearsRes && yearsRes.success && Array.isArray(yearsRes.data)) {
                academicYearSelect.innerHTML = '<option value="">-- Tất cả niên khóa --</option>';
                yearsRes.data.forEach(year => {
                    const opt = document.createElement("option");
                    opt.value = year.academicYearId || year.academic_year_id || year.id;
                    opt.textContent = year.code || year.name;
                    academicYearSelect.appendChild(opt);
                });
            }

            // Tai lop hoc
            const classRes = await apiClient.get("/classes");
            if (classRes && classRes.success && Array.isArray(classRes.data)) {
                classSelect.innerHTML = '<option value="">-- Tất cả lớp --</option>';
                classRes.data.forEach(cls => {
                    const opt = document.createElement("option");
                    opt.value = cls.classId || cls.class_id || cls.id;
                    opt.textContent = cls.name || cls.code;
                    classSelect.appendChild(opt);
                });
            }

            // Tai mon hoc
            const subjectsRes = await apiClient.get("/subjects");
            if (subjectsRes && subjectsRes.success && Array.isArray(subjectsRes.data)) {
                subjectSelect.innerHTML = '<option value="">-- Tất cả môn --</option>';
                subjectsRes.data.forEach(sub => {
                    const opt = document.createElement("option");
                    opt.value = sub.subjectId || sub.subject_id || sub.id;
                    opt.textContent = sub.name + " (" + sub.code + ")";
                    subjectSelect.appendChild(opt);
                });
            }
        } catch (error) {
            console.warn("Khong the tai danh muc bo loc:", error.message);
        }
    }

    // 3. Su kien Nut Tim kiem va Dat lai
    applyFilterBtn.addEventListener("click", function () {
        currentPage = 1;
        loadAuditLogs(currentPage);
    });

    resetFilterBtn.addEventListener("click", function () {
        fromDateInput.value = "";
        toDateInput.value = "";
        actionTypeSelect.value = "";
        componentSelect.value = "";
        academicYearSelect.value = "";
        classSelect.value = "";
        subjectSelect.value = "";
        if (performedByInput) performedByInput.value = "";

        currentPage = 1;
        loadAuditLogs(currentPage);
    });

    prevPageBtn.addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            loadAuditLogs(currentPage);
        }
    });

    nextPageBtn.addEventListener("click", function () {
        if (currentPage < totalPages) {
            currentPage++;
            loadAuditLogs(currentPage);
        }
    });

    // 4. Goi API tai danh sach Audit Log
    async function loadAuditLogs(page) {
        UIComponents.clear("alertContainer");
        UIComponents.showLoading("auditLogTableContainer");

        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(pageSize));

        if (fromDateInput.value) {
            params.append("from", new Date(fromDateInput.value + "T00:00:00").toISOString());
        }
        if (toDateInput.value) {
            params.append("to", new Date(toDateInput.value + "T23:59:59").toISOString());
        }
        if (actionTypeSelect.value) {
            params.append("actionType", actionTypeSelect.value);
        }
        if (componentSelect.value) {
            params.append("component", componentSelect.value);
        }
        if (academicYearSelect.value) {
            params.append("academicYearId", academicYearSelect.value);
        }
        if (classSelect.value) {
            params.append("classId", classSelect.value);
        }
        if (subjectSelect.value) {
            params.append("subjectId", subjectSelect.value);
        }
        if (performedByInput && performedByInput.value.trim()) {
            params.append("performedBy", performedByInput.value.trim());
        }

        try {
            const res = await apiClient.get(`/locks/audit-logs?${params.toString()}`);

            if (res && res.success && res.data) {
                const items = res.data.items || [];
                const pagination = res.data.pagination || {};

                totalPages = pagination.totalPages || 1;
                const totalItems = pagination.totalItems || 0;

                logSummaryLabel.textContent = `Tổng cộng ${totalItems} bản ghi kiểm toán`;
                pageIndicator.textContent = `Trang ${page} / ${totalPages}`;

                prevPageBtn.disabled = page <= 1;
                nextPageBtn.disabled = page >= totalPages;

                renderAuditTable(items);
            } else {
                UIComponents.showEmpty("auditLogTableContainer");
                logSummaryLabel.textContent = "0 bản ghi";
            }
        } catch (error) {
            UIComponents.showAlert(
                "alertContainer",
                "Không thể tải nhật ký kiểm toán: " + error.message,
                "error"
            );
            UIComponents.showError("auditLogTableContainer");
            logSummaryLabel.textContent = "Lỗi tải dữ liệu";
        }
    }

    // Ham ma hoa tranh XSS khi render du lieu tu API
    function escapeHtml(str) {
        if (str == null) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 5. Render bang Audit Log
    function renderAuditTable(items) {
        if (!items || items.length === 0) {
            UIComponents.showEmpty("auditLogTableContainer");
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";

        const table = document.createElement("table");
        table.className = "data-table";

        table.innerHTML = `
            <thead>
                <tr>
                    <th style="width: 140px;">Thời gian</th>
                    <th style="width: 110px;">Thao tác</th>
                    <th style="width: 140px;">Người thực hiện</th>
                    <th style="width: 160px;">Phạm vi / Cột</th>
                    <th>Học sinh liên quan</th>
                    <th style="width: 120px;">Thay đổi điểm</th>
                    <th>Lý do giải trình</th>
                    <th style="width: 80px; text-align: center;">Kết quả</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector("tbody");

        items.forEach(log => {
            const tr = document.createElement("tr");

            // Format thoi gian DATETIMEOFFSET
            const dateStr = log.createdAt
                ? new Date(log.createdAt).toLocaleString("vi-VN")
                : "-";

            // Tag thao tac
            let actionClass = "action-lock";
            if (log.actionType === "UNLOCK") actionClass = "action-unlock";
            else if (log.actionType === "RELOCK") actionClass = "action-relock";
            else if (log.actionType === "SCORE_EDIT") actionClass = "action-score-edit";
            else if (log.actionType === "SCORE_IMPORT") actionClass = "action-score-import";

            const safeActionType = escapeHtml(log.actionType || "");
            const actionTag = `<span class="tag-action ${actionClass}">${safeActionType}</span>`;

            // Pham vi: Lop - Mon - Cot diem
            const scopeParts = [];
            if (log.className) scopeParts.push(escapeHtml(log.className));
            if (log.subjectName) scopeParts.push(escapeHtml(log.subjectName));
            if (log.component) scopeParts.push(`<strong>${escapeHtml(log.component)}</strong>`);
            const scopeText = scopeParts.length > 0 ? scopeParts.join(" &bull; ") : "-";

            // Hoc sinh
            const studentText = log.studentName
                ? `${escapeHtml(log.studentName)} <small style="color: #64748B;">(${escapeHtml(log.studentCode || "")})</small>`
                : "-";

            // Thay doi gia tri
            let changeText = "-";
            if (log.oldValue !== null || log.newValue !== null) {
                const oldVal = log.oldValue !== null ? Number(log.oldValue).toFixed(2) : "-";
                const newVal = log.newValue !== null ? Number(log.newValue).toFixed(2) : "-";
                changeText = `<code>${escapeHtml(oldVal)}</code> &rarr; <strong><code>${escapeHtml(newVal)}</code></strong>`;
            }

            // Ly do
            let reasonText = log.reason ? escapeHtml(log.reason) : "-";
            if (log.requestedByName) {
                reasonText += `<br/><small style="color: #2563EB;">Yêu cầu: ${escapeHtml(log.requestedByName)}</small>`;
            }

            // Ket qua
            const safeResult = escapeHtml(log.result || "FAILED");
            const resultBadge = log.result === "SUCCESS"
                ? `<span class="badge-result result-success">SUCCESS</span>`
                : `<span class="badge-result result-failed">${safeResult}</span>`;

            const safePerformedBy = escapeHtml(log.performedByName || ("User #" + log.performedBy));

            tr.innerHTML = `
                <td style="font-size: 13px; color: #475569;">${dateStr}</td>
                <td>${actionTag}</td>
                <td><strong>${safePerformedBy}</strong></td>
                <td style="font-size: 13px;">${scopeText}</td>
                <td style="font-size: 13px;">${studentText}</td>
                <td>${changeText}</td>
                <td style="font-size: 13px;">${reasonText}</td>
                <td style="text-align: center;">${resultBadge}</td>
            `;

            tbody.appendChild(tr);
        });

        auditLogTableContainer.replaceChildren(table);
    }
});

