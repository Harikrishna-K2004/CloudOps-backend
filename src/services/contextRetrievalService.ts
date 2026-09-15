import {
  searchContext,
} from "./contextService";

import {
  generateContextEmbedding,
} from "./contextEmbeddingService";

import {
  getModelToken,
} from "./modelTokenService";

export async function retrieveContext(
  userId: string,
  chatId: string,
  query: string,
  limit = 5,
) {
  const geminiApiKey = await getModelToken(userId, "gemini");

  if (!geminiApiKey) {
    console.log("CONTEXT: No Gemini API key");
    return [];
  }

  const embedding = await generateContextEmbedding(query, geminiApiKey);

  console.log("CONTEXT: Embedding generated:", embedding.length);

  const results = await searchContext(
    userId,
    chatId,
    embedding,
    limit,
  );

  console.log("CONTEXT: Retrieved results:", results);

  return results;
}