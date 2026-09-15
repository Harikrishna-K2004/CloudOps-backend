"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChat = createChat;
exports.getUserChats = getUserChats;
exports.getChat = getChat;
exports.updateChatTitle = updateChatTitle;
exports.deleteChat = deleteChat;
const supabase_1 = require("../config/supabase");
async function createChat(userId, title = "New Chat", provider, model) {
    const { data, error } = await supabase_1.supabase
        .from("chats")
        .insert({
        user_id: userId,
        title,
        provider,
        model,
    })
        .select("id, title, provider, model, created_at, updated_at")
        .single();
    if (error) {
        throw new Error(`Failed to create chat: ${error.message}`);
    }
    return data;
}
async function getUserChats(userId) {
    const { data, error } = await supabase_1.supabase
        .from("chats")
        .select("id, title, provider, model, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
    if (error) {
        throw new Error(`Failed to get chats: ${error.message}`);
    }
    return data;
}
async function getChat(userId, chatId) {
    const { data, error } = await supabase_1.supabase
        .from("chats")
        .select("id, title, provider, model, created_at, updated_at")
        .eq("id", chatId)
        .eq("user_id", userId)
        .maybeSingle();
    if (error) {
        throw new Error(`Failed to get chat: ${error.message}`);
    }
    return data;
}
async function updateChatTitle(userId, chatId, title) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
        throw new Error("Chat title cannot be empty");
    }
    const { data, error } = await supabase_1.supabase
        .from("chats")
        .update({
        title: trimmedTitle,
        updated_at: new Date().toISOString(),
    })
        .eq("id", chatId)
        .eq("user_id", userId)
        .select("id, title, provider, model, created_at, updated_at")
        .maybeSingle();
    if (error) {
        throw new Error(`Failed to update chat title: ${error.message}`);
    }
    if (!data) {
        throw new Error("Chat not found");
    }
    return data;
}
async function deleteChat(userId, chatId) {
    const { error } = await supabase_1.supabase
        .from("chats")
        .delete()
        .eq("id", chatId)
        .eq("user_id", userId);
    if (error) {
        throw new Error(`Failed to delete chat: ${error.message}`);
    }
}
