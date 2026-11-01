
const express = require("express");

const gradeController = require(
    "../controllers/grade.controller"
);

const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

// Tao Router quan ly khoi
const router = express.Router();

// Yeu cau dang nhap va quyen Khao thi
// Ap dung cho tat ca API quan ly khoi
router.use(requireAuth, requireRole("KHAO_THI"));

// Lay danh sach tat ca cac khoi
router.get("/", gradeController.getAllGrades);

// Lay thong tin mot khoi theo ID
router.get("/:id", gradeController.getGradeById);

// Them khoi moi
router.post("/", gradeController.createGrade);

// Cap nhat so khoi theo ID
router.patch("/:id", gradeController.updateGrade);

// Xuat Router de server.js su dung
module.exports = router;
