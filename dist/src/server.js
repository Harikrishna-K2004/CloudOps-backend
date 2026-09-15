"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const supabase_1 = require("./config/supabase");
const auth_1 = __importDefault(require("./api/auth"));
const models_1 = __importDefault(require("./api/models"));
const modelTokens_1 = __importDefault(require("./api/modelTokens"));
const toolSecrets_1 = __importDefault(require("./api/toolSecrets"));
const chats_1 = __importDefault(require("./api/chats"));
const ai_1 = __importDefault(require("./api/ai"));
const tools_1 = __importDefault(require("./api/tools"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env_1.env.frontendUrl,
}));
app.use(express_1.default.json());
app.get("/health", async (_req, res) => {
    const { error } = await supabase_1.supabase
        .from("users")
        .select("id")
        .limit(1);
    if (error) {
        return res.status(500).json({
            status: "error",
            supabase: false,
        });
    }
    return res.json({
        status: "ok",
        supabase: true,
    });
});
app.use("/api/auth", auth_1.default);
app.use("/api/models", models_1.default);
app.use("/api/model-tokens", modelTokens_1.default);
app.use("/api/tool-secrets", toolSecrets_1.default);
app.use("/api/chats", chats_1.default);
app.use("/api", ai_1.default);
app.use("/api/tools", tools_1.default);
app.listen(env_1.env.port, () => {
    console.log(`CloudOps API running on http://localhost:${env_1.env.port}`);
});
