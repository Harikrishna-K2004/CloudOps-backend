import { supabase } from "../config/supabase";

export interface ContextChunk {
  id: string;
  chatId: string;
  sourceType: "message" | "file";
  sourceId: string;
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function saveContextChunk(
  userId: string,
  chatId: string,
  sourceType: "message" | "file",
  sourceId: string,
  content: string,
  embedding: number[],
  chunkIndex = 0,
  metadata: Record<string, unknown> = {},
): Promise<ContextChunk> {
  const { data, error } = await supabase
    .from("context_chunks")
    .upsert(
      {
        user_id: userId,
        chat_id: chatId,
        source_type: sourceType,
        source_id: sourceId,
        chunk_index: chunkIndex,
        content,
        embedding,
        metadata,
      },
      {
        onConflict: "source_type,source_id,chunk_index",
      },
    )
    .select(
      `
      id,
      chat_id,
      source_type,
      source_id,
      chunk_index,
      content,
      metadata,
      created_at
      `,
    )
    .single();

  if (error) {
    throw new Error(
      `Failed to save context chunk: ${error.message}`,
    );
  }

  return {
    id: data.id,
    chatId: data.chat_id,
    sourceType: data.source_type,
    sourceId: data.source_id,
    chunkIndex: data.chunk_index,
    content: data.content,
    metadata: data.metadata ?? {},
    createdAt: data.created_at,
  };
}

export async function searchContext(
  userId: string,
  chatId: string,
  embedding: number[],
  limit = 5,
) {
  const { data, error } = await supabase.rpc(
    "match_context_chunks",
    {
      query_embedding: embedding,
      match_user_id: userId,
      match_chat_id: chatId,
      match_count: limit,
    },
  );

  if (error) {
    throw new Error(
      `Failed to search context: ${error.message}`,
    );
  }

  return data ?? [];
}