
"use strict";

/*
 * Parser CSV dung chung.
 *
 * Khong phu thuoc vao nghiep vu hoc sinh hay diem.
 * Ho tro:
 * - UTF-8 BOM
 * - Dau phay trong chuoi duoc bao bang dau nhay kep
 * - Dau nhay kep thoat bang ""
 * - Xuong dong CRLF/LF
 * - Loi theo dong CSV
 */

function parseCsv(text) {
    if (typeof text !== "string") {
        throw new TypeError("Noi dung CSV phai la chuoi.");
    }

    const source = text.replace(/^\uFEFF/, "");
    const records = [];

    let cells = [];
    let cell = "";
    let inQuotes = false;
    let afterQuote = false;
    let quotedCell = false;
    let rowError = null;

    let lineNumber = 1;
    let rowStartLine = 1;

    function finishCell() {
    // Giu nguyen khoang trang neu truong co nhay kep.
    // Truong khong co nhay kep van duoc trim.
    cells.push(quotedCell ? cell : cell.trim());

    cell = "";
    afterQuote = false;
    quotedCell = false;
    }

    function finishRow() {
        finishCell();

        // Bo qua dong trong, khong bo qua dong nhieu cot rong.
        if (
            cells.length !== 1 ||
            cells[0] !== "" ||
            rowError !== null
        ) {
            records.push({
                lineNumber: rowStartLine,
                cells,
                error: rowError
            });
        }

        cells = [];
        rowError = null;
    }

    for (let i = 0; i < source.length; i++) {
        const ch = source[i];

        // Xu ly xuong dong ngoai hoac trong dau nhay.
        if (ch === "\r" || ch === "\n") {
            if (ch === "\r" && source[i + 1] === "\n") {
                i++;
            }

            if (inQuotes) {
                cell += "\n";
            } else {
                finishRow();
            }

            lineNumber++;

            if (!inQuotes) {
                rowStartLine = lineNumber;
            }

            continue;
        }

        if (inQuotes) {
            if (ch === '"') {
                if (source[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuotes = false;
                    afterQuote = true;
                }
            } else {
                cell += ch;
            }

            continue;
        }

        if (afterQuote) {
            if (ch === ",") {
                finishCell();
            } else if (ch !== " " && ch !== "\t") {
                rowError =
                    "Ky tu khong hop le sau dau nhay kep.";
            }

            continue;
        }

        if (ch === ",") {
            finishCell();
        } else if (ch === '"') {
            if (cell.length === 0) {
                inQuotes = true;
                quotedCell = true;
            } else {
                rowError =
                    "Dau nhay kep nam sai vi tri.";
            }
        } else {
            cell += ch;
        }
    }

    if (inQuotes) {
        rowError = "Chuoi CSV chua dong dau nhay kep.";
    }

    if (
        cells.length > 0 ||
        cell.length > 0 ||
        afterQuote ||
        rowError !== null
    ) {
        finishRow();
    }

    const errors = [];
    const rows = [];

    if (records.length === 0) {
        return {
            headers: [],
            rows: [],
            errors: [{
                lineNumber: 1,
                code: "EMPTY_CSV",
                message: "Tep CSV khong co du lieu."
            }]
        };
    }

    const headerRecord = records[0];
    const headers = headerRecord.cells;

    if (headerRecord.error) {
        errors.push({
            lineNumber: headerRecord.lineNumber,
            code: "INVALID_HEADER",
            message: headerRecord.error
        });
    }

    if (
        headers.some(header => header === "") ||
        new Set(headers).size !== headers.length
    ) {
        errors.push({
            lineNumber: headerRecord.lineNumber,
            code: "INVALID_HEADER",
            message: "Ten cot CSV rong hoac bi trung."
        });
    }

    // Khong doc cac dong du lieu neu header bi loi.
    if (errors.length > 0) {
        return { headers, rows, errors };
    }

    for (const record of records.slice(1)) {
        if (record.error) {
            errors.push({
                lineNumber: record.lineNumber,
                code: "INVALID_CSV",
                message: record.error
            });

            continue;
        }

        if (record.cells.length !== headers.length) {
            errors.push({
                lineNumber: record.lineNumber,
                code: "COLUMN_COUNT_MISMATCH",
                message:
                    "So cot khong khop voi dong tieu de."
            });

            continue;
        }

        const data = {};

        headers.forEach((header, index) => {
            data[header] = record.cells[index];
        });

        rows.push({
            lineNumber: record.lineNumber,
            data
        });
    }

    return { headers, rows, errors };
}

module.exports = { parseCsv };
