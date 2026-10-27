
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Cau hinh bao mat HTTP
app.use(helmet());

// Cho phep backend nhan JSON
app.use(express.json());

// API kiem tra trang thai backend
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            status: "ok"
        }
    });
});

// Khoi dong server
app.listen(PORT, () => {
    console.log(`Backend dang chay tai http://localhost:${PORT}`);
});
