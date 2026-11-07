"use strict";

// Nhat ky thao tac (Audit Log)
// Ho tro loc theo nien khoa, lop, mon, thao tac, nguoi thuc hien va thoi gian

document.addEventListener("DOMContentLoaded", function () {
    // 1. Cac phan tu DOM
    const academicYearSelect = document.getElementById("academicYearSelect");
    const classSelect = document.getElementById("classSelect");
    const subjectSelect = document.getElementById("subjectSelect");
    const actionTypeSelect = document.getElementById("actionTypeSelect");
    const performedByInput = document.getElementById("performedByInput");
    const fromDateInput = document.getElementById("fromDateInput");
    const toDateInput = document.getElementById("toDateInput");

    const applyFilterBtn = document.getElementById("applyFilterBtn");
    const resetFilterBtn = document.getElementById("resetFilterBtn");

    const alertContainer = document.getElementById("alertContainer");
    const auditLogTbody = document.getElementById("auditLogTbody");
    const logSummaryLabel = document.getElementById("logSummaryLabel");

    const kpiTotalActions = document.getElementById("kpiTotalActions");
    const kpiUnlockCount = document.getElementById("kpiUnlockCount");
    const kpiLockCount = document.getElementById("kpiLockCount");

    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageIndicator = document.getElementById("pageIndicator");

    // Modal Chi tiet nhat ky  Image 5
    const auditDetailModal = document.getElementById("auditDetailModal");
    const detailModalTitle = document.getElementById("detailModalTitle");
    const detailLogId = document.getElementById("detailLogId");
    const detailLogTime = document.getElementById("detailLogTime");
    const detailLogActor = document.getElementById("detailLogActor");
    const detailLogAction = document.getElementById("detailLogAction");
    const detailLogScope = document.getElementById("detailLogScope");
    const detailScoreChangeRow = document.getElementById("detailScoreChangeRow");
    const detailScoreChangeText = document.getElementById("detailScoreChangeText");
    const detailLogReason = document.getElementById("detailLogReason");
    const detailLogBeforeAfter = document.getElementById("detailLogBeforeAfter");
    const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");

    if (auditDetailModal) {
        auditDetailModal.hidden = true;
        auditDetailModal.style.display = "none";
    }

    // State noi bo
    let currentPage = 1;
    const pageSize = 100; // Hien thi toan bo thao tac trong mot danh sach tong the, khong chia le tung trang gay bat tien
    let totalPages = 1;
    let currentLogsList = [];

    // Helper ma hoa tranh XSS
    function escapeHtml(str) {
        if (str == null) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Helper loc bo chu "demo" khoi ten lop

    function cleanClassName(rawName) {
        if (rawName == null) return "-";
        return String(rawName).trim() || "-";
    }

    // Helper format ma hoc sinh ngan gon

    function formatStudentCode(rawCode) {
        if (rawCode == null) return "-";
        return String(rawCode).trim() || "-";
    }

    // Helper format thoi gian ngan : "30/10 15:40"
    function formatShortDate(dateStr) {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "-";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const mins = String(d.getMinutes()).padStart(2, "0");
        return `${day}/${month} ${hours}:${mins}`;
    }

    // Helper format thoi gian day du: "30/10/2026 15:40"
    function formatFullDate(dateStr) {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "-";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, "0");
        const mins = String(d.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${mins}`;
    }

    // 2. Khoi tao danh muc dropdown
    initCatalogs();
    loadAuditLogs(1);

    async function initCatalogs() {
        try {
            // Tai nien khoa
            const yearsRes = await apiClient.get("/academic-years");
            if (yearsRes && yearsRes.success && Array.isArray(yearsRes.data)) {
                academicYearSelect.innerHTML = '<option value="">2026–2027</option>';
                yearsRes.data.forEach(year => {
                    const opt = document.createElement("option");
                    opt.value = year.academicYearId || year.academic_year_id || year.id;
                    opt.textContent = year.code || year.name;
                    academicYearSelect.appendChild(opt);
                });
            }

            // Tai lop hoc (khong chua chu demo)
            const classRes = await apiClient.get("/classes");
            if (classRes && classRes.success && Array.isArray(classRes.data)) {
                classSelect.innerHTML = '<option value="">11A1</option>';
                classRes.data.forEach(cls => {
                    const opt = document.createElement("option");
                    opt.value = cls.classId || cls.class_id || cls.id;
                    opt.textContent = cleanClassName(cls.name || cls.code);
                    classSelect.appendChild(opt);
                });
            }

            // Tai mon hoc
            const subjectsRes = await apiClient.get("/subjects");
            if (subjectsRes && subjectsRes.success && Array.isArray(subjectsRes.data)) {
                subjectSelect.innerHTML = '<option value="">Toán</option>';
                subjectsRes.data.forEach(sub => {
                    const opt = document.createElement("option");
                    opt.value = sub.subjectId || sub.subject_id || sub.id;
                    opt.textContent = sub.name;
                    subjectSelect.appendChild(opt);
                });
            }
        } catch (error) {
            console.warn("Khong the tai danh muc bo loc:", error.message);
        }
    }

    // 3. Su kien Nut Xem du lieu / Tim kiem va Dat lai
    applyFilterBtn.addEventListener("click", function () {
        currentPage = 1;
        loadAuditLogs(currentPage);
    });

    resetFilterBtn.addEventListener("click", function () {
        if (fromDateInput) fromDateInput.value = "";
        if (toDateInput) toDateInput.value = "";
        if (actionTypeSelect) actionTypeSelect.value = "";
        if (academicYearSelect) academicYearSelect.selectedIndex = 0;
        if (classSelect) classSelect.selectedIndex = 0;
        if (subjectSelect) subjectSelect.selectedIndex = 0;
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

        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(pageSize));

        if (fromDateInput?.value) {
            params.append(
                "from",
                new Date(fromDateInput.value + "T00:00:00").toISOString()
            );
        }

        if (toDateInput?.value) {
            params.append(
                "to",
                new Date(toDateInput.value + "T23:59:59").toISOString()
            );
        }

        if (actionTypeSelect?.value) {
            params.append("actionType", actionTypeSelect.value);
        }

        if (academicYearSelect?.value) {
            params.append("academicYearId", academicYearSelect.value);
        }

        if (classSelect?.value) {
            params.append("classId", classSelect.value);
        }

        if (subjectSelect?.value) {
            params.append("subjectId", subjectSelect.value);
        }

        if (performedByInput?.value.trim()) {
            params.append("performedBy", performedByInput.value.trim());
        }

        auditLogTbody.innerHTML =
            '<tr><td colspan="6">Đang tải nhật ký...</td></tr>';

        try {
            const res = await apiClient.get(
                `/locks/audit-logs?${params.toString()}`
            );

            if (
                !res ||
                res.success !== true ||
                !Array.isArray(res.data?.items)
            ) {
                throw new Error(
                    res?.error?.message || "Không thể tải Audit Log"
                );
            }

            const items = res.data.items;
            const pagination = res.data.pagination || {};
            const totalItems = Number(
                pagination.totalItems ?? items.length
            );

            currentPage = page;
            totalPages = Math.max(
                1,
                Number(pagination.totalPages) || 1
            );

            updateKpiCards(items, totalItems);

            logSummaryLabel.textContent =
                `Tổng cộng: ${totalItems} thao tác`;

            pageIndicator.textContent =
                `Trang ${page} / ${totalPages}`;

            prevPageBtn.disabled = page <= 1;
            nextPageBtn.disabled = page >= totalPages;

            prevPageBtn.style.display =
                totalPages > 1 ? "inline-block" : "none";

            nextPageBtn.style.display =
                totalPages > 1 ? "inline-block" : "none";

            if (items.length === 0) {
                currentLogsList = [];

                auditLogTbody.innerHTML =
                    '<tr><td colspan="6">Chưa có nhật ký thao tác.</td></tr>';

                return;
            }

            // Chỉ sử dụng dữ liệu thật từ API
            renderAuditTable(items);

        } catch (error) {
            currentLogsList = [];
            updateKpiCards([], 0);

            auditLogTbody.innerHTML =
                '<tr><td colspan="6">Không thể tải nhật ký.</td></tr>';

            logSummaryLabel.textContent = "Lỗi tải dữ liệu";

            UIComponents.showAlert(
                "alertContainer",
                "Lỗi tải Audit Log: " + error.message,
                "error"
            );
        }
    }

    // 5. Cap nhat 3 KPI Summary Cards tinh tren toan bo su kien tong the
    function updateKpiCards(items, totalItems) {
        const unlockCount = items.filter(i => (i.actionType || i.actionRaw) === "UNLOCK").length;
        const lockCount = items.filter(i => {
            const act = i.actionType || i.actionRaw;
            return act === "LOCK" || act === "RELOCK";
        }).length;

        const total = totalItems || items.length || 0;
        if (kpiTotalActions) kpiTotalActions.textContent = `${total} thao tác`;
        if (kpiUnlockCount) kpiUnlockCount.textContent = `${unlockCount} sự kiện`;
        if (kpiLockCount) kpiLockCount.textContent = `${lockCount} sự kiện`;
    }

    // 6. Render bang danh sach lich su thao tac

    function renderDefaultAuditTable() {
        // Không sử dụng dữ liệu Audit Log giả lập
        currentLogsList = [];

        // Đưa thống kê về 0
        updateKpiCards([], 0);

        if (logSummaryLabel) {
            logSummaryLabel.textContent = "Tổng cộng: 0 thao tác";
        }

        if (pageIndicator) {
            pageIndicator.textContent = "Trang 1 / 1";
        }

        if (prevPageBtn) {
            prevPageBtn.disabled = true;
        }

        if (nextPageBtn) {
            nextPageBtn.disabled = true;
        }

        // Chỉ hiển thị thông báo khi chưa có dữ liệu
        auditLogTbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 24px;">
                    Chưa có nhật ký thao tác.
                </td>
            </tr>
        `;
    }

    function renderAuditTable(items) {
        if (!items || items.length === 0) {
            renderDefaultAuditTable();
            return;
        }

        const formattedList = items.map((log, index) => {
            let actionVi = log.action || "Thao tác";
            let beforeAfterText = log.beforeAfter || "Thành công";
            const rawAct = log.actionType || log.actionRaw || "OTHER";

            if (rawAct === "UNLOCK") {
                actionVi = "Mở khóa";
                if (!log.beforeAfter) beforeAfterText = "Trước: Đã khóa → Sau: Chưa khóa";
            } else if (rawAct === "LOCK") {
                actionVi = "Khóa";
                if (!log.beforeAfter) beforeAfterText = "Trước: Chưa khóa → Sau: Đã khóa";
            } else if (rawAct === "RELOCK") {
                actionVi = "Khóa lại";
                if (!log.beforeAfter) beforeAfterText = "Trước: Mở sửa điểm → Sau: Đã khóa lại";
            } else if (rawAct === "SCORE_EDIT") {
                actionVi = "Sửa điểm";
                const oldV = log.oldValue != null ? Number(log.oldValue).toFixed(2).replace(/\.00$/, "") : "-";
                const newV = log.newValue != null ? Number(log.newValue).toFixed(2).replace(/\.00$/, "") : "-";
                beforeAfterText = `Điểm cũ: ${oldV} → Điểm mới: ${newV}`;
            } else if (rawAct === "SCORE_IMPORT") {
                actionVi = "Nhập CSV";
                beforeAfterText = "Import tệp điểm thành công";
            }

            // Doi tuong : e.g. QT1 – Toán hoac HS001 – QT2

            let targetText = log.target;

            if (!targetText) {
                if (log.studentCode || log.studentName) {
                    const studentInfo = [
                        log.studentCode
                            ? formatStudentCode(log.studentCode)
                            : null,
                        log.studentName
                            ? `(${log.studentName})`
                            : null
                    ].filter(Boolean).join(" ");

                    targetText = studentInfo +
                        (log.component ? ` – ${log.component}` : "");

                } else {
                    targetText = [
                        log.component,
                        log.subjectName
                    ].filter(Boolean).join(" – ") || "-";
                }
            }

            const scopeParts = [
                log.component,
                log.subjectName,
                log.className
                    ? `Lớp ${cleanClassName(log.className)}`
                    : null
            ].filter(Boolean);

            const scopeFull = log.scopeFull ||
                (scopeParts.length > 0
                    ? scopeParts.join(" – ")
                    : targetText);

            let reasonText = log.reason || "-";
            if (rawAct === "SCORE_EDIT") {
                const oldV = log.oldValue != null ? Number(log.oldValue).toFixed(2).replace(/\.00$/, "") : "-";
                const newV = log.newValue != null ? Number(log.newValue).toFixed(2).replace(/\.00$/, "") : "-";
                if (log.reason && log.reason !== "-") {
                    reasonText = `${log.reason} (Sửa từ ${oldV} thành ${newV})`;
                } else {
                    reasonText = `Thay đổi từ ${oldV} thành ${newV}`;
                }
            }

            return {
                id: log.id || `LOG-${String(log.auditLogId || log.audit_log_id || index + 1).padStart(4, "0")}`,
                time: log.time || formatShortDate(log.createdAt),
                fullTime: log.fullTime || formatFullDate(log.createdAt),
                actor: log.actor ||
                    log.performedByName ||
                    (log.performedBy != null
                        ? `User #${log.performedBy}`
                        : "-"),
                action: actionVi,
                actionRaw: rawAct,
                target: targetText,
                scopeFull: scopeFull,
                reason: reasonText,
                beforeAfter: beforeAfterText,
                oldValue: log.oldValue,
                newValue: log.newValue
            };
        });

        currentLogsList = formattedList;
        renderTableRows(formattedList, false);
    }

    function renderTableRows(list, isMock) {
        auditLogTbody.replaceChildren();

        list.forEach((item, index) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${escapeHtml(item.time)}</td>
                <td>${escapeHtml(item.actor)}</td>
                <td>${escapeHtml(item.action)}</td>
                <td>${escapeHtml(item.target)}</td>
                <td>${escapeHtml(item.reason)}</td>
                <td style="text-align: center;">
                    <a href="javascript:void(0)" class="link-view-detail" data-idx="${index}">Xem</a>
                </td>
            `;

            auditLogTbody.appendChild(tr);
        });

        // Gan su kien click vao chu "Xem"
        auditLogTbody.querySelectorAll(".link-view-detail").forEach(btn => {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                const idx = Number(this.dataset.idx);
                const log = currentLogsList[idx];
                if (log) {
                    openDetailModal(log);
                }
            });
        });
    }

    // 7. Modal Chi tiet nhat ky thao tac
    function openDetailModal(log) {
        detailModalTitle.textContent = `Chi tiết nhật ký ${log.action.toLowerCase()}`;
        detailLogId.textContent = log.id;
        detailLogTime.textContent = log.fullTime || log.time;
        detailLogActor.textContent = log.actor || "-";
        if (detailLogAction) {
            detailLogAction.textContent = log.action;
        }
        detailLogScope.textContent = log.scopeFull || log.target;
        detailLogReason.textContent = log.reason;
        detailLogBeforeAfter.textContent = log.beforeAfter;


        if (detailScoreChangeRow && detailScoreChangeText) {
            const hasScoreData =
                log.oldValue != null || log.newValue != null;

            if (log.actionRaw === "SCORE_EDIT" && hasScoreData) {
                const oldVal = log.oldValue != null
                    ? Number(log.oldValue).toFixed(2)
                    : "-";

                const newVal = log.newValue != null
                    ? Number(log.newValue).toFixed(2)
                    : "-";

                detailScoreChangeRow.style.display = "flex";
                detailScoreChangeText.textContent =
                    `Sửa từ ${oldVal} thành ${newVal}`;
            } else {
                detailScoreChangeRow.style.display = "none";
                detailScoreChangeText.textContent = "";
            }
        }

        auditDetailModal.hidden = false;
        auditDetailModal.style.display = "flex";
    }

    function closeDetailModal() {
        auditDetailModal.hidden = true;
        auditDetailModal.style.display = "none";
    }

    closeDetailModalBtn.addEventListener("click", closeDetailModal);

    auditDetailModal.addEventListener("click", function (event) {
        if (event.target === auditDetailModal) {
            closeDetailModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !auditDetailModal.hidden) {
            closeDetailModal();
        }
    });
});
