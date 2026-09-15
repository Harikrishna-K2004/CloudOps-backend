"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
exports.env = {
    port: Number(process.env.PORT ?? 8080),
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    secretEncryptionKey: process.env.SECRET_ENCRYPTION_KEY,
    aiServerUrl: process.env.AI_SERVER_URL ?? "http://localhost:8000",
};
