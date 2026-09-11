import { supabase } from "../config/supabase";

export async function createChat(
  userId: string,
  title = "New Chat",
  provider?: string,
  model?: string,
) {
  const { data, error } = await supabase
    .from("chats")
    .insert({
      user_id: userId,
      title,
      provider,
      model,
    })
    .select(
      "id, title, provider, model, created_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error(
      `Failed to create chat: ${error.message}`,
    );
  }

  return data;
}

export async function getUserChats(userId: string) {
  const { data, error } = await supabase
    .from("chats")
    .select(
      "id, title, provider, model, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to get chats: ${error.message}`,
    );
  }

  return data;
}

export async function getChat(
  userId: string,
  chatId: string,
) {
  const { data, error } = await supabase
    .from("chats")
    .select(
      "id, title, provider, model, created_at, updated_at",
    )
    .eq("id", chatId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to get chat: ${error.message}`,
    );
  }

  return data;
}

export async function updateChatTitle(
  userId: string,
  chatId: string,
  title: string,
) {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new Error("Chat title cannot be empty");
  }

  const { data, error } = await supabase
    .from("chats")
    .update({
      title: trimmedTitle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chatId)
    .eq("user_id", userId)
    .select(
      "id, title, provider, model, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to update chat title: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error("Chat not found");
  }

  return data;
}

export async function deleteChat(
  userId: string,
  chatId: string,
) {
  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(
      `Failed to delete chat: ${error.message}`,
    );
  }
}