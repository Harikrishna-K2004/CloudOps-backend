import {
  getCachedCredential,
  setCachedCredential,
} from "./credentialCache";
import { getModelToken } from "./modelTokenService";
import {
  getUserToolConnections,
} from "./toolConnectionService";
import {
  generateChatTitle,
  sendToAIServer,
} from "./aiServerService";
import {
  retrieveContext,
} from "./contextRetrievalService";


async function getProviderCredential(
  userId: string,
  provider: string,
): Promise<string | null> {
  if (provider === "ollama") {
    return null;
  }

  const cachedCredential = getCachedCredential(
    userId,
    provider,
  );

  if (cachedCredential) {
    return cachedCredential;
  }

  const apiKey = await getModelToken(
    userId,
    provider,
  );

  if (!apiKey) {
    throw new Error(
      `No API key configured for provider: ${provider}`,
    );
  }

  setCachedCredential(
    userId,
    provider,
    apiKey,
  );

  return apiKey;
}

async function getToolCredentials(
  userId: string,
) {
  const connections =
    await getUserToolConnections(userId);

  const credentials: Record<
    string,
    Record<string, unknown>
  > = {};

  for (const connection of connections) {
    if (!connection.providerId) {
      continue;
    }

    credentials[connection.providerId] =
      connection.credentials;
  }

  return credentials;
}

export async function sendAIChat(
  userId: string,
  message: string,
  provider?: string,
  model?: string,
  tools?: string[],
  chatId?: string,
) {
  const selectedProvider = provider ?? "ollama";

  const apiKey = await getProviderCredential(
    userId,
    selectedProvider,
  );

  const toolCredentials =
    await getToolCredentials(userId);

  console.log("AI CHAT chatId:", chatId);
  console.log("AI CHAT message:", message);

  const context = chatId
    ? await retrieveContext(userId, chatId, message)
    : [];

  console.log("AI CHAT context count:", context.length);

  return sendToAIServer({
    userId,
    message,
    provider: selectedProvider,
    model,
    apiKey: apiKey ?? undefined,
    toolCredentials,
    context,
  });
}

export async function generateAIChatTitle(
  userId: string,
  message: string,
  provider?: string,
  model?: string,
) {
  const selectedProvider = provider ?? "ollama";

  const apiKey = await getProviderCredential(
    userId,
    selectedProvider,
  );

  return generateChatTitle({
    userId,
    message,
    provider: selectedProvider,
    model,
    apiKey: apiKey ?? undefined,
  });
}