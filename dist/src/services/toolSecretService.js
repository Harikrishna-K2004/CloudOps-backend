"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveToolSecret = saveToolSecret;
exports.getToolSecret = getToolSecret;
const supabase_1 = require("../config/supabase");
const encryption_1 = require("./encryption");
async function saveToolSecret(userId, toolId, credentials) {
    const encryptedCredentials = (0, encryption_1.encryptSecret)(credentials);
    const { data, error } = await supabase_1.supabase
        .from("tool_secrets")
        .upsert({
        user_id: userId,
        tool_id: toolId,
        encrypted_credentials: encryptedCredentials,
        is_configured: true,
        updated_at: new Date().toISOString(),
    }, {
        onConflict: "user_id,tool_id",
    })
        .select("id, tool_id, is_configured")
        .single();
    if (error) {
        throw new Error(`Failed to save tool secret: ${error.message}`);
    }
    return data;
}
async function getToolSecret(userId, toolId) {
    const { data, error } = await supabase_1.supabase
        .from("tool_secrets")
        .select("encrypted_credentials")
        .eq("user_id", userId)
        .eq("tool_id", toolId)
        .maybeSingle();
    if (error) {
        throw new Error(`Failed to get tool secret: ${error.message}`);
    }
    if (!data) {
        return null;
    }
    return (0, encryption_1.decryptSecret)(data.encrypted_credentials);
}
