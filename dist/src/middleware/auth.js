"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const supabase_1 = require("../config/supabase");
async function requireAuth(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Missing authorization token",
        });
    }
    const token = authorization.substring(7);
    const { data: { user }, error, } = await supabase_1.supabase.auth.getUser(token);
    if (error || !user) {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
    req.userId = user.id;
    next();
}
