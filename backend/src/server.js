
"use strict";

// Doc bien moi truong tu file .env
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

// VT1-04: Router xac thuc tai khoan
const authRoutes = require("./routes/auth-routes");
const protectedRoutes = require("./routes/protected-routes");
const demoAccountRoutes = require("./routes/demo-account-routes");
const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 1. Cau hinh bao mat HTTP
app.use(helmet());

// 2. Cho phep backend nhan du lieu JSON
app.use(express.json());

// 3. Doc cookie chua token phien dang nhap
// Middleware requireAuth se su dung req.cookies
app.use(cookieParser());

// 4. API xac thuc
// POST /api/v1/auth/login
// POST /api/v1/auth/logout
// GET  /api/v1/auth/me
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", protectedRoutes);
app.use("/api/v1/khao-thi/demo-accounts", demoAccountRoutes);
// 5. API kiem tra trang thai backend
app.get("/api/v1/health", (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            status: "ok"
        }
    });
});

// 6. Khoi dong backend
app.listen(PORT, () => {
    console.log(
        `Backend dang chay tai http://localhost:${PORT}`
    );
});
