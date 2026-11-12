const { Router } = require("express");
const {
    getOverview,
    getUsers,
    toggleUserStatus,
    getActivity,
    getAdminServices,
    createService,
    updateService,
    deleteService,
    getAdmins,
    createAdmin,
} = require("../controllers/admin.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/overview", getOverview);
router.get("/users", getUsers);
router.patch("/users/:id/toggle-status", toggleUserStatus);
router.get("/activity", getActivity);

router.get("/services", getAdminServices);
router.post("/services", createService);
router.put("/services/:id", updateService);
router.delete("/services/:id", deleteService);

router.get("/admins", getAdmins);
router.post("/admins", createAdmin);

module.exports = router;