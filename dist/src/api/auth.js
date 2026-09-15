"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/me", auth_1.requireAuth, (req, res) => {
    res.json({
        id: req.userId,
    });
});
exports.default = router;
