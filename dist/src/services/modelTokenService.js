"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveModelToken = saveModelToken;
exports.getModelToken = getModelToken;
const supabase_1 = require("../config/supabase");
const encryption_1 = require("./encryption");
async function saveModelToken(userId, provider, token) {
    const encryptedToken = (0, encryption_1.encryptSecret)(token);
    const { data, error } = await supabase_1.supabase
        .from("model_api_tokens")
        .upsert({
        user_id: userId,
        provider,
        encrypted_token: encryptedToken,
        is_configured: true,
        updated_at: new Date().toISOString(),
    }, {
        onConflict: "user_id,provider",
    })
        .select("id, provider, is_configured")
        .single();
    if (error) {
        throw new Error(`Failed to save model token: ${error.message}`);
    }
    return data;
}
async function getModelToken(userId, provider) {
    const { data, error } = await supabase_1.supabase
        .from("model_api_tokens")
        .select("encrypted_token")
        .eq("user_id", userId)
        .eq("provider", provider)
        .maybeSingle();
    if (error) {
        throw new Error(`Failed to get model token: ${error.message}`);
    }
    if (!data) {
        return null;
    }
    return (0, encryption_1.decryptSecret)(data.encrypted_token);
}
