const express = require("express");
const { healthCheck } = require("../controllers/HealthController");

const router = express.Router();

router.get("/", healthCheck);

module.exports = router;
