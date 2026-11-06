"use strict";

// Quan ly khoa va mo khoa diem
// Xu ly kiem tra trang thai 5 cot diem, mo khoa co ly do va khoa lai

document.addEventListener("DOMContentLoaded", function () {
    // 1. Cac phan tu DOM
    const academicYearSelect = document.getElementById("academicYearSelect");
    const gradeSelect = document.getElementById("gradeSelect");
    const classSelect = document.getElementById("classSelect");
    const subjectSelect = document.getElementById("subjectSelect");
    const loadLocksBtn = document.getElementById("loadLocksBtn");

    const alertContainer = document.getElementById("alertContainer");
    const locksTableContainer = document.getElementById("locksTableContainer");
    const selectedScopeLabel = document.getElementById("selectedScopeLabel");

    // Modal Mo khoa
    const unlockModal = document.getElementById("unlockModal");
    const closeUnlockModalBtn = document.getElementById("closeUnlockModalBtn");
    const cancelUnlockBtn = document.getElementById("cancelUnlockBtn");
    const confirmUnlockBtn = document.getElementById("confirmUnlockBtn");
    const modalComponentLabel = document.getElementById("modalComponentLabel");
    const modalScopeLabel = document.getElementById("modalScopeLabel");
    const modalVersionLabel = document.getElementById("modalVersionLabel");
    const unlockReasonInput = document.getElementById("unlockReasonInput");

    // Modal Tu choi khi thieu diem
    const missingScoreModal = document.getElementById("missingScoreModal");
    const closeMissingModalBtn = document.getElementById("closeMissingModalBtn");
    const confirmMissingCloseBtn = document.getElementById("confirmMissingCloseBtn");
    const missingComponentLabel = document.getElementById("missingComponentLabel");
    const missingCountNumber = document.getElementById("missingCountNumber");
    const missingScoreMessage = document.getElementById("missingScoreMessage");

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
    let activeComponentToUnlock = null;

    const COMPONENT_NAMES = {
        QT1: "Điểm quá trình 1",
        QT2: "Điểm quá trình 2",
        QT3: "Điểm quá trình 3",
        GK: "Điểm giữa kỳ",
        CK: "Điểm cuối kỳ"
    };

    // 2. Khoi tao danh muc khi vao trang
    initCatalogDropdowns();

    async function initCatalogDropdowns() {
        try {
            // Tai danh sach nien khoa
            const yearsRes = await apiClient.get("/academic-years");
            if (yearsRes && yearsRes.success && Array.isArray(yearsRes.data)) {
                academicYearSelect.innerHTML = '<option value="">-- Chọn niên khóa --</option>';
                yearsRes.data.forEach(year => {
                    const opt = document.createElement("option");
                    opt.value = year.academicYearId || year.academic_year_id || year.id;
                    opt.textContent = year.code || year.name;
                    academicYearSelect.appendChild(opt);
                });
                if (yearsRes.data.length > 0) {
                    academicYearSelect.selectedIndex = 1; // Mac dinh chon nam dau tien
                }
            }

            // Tai danh sach khoi
            const gradesRes = await apiClient.get("/grades");
            if (gradesRes && gradesRes.success && Array.isArray(gradesRes.data)) {
                gradeSelect.innerHTML = '<option value="">-- Chọn khối --</option>';
                gradesRes.data.forEach(grade => {
                    const opt = document.createElement("option");
                    opt.value = grade.gradeId || grade.grade_id || grade.id;
                    opt.textContent = "Khối " + (grade.gradeNumber || grade.code || grade.name);
                    gradeSelect.appendChild(opt);
                });
                if (gradesRes.data.length > 0) {
                    gradeSelect.selectedIndex = 1;
                }
            }

            // Tai danh sach mon hoc
            const subjectsRes = await apiClient.get("/subjects");
            if (subjectsRes && subjectsRes.success && Array.isArray(subjectsRes.data)) {
                subjectSelect.innerHTML = '<option value="">-- Chọn môn --</option>';
                subjectsRes.data.forEach(sub => {
                    const opt = document.createElement("option");
                    opt.value = sub.subjectId || sub.subject_id || sub.id;
                    opt.textContent = sub.name + " (" + sub.code + ")";
                    subjectSelect.appendChild(opt);
                });
                if (subjectsRes.data.length > 0) {
                    subjectSelect.selectedIndex = 1;
                }
            }

            // Cap nhat danh sach lop hoc theo nien khoa va khoi
            await updateClassesDropdown();

        } catch (error) {
            UIComponents.showAlert(
                "alertContainer",
                "Không thể tải danh mục dữ liệu: " + error.message,
                "error"
            );
        }
    }

    async function updateClassesDropdown() {
        const yearId = academicYearSelect.value;
        const gradeId = gradeSelect.value;

        if (!yearId || !gradeId) {
            classSelect.innerHTML = '<option value="">-- Chọn khối trước --</option>';
            return;
        }

        try {
            const res = await apiClient.get(`/classes?academicYearId=${yearId}&gradeId=${gradeId}`);
            if (res && res.success && Array.isArray(res.data)) {
                classSelect.innerHTML = '<option value="">-- Chọn lớp --</option>';
                res.data.forEach(cls => {
                    const opt = document.createElement("option");
                    opt.value = cls.classId || cls.class_id || cls.id;
                    opt.textContent = cls.name || cls.code;
                    classSelect.appendChild(opt);
                });
                if (res.data.length > 0) {
                    classSelect.selectedIndex = 1;
                }
            }
        } catch (error) {
            classSelect.innerHTML = '<option value="">-- Lỗi tải lớp --</option>';
        }
    }

    academicYearSelect.addEventListener("change", updateClassesDropdown);
    gradeSelect.addEventListener("change", updateClassesDropdown);

    // 3. Tai trang thai khoa 5 cot diem
    loadLocksBtn.addEventListener("click", loadLockStatus);

    async function loadLockStatus() {
        const yearId = academicYearSelect.value;
        const classId = classSelect.value;
        const subjectId = subjectSelect.value;

        if (!yearId || !classId || !subjectId) {
            UIComponents.showAlert(
                "alertContainer",
                "Vui lòng chọn đầy đủ Niên khóa, Lớp và Môn học để xem trạng thái khóa.",
                "warning"
            );
            return;
        }

        UIComponents.clear("alertContainer");
        UIComponents.showLoading("locksTableContainer");

        const yearText = academicYearSelect.options[academicYearSelect.selectedIndex].text;
        const classText = classSelect.options[classSelect.selectedIndex].text;
        const subjectText = subjectSelect.options[subjectSelect.selectedIndex].text;
        selectedScopeLabel.textContent = `${yearText} | ${classText} | ${subjectText}`;

        try {
            const res = await apiClient.get(
                `/locks?academicYearId=${yearId}&classId=${classId}&subjectId=${subjectId}`
            );

            if (res && res.success && res.data && Array.isArray(res.data.components)) {
                currentLocksData = res.data.components;
                renderLocksTable(currentLocksData);
            } else {
                UIComponents.showEmpty("locksTableContainer");
            }
        } catch (error) {
            UIComponents.showAlert(
                "alertContainer",
                "Lỗi tải trạng thái khóa: " + error.message,
                "error"
            );
            UIComponents.showError("locksTableContainer");
        }
    }

    // 4. Render bang 5 cot diem theo chuan Figma
    function renderLocksTable(components) {
        if (!components || components.length === 0) {
            UIComponents.showEmpty("locksTableContainer");
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";

        const table = document.createElement("table");
        table.className = "data-table";

        table.innerHTML = `
            <thead>
                <tr>
                    <th style="width: 80px;">Mã cột</th>
                    <th>Tên thành phần điểm</th>
                    <th style="width: 140px;">Trạng thái</th>
                    <th style="width: 180px;">Số điểm thiếu</th>
                    <th style="width: 90px;">Phiên bản</th>
                    <th>Thông tin thao tác</th>
                    <th style="width: 130px; text-align: center;">Hành động</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector("tbody");

        components.forEach(item => {
            const tr = document.createElement("tr");

            const isLocked = item.status === "LOCKED";
            const missingCount = Number(item.missingCount || 0);
            const componentFullName = COMPONENT_NAMES[item.component] || item.component;

            // Huy hieu trang thai
            const statusBadge = isLocked
                ? `<span class="badge-status status-locked">ĐÃ KHÓA</span>`
                : `<span class="badge-status status-unlocked">ĐANG MỞ</span>`;

            // Chi bao diem thieu
            const missingHtml = missingCount > 0
                ? `<span class="missing-indicator has-missing">⚠️ Còn ${missingCount} học sinh</span>`
                : `<span class="missing-indicator no-missing">✓ Đầy đủ (0 thiếu)</span>`;

            // Thong tin nguoi thuc hien
            let auditInfo = "-";
            if (isLocked && item.lockedAt) {
                const dateStr = new Date(item.lockedAt).toLocaleString("vi-VN");
                const actorName = item.lockedByName || (item.lockedBy ? `Cán bộ #${item.lockedBy}` : "Khảo thí");
                auditInfo = `Khóa lúc ${dateStr} (${actorName})`;
            } else if (!isLocked && item.unlockedAt) {
                const dateStr = new Date(item.unlockedAt).toLocaleString("vi-VN");
                const actorName = item.unlockedByName || (item.unlockedBy ? `Cán bộ #${item.unlockedBy}` : "Khảo thí");
                auditInfo = `Mở lúc ${dateStr} (${actorName})`;
            }

            // Nut hanh dong
            let actionBtnHtml = "";
            if (isLocked) {
                actionBtnHtml = `<button type="button" class="btn-action-unlock" data-component="${item.component}">Mở khóa</button>`;
            } else if (item.version > 1) {
                actionBtnHtml = `<button type="button" class="btn-action-relock" data-component="${item.component}">Khóa lại</button>`;
            } else {
                actionBtnHtml = `<button type="button" class="btn-action-lock" data-component="${item.component}">Khóa điểm</button>`;
            }

            tr.innerHTML = `
                <td><strong>${item.component}</strong></td>
                <td>${componentFullName}</td>
                <td>${statusBadge}</td>
                <td>${missingHtml}</td>
                <td><span style="font-family: monospace;">v${item.version}</span></td>
                <td style="font-size: 13px; color: #475569;">${auditInfo}</td>
                <td style="text-align: center;">${actionBtnHtml}</td>
            `;

            tbody.appendChild(tr);
        });

        locksTableContainer.replaceChildren(table);

        // Gan su kien cho cac nut thao tac trong bang
        tbody.querySelectorAll(".btn-action-lock").forEach(btn => {
            btn.addEventListener("click", () => handleLock(btn.dataset.component));
        });

        tbody.querySelectorAll(".btn-action-relock").forEach(btn => {
            btn.addEventListener("click", () => handleRelock(btn.dataset.component));
        });

        tbody.querySelectorAll(".btn-action-unlock").forEach(btn => {
            btn.addEventListener("click", () => openUnlockModal(btn.dataset.component));
        });
    }

    // 5. Xu ly KHOA DIEM (POST /locks/lock)
    async function handleLock(component) {
        const item = currentLocksData.find(c => c.component === component);
        if (!item) return;

        const yearId = academicYearSelect.value;
        const classId = classSelect.value;
        const subjectId = subjectSelect.value;

        try {
            const res = await apiClient.post("/locks/lock", {
                academicYearId: yearId,
                classId: classId,
                subjectId: subjectId,
                component: component,
                expectedVersion: item.version
            });

            // Neu bi tu choi do thieu diem (missingCount > 0)
            if (res && res.success === false && res.data && res.data.hasMissingScores) {
                showMissingScoresWarning(
                    component,
                    res.data.missingCount,
                    res.data.message || "Còn học sinh chưa có điểm. Vui lòng nhập đầy đủ trước khi khóa."
                );
                return;
            }

            if (res && res.success) {
                UIComponents.showAlert(
                    "alertContainer",
                    `Đã khóa thành công cột điểm ${component} (${COMPONENT_NAMES[component] || ""})!`,
                    "success"
                );
                await loadLockStatus();
            }
        } catch (error) {
            UIComponents.showAlert(
                "alertContainer",
                "Không thể khóa cột điểm: " + error.message,
                "error"
            );
            await loadLockStatus();
        }
    }

    // 6. Xu ly KHOA LAI DIEM (POST /locks/relock)
    async function handleRelock(component) {
        const item = currentLocksData.find(c => c.component === component);
        if (!item) return;

        const yearId = academicYearSelect.value;
        const classId = classSelect.value;
        const subjectId = subjectSelect.value;

        try {
            const res = await apiClient.post("/locks/relock", {
                academicYearId: yearId,
                classId: classId,
                subjectId: subjectId,
                component: component,
                expectedVersion: item.version
            });

            // Neu bi tu choi do thieu diem
            if (res && res.success === false && res.data && res.data.hasMissingScores) {
                showMissingScoresWarning(
                    component,
                    res.data.missingCount,
                    res.data.message || "Còn học sinh chưa có điểm. Vui lòng nhập đầy đủ trước khi khóa lại."
                );
                return;
            }

            if (res && res.success) {
                UIComponents.showAlert(
                    "alertContainer",
                    `Đã khóa lại thành công cột điểm ${component}! Trạng thái hiện tại: ĐÃ KHÓA.`,
                    "success"
                );
                await loadLockStatus();
            }
        } catch (error) {
            UIComponents.showAlert(
                "alertContainer",
                "Không thể khóa lại cột điểm: " + error.message,
                "error"
            );
            await loadLockStatus();
        }
    }

    // 7. Modal MO KHOA DIEM
    function openUnlockModal(component) {
        const item = currentLocksData.find(c => c.component === component);
        if (!item) return;

        activeComponentToUnlock = item;

        const classText = classSelect.options[classSelect.selectedIndex].text;
        const subjectText = subjectSelect.options[subjectSelect.selectedIndex].text;

        modalComponentLabel.textContent = `${component} - ${COMPONENT_NAMES[component] || ""}`;
        modalScopeLabel.textContent = `${classText} - Môn: ${subjectText}`;
        modalVersionLabel.textContent = `Phiên bản v${item.version}`;

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

    closeUnlockModalBtn.addEventListener("click", closeUnlockModal);
    cancelUnlockBtn.addEventListener("click", closeUnlockModal);

    confirmUnlockBtn.addEventListener("click", async function () {
        if (!activeComponentToUnlock) return;

        const reason = unlockReasonInput.value.trim();
        if (!reason) {
            alert("Vui lòng nhập lý do giải trình để mở khóa cột điểm!");
            unlockReasonInput.focus();
            return;
        }

        const yearId = academicYearSelect.value;
        const classId = classSelect.value;
        const subjectId = subjectSelect.value;

        confirmUnlockBtn.disabled = true;
        confirmUnlockBtn.textContent = "Đang xử lý...";

        try {
            const targetComponent = activeComponentToUnlock.component;
            const res = await apiClient.post("/locks/unlock", {
                academicYearId: yearId,
                classId: classId,
                subjectId: subjectId,
                component: targetComponent,
                expectedVersion: activeComponentToUnlock.version,
                reason: reason
            });

            if (res && res.success) {
                closeUnlockModal();
                UIComponents.showAlert(
                    "alertContainer",
                    `Đã mở khóa thành công cột điểm ${targetComponent}! Dữ liệu điểm hiện đã có thể điều chỉnh và lý do đã được ghi vào Audit Log.`,
                    "success"
                );
                await loadLockStatus();
            }
        } catch (error) {
            alert("Mở khóa thất bại: " + error.message);
        } finally {
            confirmUnlockBtn.disabled = false;
            confirmUnlockBtn.textContent = "Xác nhận mở khóa";
        }
    });

    // 8. Modal TU CHOI KHI THIEU DIEM
    function showMissingScoresWarning(component, missingCount, message) {
        missingComponentLabel.textContent = `${component} (${COMPONENT_NAMES[component] || ""})`;
        missingCountNumber.textContent = `${missingCount} học sinh`;
        missingScoreMessage.textContent = message;
        missingScoreModal.hidden = false;
        missingScoreModal.style.display = "flex";
    }

    function closeMissingScoreModal() {
        missingScoreModal.hidden = true;
        missingScoreModal.style.display = "none";
    }

    closeMissingModalBtn.addEventListener("click", closeMissingScoreModal);
    confirmMissingCloseBtn.addEventListener("click", closeMissingScoreModal);

    // Dong modal khi click vao nen xam ben ngoai
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

    // Dong modal khi nhan phim ESC
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            if (!unlockModal.hidden) closeUnlockModal();
            if (!missingScoreModal.hidden) closeMissingScoreModal();
        }
    });
});

