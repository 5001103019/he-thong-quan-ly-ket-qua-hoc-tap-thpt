
"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const $ = id => document.getElementById(id);

    const page = document.querySelector(".csv-page");
    const importTab = $("csvImportTab");
    const exportTab = $("csvExportTab");
    const exportPanel = $("csvExportPanel");

    const title = document.querySelector(".csv-page > .page-title");
    const description = document.querySelector(".csv-page > .page-description");

    const year = $("exportYear");
    const grade = $("exportGrade");
    const classroom = $("exportClass");
    const subject = $("exportSubject");
    const type = $("exportType");
    const form = $("exportForm");
    const button = $("exportButton");
    const message = $("exportMessage");

    let classes = [];

    function showTab(isExport) {
        page.classList.toggle("csv-show-export", isExport);
        exportPanel.hidden = !isExport;

        importTab.classList.toggle("active", !isExport);
        exportTab.classList.toggle("active", isExport);

        importTab.setAttribute("aria-pressed", String(!isExport));
        exportTab.setAttribute("aria-pressed", String(isExport));

        if (isExport) {
            title.textContent = "Xuất điểm CSV";
            description.textContent =
                "Chọn phạm vi để xuất dữ liệu thực tế từ hệ thống.";
        } else if (!$("csvErrorStep").hidden) {
            title.textContent = "Kiểm tra lỗi CSV";
            description.textContent =
                "Các bản ghi không hợp lệ cần được sửa trước khi nhập.";
        } else if (!$("csvPreviewStep").hidden) {
            title.textContent = "Xem trước dữ liệu CSV";
            description.textContent =
                "Bước 2 – Kiểm tra từng dòng trước khi xác nhận nhập.";
        } else {
            title.textContent = "Import điểm từ CSV";
            description.textContent =
                "Tải tệp điểm lên để kiểm tra trước khi ghi dữ liệu.";
        }
    }

    importTab.addEventListener("click", () => showTab(false));
    exportTab.addEventListener("click", () => showTab(true));

    if (location.hash === "#export") {
        showTab(true);
    }

    function showMessage(content, error = false) {
        message.textContent = content;
        message.classList.toggle("csv-status-error", error);
    }

    function fill(select, data, valueOf, labelOf, firstLabel) {
        select.replaceChildren(new Option(firstLabel, ""));

        data.forEach(item => {
            select.add(new Option(
                String(labelOf(item)),
                String(valueOf(item))
            ));
        });
    }

    async function getList(name) {
        const response = await fetch("/api/v1/" + name, {
            credentials: "same-origin"
        });

        const result = await response.json();

        if (!response.ok || !result.success ||
            !Array.isArray(result.data)) {
            throw new Error(
                result.error?.message || "Không tải được " + name
            );
        }

        return result.data;
    }

    function loadClassOptions() {
        const matches = classes.filter(item =>
            String(item.academicYearId) === year.value &&
            String(item.gradeNumber) === grade.value
        );

        fill(
            classroom,
            matches,
            item => item.classId,
            item => item.code,
            matches.length ? "Chọn lớp" : "Chưa có lớp học"
        );

        classroom.disabled = matches.length === 0;

        if (matches.length) {
            classroom.selectedIndex = 1;
        }
    }

    async function loadCatalogs() {
        try {
            const [years, classList, subjects] = await Promise.all([
                getList("academic-years"),
                getList("classes"),
                getList("subjects")
            ]);

            classes = classList;

            fill(
                year,
                years,
                item => item.academicYearId,
                item => item.code,
                "Chọn niên khóa"
            );

            fill(
                subject,
                subjects,
                item => item.subjectId,
                item => item.name,
                "Tất cả"
            );

            if (years.length) {
                year.selectedIndex = 1;
            }

            loadClassOptions();

        } catch (error) {
            showMessage(
                "Không tải được bộ lọc: " + error.message,
                true
            );
        }
    }

    year.addEventListener("change", loadClassOptions);
    grade.addEventListener("change", loadClassOptions);

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!form.reportValidity() || !classroom.value) {
            return;
        }

        const params = new URLSearchParams({
            type: type.value,
            academicYearId: year.value,
            classId: classroom.value
        });

        if (subject.value) {
            params.set("subjectId", subject.value);
        }

        if (!confirm("Xuất dữ liệu CSV theo bộ lọc đã chọn?")) {
            return;
        }

        button.disabled = true;
        button.textContent = "Đang xuất...";
        showMessage("Đang chuẩn bị dữ liệu CSV...");

        try {
            const response = await fetch(
                "/api/v1/score-export?" + params,
                { credentials: "same-origin" }
            );

            if (!response.ok) {
                const err = await response.json().catch(() => null);
                throw new Error(
                    err?.error?.message || "HTTP " + response.status
                );
            }

            const blob = await response.blob();

            const disposition =
                response.headers.get("Content-Disposition") || "";

            const match =
                disposition.match(/filename="?([^";]+)"?/i);

            const filename = match
                ? match[1]
                : "bang-diem.csv";

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(url), 30000);

            showMessage(
                "Đã xuất CSV. Kiểm tra thư mục Downloads."
            );

        } catch (error) {
            showMessage("Xuất thất bại: " + error.message, true);

        } finally {
            button.disabled = false;
            button.textContent = "Xuất CSV";
        }
    });

    loadCatalogs();
});
