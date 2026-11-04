
const express = require("express");

const subjectController = require(
    "../controllers/subject.controller"
);

const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

// Tao Router quan ly mon hoc
const router = express.Router();

// Yeu cau dang nhap va quyen Khao thi
// Ap dung cho tat ca API quan ly mon hoc
router.use(requireAuth, requireRole("KHAO_THI"));

// Lay danh sach tat ca mon hoc
// Bao gom mon ACTIVE va INACTIVE
router.get("/", subjectController.getAllSubjects);

// Lay thong tin mot mon hoc theo ID
router.get("/:id", subjectController.getSubjectById);

// Them mon hoc moi
router.post("/", subjectController.createSubject);

// Cap nhat mot phan thong tin mon hoc theo ID
router.patch("/:id", subjectController.updateSubject);

// Xuat Router de server.js su dung
module.exports = router;
