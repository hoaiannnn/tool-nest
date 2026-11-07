const { Router } = require("express");
const { getAllServices, getServiceById } =
    require("../controllers/service.controller");

const router = Router();
router.get("/", getAllServices);
router.get("/:id", getServiceById);

module.exports = router;