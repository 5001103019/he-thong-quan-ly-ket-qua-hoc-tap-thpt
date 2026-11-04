"use strict";

const express = require("express");

const studentController = require(
    "../controllers/student.controller"
);

const studentCsvController = require(
    "../controllers/student-csv.controller"
);

const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

const router = express.Router();

// Chi Phong Khao thi duoc quan ly ho so hoc sinh
router.use(requireAuth, requireRole("KHAO_THI"));

// Xem truoc Import hoc sinh tu CSV
router.post(
    "/import/preview",
    studentCsvController.previewStudentImport
);

// Xac nhan Import hoc sinh tu CSV
router.post(
    "/import/confirm",
    studentCsvController.confirmStudentImport
);

// Them ho so hoc sinh moi
router.post("/", studentController.createStudent);

// Cap nhat thong tin ho so hoc sinh
router.patch("/:id", studentController.updateStudentProfile);

// Cap nhat trang thai ho so hoc sinh
router.patch(
    "/:id/status",
    studentController.updateStudentStatus
);

// Phan hoc sinh vao lop
router.post(
    "/:id/enrollments",
    studentController.assignStudentToClass
);

// Tra cuu danh sach hoc sinh
router.get("/", studentController.getAllStudents);

// Xem lich su phan lop cua mot hoc sinh
router.get(
    "/:id/enrollments",
    studentController.getStudentEnrollmentHistory
);

// Xem chi tiet ho so hoc sinh
router.get("/:id", studentController.getStudentById);

// Chuyen hoc sinh sang lop moi
router.post(
    "/:id/transfers",
    studentController.transferStudentToClass
);

module.exports = router;