"use strict";

// Chuyen mot gia tri thanh o CSV hop le.
function escapeCsvCell(value) {
    if (value === null || value === undefined) {
        return '""';
    }

    const text = String(value);

    // Ngan Excel thuc thi cong thuc trong du lieu chuoi.
    const safeText =
        typeof value === "string" &&
        /^\s*[=+\-@]/.test(text)
            ? "'" + text
            : text;

    // Dau nhay kep trong CSV phai duoc nhan doi.
    return `"${safeText.replace(/"/g, '""')}"`;
}

// Tao CSV UTF-8 co BOM, ho tro tieng Viet.
function createCsv(headers, rows) {
    if (
        !Array.isArray(headers) ||
        headers.length === 0 ||
        !Array.isArray(rows)
    ) {
        throw new TypeError("Du lieu CSV khong hop le.");
    }

    for (const row of rows) {
        if (
            !Array.isArray(row) ||
            row.length !== headers.length
        ) {
            throw new TypeError(
                "So cot du lieu khong khop tieu de CSV."
            );
        }
    }

    const lines = [headers, ...rows].map(
        row => row.map(escapeCsvCell).join(",")
    );

    // UTF-8 BOM va xuong dong CRLF.
    return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

module.exports = {
    createCsv
};