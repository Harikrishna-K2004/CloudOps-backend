import { getModelToken } from "./modelTokenService";
import {
  getCachedCredential,
  setCachedCredential,
} from "./credentialCache";
import {
  getCachedModels,
  setCachedModels,
} from "./modelCache";
import { env } from "../config/env";

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

export async function getAvailableModels(
  userId: string,
  provider: string,
) {
  const cachedModels = getCachedModels(
    userId,
    provider,
  );

  if (cachedModels) {
    return {
      provider,
      models: cachedModels,
      cached: true,
    };
  }

  const apiKey = await getProviderCredential(
    userId,
    provider,
  );

  const response = await fetch(
    `${env.aiServerUrl}/api/models/${provider}`,
    {
      method: "GET",
      headers: {
        ...(apiKey
          ? {
              Authorization: `Bearer ${apiKey}`,
            }
          : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `AI server returned status ${response.status}`,
    );
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  setCachedModels(
    userId,
    provider,
    result.models,
  );

  return {
    ...result,
    cached: false,
  };
}