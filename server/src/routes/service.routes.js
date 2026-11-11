const { Router } = require("express");
const {
    getAllServices,
    getServiceById,
    useService,
    getMyHistory
} = require("../controllers/service.controller");

const { requireAuth, optionalAuth } = require("../middlewares/auth.middleware");

const router = Router();
router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.post("/:id/use", optionalAuth, useService)

module.exports = router;