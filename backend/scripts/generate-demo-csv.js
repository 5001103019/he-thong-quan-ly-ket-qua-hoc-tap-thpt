
/*
 * VT1-05 - TAO DU LIEU CSV DEMO
 *
 * Tao 4 file:
 * 1. students-valid.csv
 * 2. students-invalid.csv
 * 3. scores-valid.csv
 * 4. scores-invalid.csv
 *
 * Du lieu co dinh, khong ket noi database.
 * Chay lai se tao dung bo CSV ban dau.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

// Thu muc luu file CSV.
const outputDir = path.join(
    __dirname,
    "..",
    "demo-data",
    "csv"
);

// =====================================
// 1. DU LIEU CSV HOC SINH HOP LE
// =====================================

const studentsValid = [
    [
        "studentCode",
        "fullName",
        "dateOfBirth",
        "academicYearCode",
        "classCode",
        "startDate",
        "status"
    ],
    [
        "DEMO_G05_CSV_S01",
        "Hoc sinh CSV 01",
        "2010-02-15",
        "2026-2027",
        "DEMO_10A1",
        "2026-09-01",
        "ACTIVE"
    ],
    [
        "DEMO_G05_CSV_S02",
        "Hoc sinh CSV 02",
        "2010-03-18",
        "2026-2027",
        "DEMO_10A1",
        "2026-09-01",
        "ACTIVE"
    ]
];

// =====================================
// 2. DU LIEU CSV HOC SINH CO LOI
// =====================================

const studentsInvalid = [
    studentsValid[0],

    // Thieu ma hoc sinh.
    [
        "",
        "Hoc sinh thieu ma",
        "2010-02-15",
        "2026-2027",
        "DEMO_10A1",
        "2026-09-01",
        "ACTIVE"
    ],

    // Thieu ho ten.
    [
        "DEMO_G05_CSV_BAD02",
        "",
        "2010-02-15",
        "2026-2027",
        "DEMO_10A1",
        "2026-09-01",
        "ACTIVE"
    ],

    // Ngay sinh khong hop le.
    [
        "DEMO_G05_CSV_BAD03",
        "Hoc sinh sai ngay",
        "2010-15-40",
        "2026-2027",
        "DEMO_10A1",
        "2026-09-01",
        "ACTIVE"
    ],

    // Lop khong ton tai.
    [
        "DEMO_G05_CSV_BAD04",
        "Hoc sinh sai lop",
        "2010-02-15",
        "2026-2027",
        "DEMO_99A1",
        "2026-09-01",
        "ACTIVE"
    ],

    // Hai dong trung ma hoc sinh.
    [
        "DEMO_G05_CSV_DUP",
        "Hoc sinh trung 1",
        "2010-02-15",
        "2026-2027",
        "DEMO_10A1",
        "2026-09-01",
        "ACTIVE"
    ],
    [
        "DEMO_G05_CSV_DUP",
        "Hoc sinh trung 2",
        "2010-03-15",
        "2026-2027",
        "DEMO_10A1",
        "2026-09-01",
        "ACTIVE"
    ]
];

// =====================================
// 3. DU LIEU CSV DIEM HOP LE
// =====================================

const scoreHeader = [
    "studentCode",
    "academicYearCode",
    "classCode",
    "subjectCode",
    "QT1",
    "QT2",
    "QT3",
    "GK",
    "CK"
];

const scoresValid = [
    scoreHeader,

    // Diem 0 la gia tri hop le.
    [
        "DEMO_G05_2627_G10_S01",
        "2026-2027",
        "DEMO_10A1",
        "TINHOC",
        0,
        7,
        8,
        7.25,
        8.50
    ],

    // QT3 de trong, du kien la NOT_ENTERED.
    [
        "DEMO_G05_2627_G10_S02",
        "2026-2027",
        "DEMO_10A1",
        "TINHOC",
        9,
        8,
        "",
        7.50,
        9
    ]
];

// =====================================
// 4. DU LIEU CSV DIEM CO LOI
// =====================================

const scoresInvalid = [
    scoreHeader,

    // Khong tim thay hoc sinh.
    [
        "DEMO_G05_NOT_FOUND",
        "2026-2027",
        "DEMO_10A1",
        "TINHOC",
        8, 7, 9, 7.50, 8
    ],

    // Diem QT1 vuot mien 0-10.
    [
        "DEMO_G05_2627_G10_S01",
        "2026-2027",
        "DEMO_10A1",
        "TINHOC",
        11, 7, 8, 7.50, 8
    ],

    // Diem qua trinh khong phai so nguyen.
    [
        "DEMO_G05_2627_G10_S01",
        "2026-2027",
        "DEMO_10A1",
        "TINHOC",
        7.5, 7, 8, 7.50, 8
    ],

    // GK khong dung buoc 0.25.
    [
        "DEMO_G05_2627_G10_S02",
        "2026-2027",
        "DEMO_10A1",
        "TINHOC",
        8, 7, 9, 7.30, 8
    ],

    // Thieu ma mon hoc.
    [
        "DEMO_G05_2627_G10_S02",
        "2026-2027",
        "DEMO_10A1",
        "",
        8, 7, 9, 7.50, 8
    ]
];

// =====================================
// 5. CHUYEN MANG THANH CSV
// =====================================

function escapeCsvValue(value) {
    const text = String(value ?? "");

    if (/[",\r\n]/.test(text)) {
        return '"' +
            text.replace(/"/g, '""') +
            '"';
    }

    return text;
}

function convertToCsv(rows) {
    const content = rows
        .map(row => row.map(
            escapeCsvValue
        ).join(","))
        .join("\r\n");

    // BOM de Excel nhan UTF-8.
    return "\uFEFF" + content + "\r\n";
}

// =====================================
// 6. GHI FILE CSV
// =====================================

function main() {
    fs.mkdirSync(outputDir, {
        recursive: true
    });

    const files = [
        ["students-valid.csv", studentsValid],
        ["students-invalid.csv", studentsInvalid],
        ["scores-valid.csv", scoresValid],
        ["scores-invalid.csv", scoresInvalid]
    ];

    for (const [filename, rows] of files) {
        const filepath = path.join(
            outputDir,
            filename
        );

        fs.writeFileSync(
            filepath,
            convertToCsv(rows),
            "utf8"
        );

        console.log("[DA TAO] " + filename);
    }

    console.log("");
    console.log("==============================");
    console.log("TAO CSV DEMO THANH CONG");
    console.log("==============================");
    console.log("So file: " + files.length);
    console.log("Thu muc: backend/demo-data/csv");
}

main();
