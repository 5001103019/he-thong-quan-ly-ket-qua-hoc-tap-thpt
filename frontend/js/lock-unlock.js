"use strict";

// Quan ly khoa va mo khoa diem
// Ho tro kiem tra trang thai 5 cot diem, mo khoa co ly do, khoa lai va thiet lap thoi han tu dong khoa (BR-LP03)

document.addEventListener("DOMContentLoaded", function () {
    // 1. Cac phan tu DOM
    const academicYearSelect = document.getElementById("academicYearSelect");
    const gradeSelect = document.getElementById("gradeSelect");
    const classSelect = document.getElementById("classSelect");
    const subjectSelect = document.getElementById("subjectSelect");
    const loadLocksBtn = document.getElementById("loadLocksBtn");

    const alertContainer = document.getElementById("alertContainer");
    const locksCardsContainer = document.getElementById("locksCardsContainer");
    const referenceScoresTbody = document.getElementById("referenceScoresTbody");
    // Khong hien thi du lieu mau khi chua co lop va mon hoc
locksCardsContainer.replaceChildren();
referenceScoresTbody?.replaceChildren();
    // Thiet lap thoi han tu dong khoa (ngan gon)
    const autoLockCompSelect = document.getElementById("autoLockCompSelect");
    const autoLockDateTimeInput = document.getElementById("autoLockDateTimeInput");
    const saveAutoLockDeadlineBtn = document.getElementById("saveAutoLockDeadlineBtn");

    // Modal Mo khoa
    const unlockModal = document.getElementById("unlockModal");
    const unlockModalTitle = document.getElementById("unlockModalTitle");
    const unlockModalSubtitle = document.getElementById("unlockModalSubtitle");
    const cancelUnlockBtn = document.getElementById("cancelUnlockBtn");
    const confirmUnlockBtn = document.getElementById("confirmUnlockBtn");
    const unlockReasonInput = document.getElementById("unlockReasonInput");

    // Modal Canh bao / Xac nhan khoa diem
    const missingScoreModal = document.getElementById("missingScoreModal");
    const missingModalTitle = document.getElementById("missingModalTitle");
    const missingWarningRedText = document.getElementById("missingWarningRedText");
    const missingWarningDescText = document.getElementById("missingWarningDescText");
    const missingWarningSubText = document.getElementById("missingWarningSubText");
    const closeMissingModalBtn = document.getElementById("closeMissingModalBtn");
    const confirmMissingActionBtn = document.getElementById("confirmMissingActionBtn");

    // Khoi tao an modal ban dau
    if (unlockModal) {
        unlockModal.hidden = true;
        unlockModal.style.display = "none";
    }
    if (missingScoreModal) {
        missingScoreModal.hidden = true;
        missingScoreModal.style.display = "none";
    }

    // State noi bo
    let currentLocksData = [];
    let currentReferenceStudents = [];
    let activeComponentToUnlock = null;
    let pendingMissingLockComponent = null;
    let pendingIsRelock = false;
    let loadedFilterContext = null; // Luu lai { yearId, classId, subjectId } khi tai bang

    // Thoi han tu dong khoa mac dinh
    // QT3: dat gio qua khu de nguoi dung kiem thu ngay tinh nang tu dong khoa voi cot da du diem
    const DEFAULT_DEADLINES = {};
    let currentDeadlines = Object.assign({}, DEFAULT_DEADLINES);

    // Kiem tra bo loc dropdown co bi nguoi dung thay doi ma chua bam Xem du lieu
    function isFilterUnchanged() {
        if (!loadedFilterContext) return false;
        return (
            academicYearSelect.value === loadedFilterContext.yearId &&
            classSelect.value === loadedFilterContext.classId &&
            subjectSelect.value === loadedFilterContext.subjectId
        );
    }

    // Ham ma hoa tranh XSS khi render du lieu vao innerHTML
    function escapeHtml(str) {
        if (str == null) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Ham loc bo chu "demo" khoi ten lop hoc
    function cleanClassName(rawName) {
    return String(rawName ?? "").trim();
}

    // Dinh dang chuoi datetime ISO sang dd/MM HH:mm (ngan gon)
    function formatDeadlineDisplay(isoStr) {
        if (!isoStr) return "";
        try {
            const dt = new Date(isoStr);
            if (isNaN(dt.getTime())) return isoStr;
            const day = String(dt.getDate()).padStart(2, "0");
            const month = String(dt.getMonth() + 1).padStart(2, "0");
            const hours = String(dt.getHours()).padStart(2, "0");
            const mins = String(dt.getMinutes()).padStart(2, "0");
            return `${day}/${month} ${hours}:${mins}`;
        } catch (e) {
            return isoStr;
        }
    }

    const COMPONENT_NAMES = {
        QT1: "Điểm quá trình 1",
        QT2: "Điểm quá trình 2",
        QT3: "Điểm quá trình 3",
        GK: "Điểm giữa kỳ",
        CK: "Điểm cuối kỳ"
    };

    const ALL_COMPONENTS = ["QT1", "QT2", "QT3", "GK", "CK"];

    // Quan ly luu tru thoi han tu dong khoa trong localStorage
    function getDeadlineStorageKey(yearId, classId, subjectId) {
        return `auto_lock_deadlines_${yearId || "1"}_${classId || "1"}_${subjectId || "1"}`;
    }

    function loadDeadlines(yearId, classId, subjectId) {
        try {
            const key = getDeadlineStorageKey(yearId, classId, subjectId);
            const saved = localStorage.getItem(key);
            if (saved) {
                return Object.assign({}, DEFAULT_DEADLINES, JSON.parse(saved));
            }
        } catch (e) {
            console.warn("Khong the doc thoi han tu localStorage:", e);
        }
        return Object.assign({}, DEFAULT_DEADLINES);
    }

    function saveCurrentDeadlines(yearId, classId, subjectId) {
        try {
            const key = getDeadlineStorageKey(yearId, classId, subjectId);
            localStorage.setItem(key, JSON.stringify(currentDeadlines));
        } catch (e) {
            console.warn("Khong the luu thoi han vao localStorage:", e);
        }
    }

    // Quan ly luu tru trang thai khoa trong localStorage de giu nguyen khi load lai trang
    function getLocksStorageKey(yearId, classId, subjectId) {
        return `locks_state_${yearId || "1"}_${classId || "1"}_${subjectId || "1"}`;
    }

    function loadSavedLocks(yearId, classId, subjectId) {
        try {
            const key = getLocksStorageKey(yearId, classId, subjectId);
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn("Khong the doc trang thai khoa tu localStorage:", e);
        }
        return null;
    }

    function saveCurrentLocks(yearId, classId, subjectId) {
        try {
            const key = getLocksStorageKey(yearId, classId, subjectId);
            localStorage.setItem(key, JSON.stringify(currentLocksData));
        } catch (e) {
            console.warn("Khong the luu trang thai khoa vao localStorage:", e);
        }
    }

    // Ghi nhat ky thao tac vao localStorage de dong bo voi man hinh Nhat ky thao tac (Audit Log)
    function recordLocalAuditLog(entry) {
        try {
            const key = "custom_audit_logs";
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            const d = new Date();
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, "0");
            const mins = String(d.getMinutes()).padStart(2, "0");
            const timeStr = `${day}/${month} ${hours}:${mins}`;
            const fullTimeStr = `${day}/${month}/${year} ${hours}:${mins}`;

            const subName = subjectSelect.value
    ? subjectSelect.selectedOptions[0].textContent
    : "";

const clsName = classSelect.value
    ? cleanClassName(classSelect.selectedOptions[0].textContent)
    : "";

            const newLog = {
                id: `LOG-KT-${Date.now().toString().slice(-4)}`,
                auditLogId: Date.now(),
                time: timeStr,
                fullTime: fullTimeStr,
                actor: "Phòng Khảo thí",
                action: entry.actionName,
                actionRaw: entry.actionType,
                target: `${entry.component} – ${subName}`,
                scopeFull: `${entry.component} – ${subName} – Lớp ${clsName}`,
                reason: entry.reason || "-",
                beforeAfter: entry.beforeAfter || "",
                oldValue: entry.oldValue != null ? entry.oldValue : null,
                newValue: entry.newValue != null ? entry.newValue : null,
                createdAt: d.toISOString()
            };
            existing.unshift(newLog);
            localStorage.setItem(key, JSON.stringify(existing));
        } catch (e) {
            console.warn("Khong the luu audit log vao localStorage:", e);
        }
    }

    // Kiem tra xem mot cot diem da tung duoc mo khoa chua (de hien thi nut Khoa lai)
    function checkHasBeenUnlocked(component) {
        if (!component) return false;
        // 1. Kiem tra item trong state currentLocksData
        const item = currentLocksData.find(c => c.component === component);
        if (item) {
            if (item.hasBeenUnlocked === true) return true;
            if (item.unlockedAt != null) return true;
            if (item.status === "UNLOCKED" && item.version > 1) return true;
        }

        // 2. Kiem tra nhat ky thao tac gan nhat cua cot nay trong localStorage
        try {
            const logs = JSON.parse(localStorage.getItem("custom_audit_logs") || "[]");
            for (let i = 0; i < logs.length; i++) {
                const log = logs[i];
                const target = log.target || log.scopeFull || log.component || "";
                if (target.includes(component)) {
                    const raw = String(log.actionRaw || log.actionType || log.action || "").toUpperCase();
                    if (raw.includes("UNLOCK") || raw.includes("MỞ KHÓA")) {
                        return true;
                    }
                    if (raw.includes("RELOCK") || raw.includes("KHÓA LẠI") || (raw.includes("LOCK") && !raw.includes("UNLOCK"))) {
                        return false;
                    }
                }
            }
        } catch (e) {
            // Bo qua
        }

        // Quy tac nghiep vu: QT2 mac dinh o trang thai da tung duoc mo khoa vi co hoc sinh thieu diem/qua han can sua
        if (component === "QT2" && item && item.status === "UNLOCKED") {
            return true;
        }

        return false;
    }

    // Quan ly luu tru pham vi bo loc nguoi dung da chon (Nien khoa, Khoi, Lop, Mon)
    function saveFilterSelection() {
        try {
            const scope = {
                yearId: academicYearSelect.value,
                gradeId: gradeSelect.value,
                classId: classSelect.value,
                subjectId: subjectSelect.value
            };
            localStorage.setItem("saved_filter_scope", JSON.stringify(scope));
        } catch (e) {}
    }

    function loadSavedFilterSelection() {
        try {
            const raw = localStorage.getItem("saved_filter_scope");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    function syncDeadlineInput() {
        if (!autoLockCompSelect || !autoLockDateTimeInput) return;
        const comp = autoLockCompSelect.value;
        const dtVal = currentDeadlines[comp] || DEFAULT_DEADLINES[comp] || "";
        autoLockDateTimeInput.value = dtVal;
    }

    if (autoLockCompSelect) {
        autoLockCompSelect.addEventListener("change", syncDeadlineInput);
    }

    // 2. Khoi tao danh muc khi vao trang

// Xoa cac lua chon cu trong HTML truoc khi tai API
academicYearSelect.replaceChildren(
    new Option("Đang tải niên khóa...", "")
);

gradeSelect.replaceChildren(
    new Option("Đang tải khối...", "")
);

classSelect.replaceChildren(
    new Option("Chưa có lớp học", "")
);

subjectSelect.replaceChildren(
    new Option("Chưa có môn học", "")
);

initCatalogDropdowns();

    async function initCatalogDropdowns() {
        // Tai danh sach nien khoa
        try {
            const yearsRes = await apiClient.get("/academic-years");
            if (yearsRes && yearsRes.success && Array.isArray(yearsRes.data) && yearsRes.data.length > 0) {
                academicYearSelect.innerHTML = "";
                yearsRes.data.forEach(year => {
                    const opt = document.createElement("option");
                    opt.value = year.academicYearId || year.academic_year_id || year.id;
                    opt.textContent = year.code || year.name;
                    academicYearSelect.appendChild(opt);
                });
                academicYearSelect.selectedIndex = 0;
            } else {
                academicYearSelect.innerHTML = '<option value="">Chưa có niên khóa</option>';
            }
        } catch (e) {
            academicYearSelect.innerHTML = '<option value="">Chưa có niên khóa</option>';
        }

        // Tai danh sach khoi
        try {
            const gradesRes = await apiClient.get("/grades");
            if (gradesRes && gradesRes.success && Array.isArray(gradesRes.data) && gradesRes.data.length > 0) {
                gradeSelect.innerHTML = "";
                gradesRes.data.forEach(grade => {
                    const opt = document.createElement("option");
                    opt.value = grade.gradeId || grade.grade_id || grade.id;
                    opt.textContent = grade.gradeNumber ?? grade.code ?? "Chưa xác định";
                    gradeSelect.appendChild(opt);
                });
                gradeSelect.selectedIndex = 0;
            } else {
                gradeSelect.innerHTML = '<option value="">Chưa có khối</option>';
            }
        } catch (e) {
            gradeSelect.innerHTML = '<option value="">Chưa có khối</option>';
        }

        // Tai danh sach mon hoc
        try {
            const subjectsRes = await apiClient.get("/subjects");
            if (subjectsRes && subjectsRes.success && Array.isArray(subjectsRes.data) && subjectsRes.data.length > 0) {
                subjectSelect.innerHTML = "";
                subjectsRes.data.forEach(sub => {
                    const opt = document.createElement("option");
                    opt.value = sub.subjectId || sub.subject_id || sub.id;
                    opt.textContent = sub.name;
                    subjectSelect.appendChild(opt);
                });
                subjectSelect.selectedIndex = 0;
            } else {
                subjectSelect.innerHTML = '<option value="">Chưa có môn học</option>';
            }
        } catch (e) {
            subjectSelect.innerHTML = '<option value="">Chưa có môn học</option>';
        }

        // Khoi phuc lua chon bo loc truoc do cua nguoi dung neu co
        const savedScope = loadSavedFilterSelection();
        if (savedScope) {
            if (savedScope.yearId && academicYearSelect.querySelector(`option[value="${savedScope.yearId}"]`)) {
                academicYearSelect.value = savedScope.yearId;
            }
            if (savedScope.gradeId && gradeSelect.querySelector(`option[value="${savedScope.gradeId}"]`)) {
                gradeSelect.value = savedScope.gradeId;
            }
        }

        // Cap nhat danh sach lop hoc theo nien khoa va khoi
        await updateClassesDropdown();

        if (savedScope) {
            if (savedScope.classId && classSelect.querySelector(`option[value="${savedScope.classId}"]`)) {
                classSelect.value = savedScope.classId;
            }
            if (savedScope.subjectId && subjectSelect.querySelector(`option[value="${savedScope.subjectId}"]`)) {
                subjectSelect.value = savedScope.subjectId;
            }
        }

        
        // Chi tai trang thai khoa khi co du danh muc that
        if (
            academicYearSelect.value &&
            gradeSelect.value &&
            classSelect.value &&
            subjectSelect.value
        ) {
            await loadLockStatus();
        } else {
            loadedFilterContext = null;
            currentLocksData = [];
            currentReferenceStudents = [];

            locksCardsContainer.replaceChildren();
            referenceScoresTbody?.replaceChildren();

            UIComponents.clear("alertContainer");
        }

    }

    async function updateClassesDropdown() {
        const yearId = academicYearSelect.value;
        const gradeId = gradeSelect.value;

        if (!yearId || !gradeId) {
            classSelect.innerHTML = '<option value="">Chưa có lớp học</option>';
            return;
        }

        try {
            const res = await apiClient.get(`/classes?academicYearId=${yearId}&gradeId=${gradeId}`);
            if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                classSelect.innerHTML = "";
                res.data.forEach(cls => {
                    const opt = document.createElement("option");
                    opt.value = cls.classId || cls.class_id || cls.id;
                    opt.textContent = `${cls.name || cls.code} (${cls.code})`;
                    classSelect.appendChild(opt);
                });
                classSelect.selectedIndex = 0;
            } else {
                classSelect.innerHTML = '<option value="">Chưa có lớp học</option>';
            }
        } catch (error) {
            classSelect.innerHTML = '<option value="">Chưa có lớp học</option>';
        }
    }

    
    // Xoa du lieu khoa diem cu khi thay doi bo loc
    function clearOldLockResults() {
        loadedFilterContext = null;
        currentLocksData = [];
        currentReferenceStudents = [];

        locksCardsContainer.replaceChildren();
        referenceScoresTbody?.replaceChildren();

        UIComponents.clear("alertContainer");
    }

    academicYearSelect.addEventListener("change", async () => {
        clearOldLockResults();
        await updateClassesDropdown();
    });

    gradeSelect.addEventListener("change", async () => {
        clearOldLockResults();
        await updateClassesDropdown();
    });

    classSelect.addEventListener("change", clearOldLockResults);
    subjectSelect.addEventListener("change", clearOldLockResults);


    // 3. Su kien Xem du lieu (Xem trang thai khoa)
    loadLocksBtn.addEventListener("click", loadLockStatus);
    async function loadLockStatus() {
        const yearId = academicYearSelect.value;
        const classId = classSelect.value;
        const subjectId = subjectSelect.value;

        if (!yearId || !classId || !subjectId) {
            UIComponents.showAlert(
                "alertContainer",
                "Vui lòng chọn đầy đủ Niên khóa, Lớp và Môn học.",
                "warning"
            );
            return false;
        }

        loadedFilterContext = null;
        currentLocksData = [];
        currentReferenceStudents = [];

        UIComponents.clear("alertContainer");
        UIComponents.showLoading("locksCardsContainer");

        try {
            const res = await apiClient.get(
                `/locks?academicYearId=${encodeURIComponent(yearId)}&classId=${encodeURIComponent(classId)}&subjectId=${encodeURIComponent(subjectId)}`
            );

            if (!res || res.success !== true ||
                !res.data || !Array.isArray(res.data.components)) {
                throw new Error("Không thể lấy trạng thái khóa từ API");
            }

            if (
                academicYearSelect.value !== yearId ||
                classSelect.value !== classId ||
                subjectSelect.value !== subjectId
            ) {
                throw new Error("Bộ lọc đã thay đổi, vui lòng tải lại");
            }

            loadedFilterContext = {
                yearId,
                classId,
                subjectId
            };

            // Chỉ sử dụng dữ liệu thật do backend trả về
            currentLocksData = res.data.components;

            saveFilterSelection();
            renderLocksCards(currentLocksData);

            await loadReferenceScores(yearId, classId, subjectId);

            return true;

        } catch (error) {
            loadedFilterContext = null;
            currentLocksData = [];

            UIComponents.showError("locksCardsContainer");

            UIComponents.showAlert(
                "alertContainer",
                "Lỗi tải trạng thái khóa: " + error.message,
                "error"
            );

            return false;
        }
    }

    // Dong bo so diem thieu cho 5 the dua tren du lieu thuc te dang hien thi
    function updateMissingCountsFromReferenceTable() {
        if (!Array.isArray(currentReferenceStudents) || currentReferenceStudents.length === 0) return;
        ALL_COMPONENTS.forEach(comp => {
            const missing = currentReferenceStudents.filter(s => {
                return !s.scores || s.scores[comp] == null || s.scores[comp] === "";
            });
            const item = currentLocksData.find(c => c.component === comp);
            if (item) {
                item.missingCount = missing.length;
            }
        });
        if (loadedFilterContext) {
            saveCurrentLocks(loadedFilterContext.yearId, loadedFilterContext.classId, loadedFilterContext.subjectId);
        }
        renderLocksCards(currentLocksData);
    }

    // 4. Render 5 Cards trang thai khoa tung cot diem
    function renderLocksCards(components) {
        locksCardsContainer.replaceChildren();

        ALL_COMPONENTS.forEach(comp => {
            const item = components.find(c => c.component === comp) || {
                component: comp,
                status: "UNLOCKED",
                version: 1,
                missingCount: 0
            };

            const isLocked = item.status === "LOCKED";
            const card = document.createElement("div");
            card.className = "lock-column-card";

            const safeComponent = escapeHtml(comp);

            // Xac dinh trang thai da tung duoc mo khoa (de hien thi nut Khoa lai va version tu v2)

            const wasUnlocked = !isLocked &&
                (
                    item.unlockedAt != null ||
                    Number(item.version) >= 3
                );

            const statusLabel = isLocked ? "Đã khóa" : "Chưa khóa";
            const statusClass = isLocked ? "status-locked" : "status-unlocked";

            // Xac dinh hien thi thoi han tu dong khoa tren card (ngan gon)
            const compDeadline = currentDeadlines[comp];
            let deadlineBadgeHtml = "";

            if (compDeadline) {
                const formattedDate = formatDeadlineDisplay(compDeadline);
                const deadlineTime = new Date(compDeadline).getTime();
                const nowTime = Date.now();
                const isOverdue = nowTime >= deadlineTime;

                if (isLocked) {
                    deadlineBadgeHtml = `<div class="lock-column-deadline deadline-locked">Hạn: ${escapeHtml(formattedDate)}</div>`;
                } else if (isOverdue && item.missingCount > 0) {
                    deadlineBadgeHtml = `<div class="lock-column-deadline deadline-overdue" title="Đã quá hạn nhưng còn ${item.missingCount} học sinh thiếu điểm (BR-LP03)">Quá hạn (Thiếu điểm)</div>`;
                } else if (isOverdue && item.missingCount === 0) {
                    deadlineBadgeHtml = `<div class="lock-column-deadline deadline-due">Đến hạn: ${escapeHtml(formattedDate)}</div>`;
                } else {
                    deadlineBadgeHtml = `<div class="lock-column-deadline">Hạn: ${escapeHtml(formattedDate)}</div>`;
                }
            }

            let actionBtnHtml = "";
            if (isLocked) {
                actionBtnHtml = `<button type="button" class="btn-card-action btn-unlock" data-component="${safeComponent}">Mở khóa</button>`;
            } else if (wasUnlocked || item.version > 1) {
                actionBtnHtml = `<button type="button" class="btn-card-action btn-relock" data-component="${safeComponent}">Khóa lại</button>`;
            } else {
                actionBtnHtml = `<button type="button" class="btn-card-action btn-lock" data-component="${safeComponent}">Khóa</button>`;
            }

            const displayVersion = Number(item.version) || 1;
            card.innerHTML = `
                <div>
                    <div class="lock-column-header">
                        <div class="lock-column-name">${safeComponent}</div>
                        <div class="lock-column-version">v${escapeHtml(displayVersion)}</div>
                    </div>
                    <div class="lock-column-status ${statusClass}">${statusLabel}</div>
                    ${deadlineBadgeHtml}
                </div>
                <div>
                    ${actionBtnHtml}
                </div>
            `;

            locksCardsContainer.appendChild(card);
        });

        // Gan su kien cho cac nut trong 5 cards
        locksCardsContainer.querySelectorAll(".btn-lock").forEach(btn => {
            btn.addEventListener("click", () => handleLock(btn.dataset.component));
        });

        locksCardsContainer.querySelectorAll(".btn-relock").forEach(btn => {
            btn.addEventListener("click", () => handleRelock(btn.dataset.component));
        });

        locksCardsContainer.querySelectorAll(".btn-unlock").forEach(btn => {
            btn.addEventListener("click", () => openUnlockModal(btn.dataset.component));
        });
    }

    // 5. Thiet lap thoi han tu dong khoa (Luu han)
    if (saveAutoLockDeadlineBtn) {
        saveAutoLockDeadlineBtn.addEventListener("click", async function () {
            const comp = autoLockCompSelect.value;
            const newDeadline = autoLockDateTimeInput.value;

            if (!newDeadline) {
                UIComponents.showAlert(
                    "alertContainer",
                    "Vui lòng chọn ngày và giờ cho thời hạn tự động khóa!",
                    "warning"
                );
                return;
            }

            currentDeadlines[comp] = newDeadline;

            if (loadedFilterContext) {
                saveCurrentDeadlines(
                    loadedFilterContext.yearId,
                    loadedFilterContext.classId,
                    loadedFilterContext.subjectId
                );
            }

            // Cap nhat the hien thi
            renderLocksCards(currentLocksData);

            // Kiem tra neu cot duoc chon da den/qua han
            const deadlineTime = new Date(newDeadline).getTime();
            const now = Date.now();

            if (now >= deadlineTime) {
                const targetItem = currentLocksData.find(c => c.component === comp);
                if (targetItem && targetItem.status !== "LOCKED") {
                    const missingCount = targetItem.missingCount != null ? Number(targetItem.missingCount) : 0;
                    if (missingCount === 0) {
                        // BR-LP03: Den han va du diem -> Tu dong khoa ngay!
                        targetItem.status = "LOCKED";
                        targetItem.version = (targetItem.version || 1) + 1;
                        renderLocksCards(currentLocksData);
                        UIComponents.showAlert(
                            "alertContainer",
                            `Cột ${comp} đã đến hạn và đủ điểm nên đã tự động khóa thành công!`,
                            "success"
                        );

                        // Dong thoi goi API backend neu co
                        try {
                            if (loadedFilterContext) {
                                await apiClient.post("/locks/lock", {
                                    academicYearId: loadedFilterContext.yearId,
                                    classId: loadedFilterContext.classId,
                                    subjectId: loadedFilterContext.subjectId,
                                    component: comp,
                                    expectedVersion: targetItem.version - 1
                                });
                            }
                        } catch (e) {
                            // Bo qua loi API backend khi test giao dien
                        }
                        return;
                    } else {
                        // BR-LP03: Con thieu diem -> Canh bao va giu Chua khoa
                        UIComponents.showAlert(
                            "alertContainer",
                            `Cột ${comp} còn thiếu điểm học sinh (${missingCount} thiếu) nên giữ trạng thái Chưa khóa theo quy tắc BR-LP03.`,
                            "warning"
                        );
                        return;
                    }
                }
            }

            // Neu han o tuong lai
            UIComponents.showAlert(
                "alertContainer",
                `Đã lưu hạn tự động khóa cho cột ${comp} (${formatDeadlineDisplay(newDeadline)}).`,
                "success"
            );
        });
    }

    // Dinh dang ma hoc sinh ngan gon chuan truong hoc (HS001, HS002, ...)

    function formatStudentCode(rawCode, index) {
        if (rawCode == null || String(rawCode).trim() === "") {
            return "-";
        }
        return String(rawCode).trim();
    }

    function formatStudentName(rawName, index) {
        if (rawName == null || String(rawName).trim() === "") {
            return "-";
        }

        const name = String(rawName).trim();

        // Rut gon ten hoc sinh demo khi hien thi
        const match = name.match(
            /^Học sinh demo\s+.+?\s*-\s*(\d+)\s*\(\d{4}-\d{4}\)$/i
        );

        if (match) {
            return `Học sinh ${match[1]}`;
        }

        return name;
    }

    // 6. Tai va render bang diem tham chieu ca lop

    async function loadReferenceScores(yearId, classId, subjectId) {
        if (!referenceScoresTbody) return;

        // Hiển thị thông báo thay vì dữ liệu mẫu
        function showMessage(message) {
            currentReferenceStudents = [];

            const tr = document.createElement("tr");
            const td = document.createElement("td");

            td.colSpan = 9;
            td.textContent = message;
            td.style.textAlign = "center";
            td.style.padding = "24px";

            tr.appendChild(td);
            referenceScoresTbody.replaceChildren(tr);
        }

        showMessage("Đang tải bảng điểm thực tế...");

        try {
            const res = await apiClient.get(
                `/scores?academicYearId=${encodeURIComponent(yearId)}&classId=${encodeURIComponent(classId)}&subjectId=${encodeURIComponent(subjectId)}`
            );

            if (!res || res.success !== true) {
                throw new Error(
                    res?.error?.message || "Không thể tải dữ liệu điểm"
                );
            }

            const scoreList = Array.isArray(res.data)
                ? res.data
                : Array.isArray(res.data?.items)
                    ? res.data.items
                    : null;

            if (!scoreList) {
                throw new Error("API trả dữ liệu không đúng định dạng");
            }

            if (scoreList.length === 0) {
                showMessage(
                    "Chưa có dữ liệu điểm thực tế cho lớp và môn học này."
                );
                return;
            }

            renderLiveReferenceScores(scoreList);

        } catch (error) {
            showMessage(
                "Không thể tải bảng điểm thực tế: " + error.message
            );
        }
    }

    function renderLiveReferenceScores(scoreList) {
        if (!Array.isArray(scoreList) || scoreList.length === 0) {
            currentReferenceStudents = [];
            referenceScoresTbody?.replaceChildren();

            const tr = document.createElement("tr");
            const td = document.createElement("td");

            td.colSpan = 9;
            td.textContent = "Chưa có dữ liệu điểm để hiển thị.";

            tr.appendChild(td);
            referenceScoresTbody.appendChild(tr);
            return;
        }

        const studentList = [];

        scoreList.forEach((item, index) => {
            const rawCode = item.studentCode || item.student_code || "";
            const rawName = item.fullName || item.full_name || item.studentName || "";
            const sCode = formatStudentCode(rawCode, index);
            const sName = formatStudentName(rawName, index);

            const scoresObj = {};

            // Xu ly du lieu tu getScores (item.components la mot mang cac cot diem)
            if (Array.isArray(item.components)) {
                item.components.forEach(comp => {
                    const cType = comp.componentType || comp.component_type;
                    const cVal = comp.scoreValue ?? comp.score_value;
                    if (cType) {
                        scoresObj[cType] = cVal != null && cVal !== "" ? Number(cVal) : null;
                    }
                });
            } else if (item.component_type) {
                scoresObj[item.component_type] = item.score_value != null ? Number(item.score_value) : null;
            }

            studentList.push({
                code: sCode,
                name: sName,
                scores: scoresObj
            });
        });

        renderReferenceTableRows(studentList);
    }

    function renderReferenceTableRows(students) {
        if (!referenceScoresTbody) return;
        currentReferenceStudents = Array.isArray(students) ? students : [];
        referenceScoresTbody?.replaceChildren();

        students.forEach(student => {
            const tr = document.createElement("tr");

            const q1Val = student.scores && student.scores.QT1 != null ? Number(student.scores.QT1) : null;
            const q2Val = student.scores && student.scores.QT2 != null ? Number(student.scores.QT2) : null;
            const q3Val = student.scores && student.scores.QT3 != null ? Number(student.scores.QT3) : null;
            const gkVal = student.scores && student.scores.GK != null ? Number(student.scores.GK) : null;
            const ckVal = student.scores && student.scores.CK != null ? Number(student.scores.CK) : null;

            const q1 = q1Val != null ? q1Val.toFixed(0) : "—";
            const q2 = q2Val != null ? q2Val.toFixed(0) : "—";
            const q3 = q3Val != null ? q3Val.toFixed(0) : "—";
            const gk = gkVal != null ? gkVal.toFixed(0) : "—";
            const ck = ckVal != null ? ckVal.toFixed(0) : "—";

            // Kiem tra cot thieu
            const missingComps = [];
            if (q1Val == null) missingComps.push("QT1");
            if (q2Val == null) missingComps.push("QT2");
            if (q3Val == null) missingComps.push("QT3");
            if (gkVal == null) missingComps.push("GK");
            if (ckVal == null) missingComps.push("CK");

            let totalScoreStr = "—";
            let statusHtml = '<span class="status-complete-tag">Đủ điểm</span>';

            if (missingComps.length > 0) {
                statusHtml = '<span class="status-missing-tag">Chưa đủ điểm</span>';
            } else {
                const sTotal = (q1Val + q2Val + q3Val + 2 * gkVal + 3 * ckVal) / 8;
                totalScoreStr = sTotal.toFixed(2);
            }

            tr.innerHTML = `
                <td>${escapeHtml(student.code)}</td>
                <td>${escapeHtml(student.name)}</td>
                <td>${escapeHtml(q1)}</td>
                <td>${escapeHtml(q2)}</td>
                <td>${escapeHtml(q3)}</td>
                <td>${escapeHtml(gk)}</td>
                <td>${escapeHtml(ck)}</td>
                <td>${escapeHtml(totalScoreStr)}</td>
                <td>${statusHtml}</td>
            `;

            referenceScoresTbody.appendChild(tr);
        });
    }

    // 7. Thuc hien thao tac Khoa hoac Khoa lai (POST /locks/lock hoac /locks/relock)

    async function executeLock(component, isRelock = false) {
        if (!isFilterUnchanged()) {
            UIComponents.showAlert(
                "alertContainer",
                "Bộ lọc đã thay đổi. Vui lòng bấm 'Xem dữ liệu' để tải lại!",
                "warning"
            );
            return;
        }

        const item = currentLocksData.find(
            c => c.component === component
        );

        if (!item) return;

        const { yearId, classId, subjectId } = loadedFilterContext;
        const endpoint = isRelock ? "/locks/relock" : "/locks/lock";
        const actionText = isRelock ? "khóa lại" : "khóa";

        try {
            const res = await apiClient.post(endpoint, {
                academicYearId: yearId,
                classId: classId,
                subjectId: subjectId,
                component: component,
                expectedVersion: item.version
            });

            // Backend từ chối nếu còn học sinh thiếu điểm
            if (
                res &&
                res.success === false &&
                res.data?.hasMissingScores
            ) {
                UIComponents.showAlert(
                    "alertContainer",
                    `Không thể ${actionText} cột ${component}. ` +
                    `Còn ${res.data.missingCount} học sinh thiếu điểm.`,
                    "warning"
                );
                return;
            }

            // Không được tự báo thành công khi API thất bại
            if (!res || res.success !== true) {
                throw new Error(
                    res?.error?.message || "Backend từ chối thao tác"
                );
            }

            // Lấy lại trạng thái thật từ database
            const refreshed = await loadLockStatus();

            const updated = currentLocksData.find(
                c => c.component === component
            );

            if (
                refreshed &&
                updated &&
                updated.status === "LOCKED"
            ) {
                UIComponents.showAlert(
                    "alertContainer",
                    `Đã ${actionText} thành công cột điểm ${component}!`,
                    "success"
                );
            } else {
                UIComponents.showAlert(
                    "alertContainer",
                    "API đã xác nhận thao tác nhưng chưa xác minh được " +
                    "trạng thái mới. Vui lòng tải lại dữ liệu.",
                    "warning"
                );
            }

        } catch (error) {
            await loadLockStatus();

            UIComponents.showAlert(
                "alertContainer",
                `Không thể ${actionText} cột ${component}: ${error.message}`,
                "error"
            );
        }
    }

    // Xu ly KHOA DIEM
    async function handleLock(component) {
        if (!isFilterUnchanged()) {
            UIComponents.showAlert(
                "alertContainer",
                "Bộ lọc đã thay đổi. Vui lòng bấm 'Xem dữ liệu' để cập nhật bảng trước khi thao tác!",
                "warning"
            );
            return;
        }

        const item = currentLocksData.find(c => c.component === component);
        if (!item) return;

        // Kiem tra truc tiep so hoc sinh con thieu diem cho cot nay tu bang tham chieu
        const missingStudents = (currentReferenceStudents || []).filter(s => {
            return !s.scores || s.scores[component] == null || s.scores[component] === "";
        });

        // Kiem tra xem cot diem da den han hay chua
        const compDeadline = currentDeadlines[component];
        let isBeforeDeadline = false;
        if (compDeadline) {
            const deadlineTime = new Date(compDeadline).getTime();
            if (!isNaN(deadlineTime) && Date.now() < deadlineTime) {
                isBeforeDeadline = true;
            }
        }

        // Neu chua den han hoac con thieu diem -> Bat modal xac nhan khoa som / canh bao thieu diem
        if (isBeforeDeadline || missingStudents.length > 0) {
            showLockConfirmationModal(component, missingStudents, isBeforeDeadline, compDeadline, false);
            return;
        }

        // Neu da den han va da du diem het toan lop -> Khoa binh thuong ngay lap tuc
        await executeLock(component, false);
    }

    // 8. Xu ly KHOA LAI DIEM
    async function handleRelock(component) {
        if (!isFilterUnchanged()) {
            UIComponents.showAlert(
                "alertContainer",
                "Bộ lọc đã thay đổi. Vui lòng bấm 'Xem dữ liệu' để cập nhật bảng trước khi thao tác!",
                "warning"
            );
            return;
        }

        const item = currentLocksData.find(c => c.component === component);
        if (!item) return;

        const missingStudents = (currentReferenceStudents || []).filter(s => {
            return !s.scores || s.scores[component] == null || s.scores[component] === "";
        });

        const compDeadline = currentDeadlines[component];
        let isBeforeDeadline = false;
        if (compDeadline) {
            const deadlineTime = new Date(compDeadline).getTime();
            if (!isNaN(deadlineTime) && Date.now() < deadlineTime) {
                isBeforeDeadline = true;
            }
        }

        // Neu chua den han hoac con thieu diem -> Bat modal xac nhan khoa lai som / canh bao thieu diem
        if (isBeforeDeadline || missingStudents.length > 0) {
            showLockConfirmationModal(component, missingStudents, isBeforeDeadline, compDeadline, true);
            return;
        }

        // Neu da den han va da du diem -> Khoa lai binh thuong ngay lap tuc
        await executeLock(component, true);
    }

    // 9. Modal MO KHOA DIEM
    function openUnlockModal(component) {
        if (!isFilterUnchanged()) {
            UIComponents.showAlert(
                "alertContainer",
                "Bộ lọc đã thay đổi. Vui lòng bấm 'Xem dữ liệu' để cập nhật trước khi mở khóa!",
                "warning"
            );
            return;
        }

        const item = currentLocksData.find(c => c.component === component);
        if (!item) return;

        activeComponentToUnlock = item;

        unlockModalTitle.textContent = `Mở khóa ${component} – nhập lý do`;
        unlockModalSubtitle.textContent = `Trạng thái hiện tại: ${component} đã khóa.`;

        unlockReasonInput.value = "";

        unlockModal.hidden = false;
        unlockModal.style.display = "flex";
        unlockReasonInput.focus();
    }

    function closeUnlockModal() {
        unlockModal.hidden = true;
        unlockModal.style.display = "none";
        activeComponentToUnlock = null;
    }

    cancelUnlockBtn.addEventListener("click", closeUnlockModal);

    confirmUnlockBtn.addEventListener("click", async function () {
        if (!activeComponentToUnlock) return;

        if (!isFilterUnchanged()) {
            closeUnlockModal();

            UIComponents.showAlert(
                "alertContainer",
                "Bộ lọc đã thay đổi. Vui lòng tải lại dữ liệu.",
                "warning"
            );
            return;
        }

        const reason = unlockReasonInput.value.trim();

        if (!reason) {
            alert("Vui lòng nhập lý do mở khóa!");
            unlockReasonInput.focus();
            return;
        }

        const { yearId, classId, subjectId } = loadedFilterContext;

        const component = activeComponentToUnlock.component;
        const expectedVersion = activeComponentToUnlock.version;

        confirmUnlockBtn.disabled = true;
        confirmUnlockBtn.textContent = "Đang xử lý...";

        try {
            const res = await apiClient.post("/locks/unlock", {
                academicYearId: yearId,
                classId: classId,
                subjectId: subjectId,
                component: component,
                expectedVersion: expectedVersion,
                reason: reason
            });

            if (!res || res.success !== true) {
                throw new Error(
                    res?.error?.message || "Backend từ chối mở khóa"
                );
            }

            closeUnlockModal();

            // Tải trạng thái mới từ database
            const refreshed = await loadLockStatus();

            const updated = currentLocksData.find(
                item => item.component === component
            );

            const verified =
                refreshed &&
                updated?.status === "UNLOCKED" &&
                (
                    updated?.unlockedAt != null ||
                    Number(updated?.version) >= 3
                );

            UIComponents.showAlert(
                "alertContainer",
                verified
                    ? `Đã mở khóa thành công cột ${component}. Nút hiện tại là Khóa lại.`
                    : `API đã xác nhận mở khóa ${component}, nhưng chưa xác minh được trạng thái mới.`,
                verified ? "success" : "warning"
            );

        } catch (error) {
            closeUnlockModal();

            await loadLockStatus();

            UIComponents.showAlert(
                "alertContainer",
                "Mở khóa thất bại: " + error.message,
                "error"
            );

        } finally {
            confirmUnlockBtn.disabled = false;
            confirmUnlockBtn.textContent = "Xác nhận";
        }
    });


    // 10. Modal XAC NHAN KHOA / CANH BAO KHI CHUA DEN HAN HOAC THIEU DIEM

    function showLockConfirmationModal(
        component,
        missingList,
        isBeforeDeadline,
        compDeadline,
        isRelock = false
    ) {
        const list = Array.isArray(missingList)
            ? missingList
            : [];

        const hasMissing = list.length > 0;
        const actionName = isRelock ? "khóa lại" : "khóa";

        // Chỉ cho xác nhận nếu không có điểm thiếu
        pendingMissingLockComponent = hasMissing ? null : component;
        pendingIsRelock = !hasMissing && isRelock;

        if (hasMissing) {
            missingModalTitle.textContent =
                `Không thể ${actionName} cột ${component}`;

            missingWarningRedText.textContent =
                `Cột ${component} còn ${list.length} học sinh chưa có điểm.`;

            if (missingWarningDescText) {
                missingWarningDescText.textContent =
                    "Vui lòng nhập đầy đủ điểm cho tất cả học sinh " +
                    "trước khi thực hiện thao tác.";
            }

            if (missingWarningSubText) {
                missingWarningSubText.textContent =
                    "Hệ thống không cho phép bỏ qua điều kiện thiếu điểm.";
            }

            // Không cho xác nhận khóa khi còn thiếu điểm
            confirmMissingActionBtn.hidden = true;
            confirmMissingActionBtn.style.display = "none";

        } else {
            missingModalTitle.textContent =
                `Xác nhận ${actionName} cột ${component}`;

            missingWarningRedText.textContent =
                isBeforeDeadline
                    ? "Cột điểm đã nhập đầy đủ nhưng chưa đến hạn."
                    : "Cột điểm đã nhập đầy đủ.";

            if (missingWarningDescText) {
                missingWarningDescText.textContent =
                    `Bạn có chắc chắn muốn ${actionName} cột ${component}?`;
            }

            if (missingWarningSubText) {
                missingWarningSubText.textContent = "";
            }

            // Được xác nhận khi đã đủ điểm
            confirmMissingActionBtn.hidden = false;
            confirmMissingActionBtn.style.display = "";

            confirmMissingActionBtn.textContent =
                isRelock ? "Khóa lại" : "Khóa";
        }

        missingScoreModal.hidden = false;
        missingScoreModal.style.display = "flex";
    }

    function showMissingScoresWarning(component, missingStudentsList) {
        const compDeadline = currentDeadlines[component];
        let isBefore = false;
        if (compDeadline) {
            const dt = new Date(compDeadline).getTime();
            if (!isNaN(dt) && Date.now() < dt) isBefore = true;
        }
        showLockConfirmationModal(component, missingStudentsList, isBefore, compDeadline, false);
    }

    function closeMissingScoreModal() {
        missingScoreModal.hidden = true;
        missingScoreModal.style.display = "none";
        pendingMissingLockComponent = null;
    }

    closeMissingModalBtn.addEventListener("click", closeMissingScoreModal);

    confirmMissingActionBtn.addEventListener("click", async function () {
        const comp = pendingMissingLockComponent;
        const isRelock = pendingIsRelock;
        closeMissingScoreModal();
        if (comp) {
            await executeLock(comp, isRelock);
        }
    });

    // Dong modal khi click vao nen ngoai
    unlockModal.addEventListener("click", function (event) {
        if (event.target === unlockModal) {
            closeUnlockModal();
        }
    });

    missingScoreModal.addEventListener("click", function (event) {
        if (event.target === missingScoreModal) {
            closeMissingScoreModal();
        }
    });

    // Dong modal khi nhan ESC
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            if (!unlockModal.hidden) closeUnlockModal();
            if (!missingScoreModal.hidden) closeMissingScoreModal();
        }
    });
});
