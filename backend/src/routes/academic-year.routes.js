
const express = require("express");

const academicYearController = require(
    "../controllers/academic-year.controller"
);

const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

const router = express.Router();

// Yeu cau dang nhap va quyen Khao thi
// Ap dung cho tat ca API quan ly nien khoa
router.use(requireAuth, requireRole("KHAO_THI"));

// Lay danh sach tat ca nien khoa
router.get("/", academicYearController.getAllAcademicYears);

// Tao nien khoa moi
router.post("/", academicYearController.createAcademicYear);

// Lay thong tin nien khoa theo ID
router.get("/:id", academicYearController.getAcademicYearById);

// Cap nhat mot phan thong tin nien khoa theo ID
router.patch("/:id", academicYearController.updateAcademicYear);

// Xuat Router
module.exports = router;
