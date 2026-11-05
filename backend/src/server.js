
"use strict";

// Doc bien moi truong tu file .env
require("dotenv").config();

const express = require("express");
const path = require("node:path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

// Router xac thuc va quan ly tai khoan
const authRoutes = require("./routes/auth-routes");
const protectedRoutes = require("./routes/protected-routes");
const demoAccountRoutes = require("./routes/demo-account-routes");

// Router quan ly nien khoa
const academicYearRoutes = require("./routes/academic-year.routes");

// Router quan ly khoi
const gradeRoutes = require("./routes/grade.routes");

// Router quan ly lop hoc
const classRoutes = require("./routes/class.routes");

// Router quan ly mon hoc
const subjectRoutes = require("./routes/subject.routes");
const studentRoutes = require("./routes/student.routes");

// CV2 - Chau: Router quan ly diem
const scoreRoutes = require("./routes/scoreRoutes");

// CV2 - Chau: Router chi tiet ban ghi diem
const scoreRecordRoutes = require("./routes/scoreRecordRoutes");

// CV2 - Uyen: Router quan ly khoa diem.
const lockRoutes = require("./routes/lockRoutes");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 1. Cau hinh bao mat HTTP
app.use(helmet());

// 2. Cho phep backend nhan du lieu JSON
app.use(express.json());

// 3. Doc cookie chua token phien dang nhap
// Middleware requireAuth se su dung req.cookies
app.use(cookieParser());

// 4. API xac thuc va quan ly tai khoan
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", protectedRoutes);
app.use("/api/v1/khao-thi/demo-accounts", demoAccountRoutes);


// CV2 - Chau: API lay bang diem
// GET /api/v1/scores
// Yeu cau dang nhap va vai tro KHAO_THI
app.use("/api/v1/scores", scoreRoutes);

// CV2 - Chau: API lay chi tiet ban ghi diem
// GET /api/v1/score-records/:id
// Yeu cau dang nhap va vai tro KHAO_THI
app.use("/api/v1/score-records", scoreRecordRoutes);

// 5. API quan ly nien khoa
// Chi vai tro KHAO_THI duoc phep truy cap
app.use("/api/v1/academic-years", academicYearRoutes);

// 6. API quan ly khoi
// Chi vai tro KHAO_THI duoc phep truy cap
app.use("/api/v1/grades", gradeRoutes);

// 7. API quan ly lop hoc
// Chi vai tro KHAO_THI duoc phep truy cap
app.use("/api/v1/classes", classRoutes);

// 8. API quan ly mon hoc
// Chi vai tro KHAO_THI duoc phep truy cap
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/students", studentRoutes);

// 9. Dang ky API truy van va khoa cot diem
app.use("/api/v1/locks", lockRoutes);

// 10. API kiem tra trang thai backend
app.get("/api/v1/health", (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            status: "ok"
        }
    });
});
// VT1-04 - Phuc vu giao dien web cung dia chi voi API
// Chi phuc vu thu muc frontend, khong phuc vu file .env
app.use(
    express.static(
        path.join(__dirname, "../../frontend")
    )
);
// 10. Khoi dong backend
app.listen(PORT, () => {
    console.log(
        `Backend dang chay tai http://localhost:${PORT}`
    );
});
