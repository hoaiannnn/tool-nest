const { Router } = require("express");
const { requireAuth } = require("../middlewares/auth.middleware");
const { createPaypalOrder, capturePaypalOrder } = require("../controllers/paypal.controller");

const router = Router();

router.post("/paypal/create-order", requireAuth, createPaypalOrder);
router.post("/paypal/capture", requireAuth, capturePaypalOrder);

module.exports = router;