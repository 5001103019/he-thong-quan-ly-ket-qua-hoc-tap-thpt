
const express = require("express");

const classController = require(
    "../controllers/class.controller"
);

const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

// Tao Router quan ly lop hoc
const router = express.Router();

// Yeu cau dang nhap va quyen Khao thi
// Ap dung cho tat ca API quan ly lop hoc
router.use(requireAuth, requireRole("KHAO_THI"));

// Lay danh sach tat ca cac lop hoc
// Ho tro loc theo nien khoa va khoi
router.get("/", classController.getAllClasses);

// Lay thong tin mot lop hoc theo ID
router.get("/:id", classController.getClassById);

// Them lop hoc moi
router.post("/", classController.createClass);

// Cap nhat mot phan thong tin lop hoc theo ID
router.patch("/:id", classController.updateClass);

// Xuat Router de server.js su dung
module.exports = router;
