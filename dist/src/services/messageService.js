"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMessage = addMessage;
exports.getChatMessages = getChatMessages;
const supabase_1 = require("../config/supabase");
async function addMessage(chatId, role, content) {
    const { data, error } = await supabase_1.supabase
        .from("messages")
        .insert({
        chat_id: chatId,
        role,
        content,
    })
        .select("id, chat_id, role, content, created_at")
        .single();
    if (error) {
        throw new Error(`Failed to add message: ${error.message}`);
    }
    return data;
}
async function getChatMessages(chatId) {
    const { data, error } = await supabase_1.supabase
        .from("messages")
        .select("id, chat_id, role, content, created_at")
        .eq("chat_id", chatId)
        .order("created_at", {
        ascending: true,
    });
    if (error) {
        throw new Error(`Failed to get messages: ${error.message}`);
    }
    return data;
}
