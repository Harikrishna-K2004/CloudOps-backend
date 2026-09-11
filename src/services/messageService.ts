import { supabase } from "../config/supabase";

export async function addMessage(
  chatId: string,
  role: string,
  content: string,
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      role,
      content,
    })
    .select(
      "id, chat_id, role, content, created_at",
    )
    .single();

  if (error) {
    throw new Error(
      `Failed to add message: ${error.message}`,
    );
  }

  return data;
}

export async function getChatMessages(
  chatId: string,
) {
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, chat_id, role, content, created_at",
    )
    .eq("chat_id", chatId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Failed to get messages: ${error.message}`,
    );
  }

  return data;
}