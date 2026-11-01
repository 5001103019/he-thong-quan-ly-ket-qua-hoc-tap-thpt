
"use strict";

// Doc bien moi truong tu file .env
require("dotenv").config();

const express = require("express");
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

// 9. API kiem tra trang thai backend
app.get("/api/v1/health", (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            status: "ok"
        }
    });
});

// 10. Khoi dong backend
app.listen(PORT, () => {
    console.log(
        `Backend dang chay tai http://localhost:${PORT}`
    );
});
