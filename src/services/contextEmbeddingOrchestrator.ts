import {
  saveContextChunk,
} from "./contextService";

import {
  generateContextEmbedding,
} from "./contextEmbeddingService";

import {
  getModelToken,
} from "./modelTokenService";

export async function createMessageContext(
  userId: string,
  chatId: string,
  messageId: string,
  content: string,
) {
  const geminiApiKey = await getModelToken(
    userId,
    "gemini",
  );

  if (!geminiApiKey) {
    throw new Error(
      "Gemini API key is required for context embeddings",
    );
  }

  const embedding =
    await generateContextEmbedding(
      content,
      geminiApiKey,
    );

  return saveContextChunk(
    userId,
    chatId,
    "message",
    messageId,
    content,
    embedding,
  );
}