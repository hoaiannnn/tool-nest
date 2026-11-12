const { Router } = require("express");
const { checkoutPlan } = require("../controllers/plan.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/checkout", requireAuth, checkoutPlan);

module.exports = router;