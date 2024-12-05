const express = require("express");
const { getData, getWeb } = require("../controllers/homeControllers");
const router = express.Router();

//Đinh tuyến API
router.get("/api", getData);

//Định tuyến Web page chính
router.get("/", getWeb);

module.exports = router;
