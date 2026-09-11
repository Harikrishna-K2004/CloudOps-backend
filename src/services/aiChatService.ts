import {
  getCachedCredential,
  setCachedCredential,
} from "./credentialCache";
import { getModelToken } from "./modelTokenService";
import {generateChatTitle, sendToAIServer,} from "./aiServerService";

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

export async function sendAIChat(
  userId: string,
  message: string,
  provider?: string,
  model?: string,
  tools?: string[],
) {
  const selectedProvider = provider ?? "ollama";

  const apiKey = await getProviderCredential(
    userId,
    selectedProvider,
  );

  return sendToAIServer({
    userId,
    message,
    provider: selectedProvider,
    model,
    tools,
    apiKey: apiKey ?? undefined,
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