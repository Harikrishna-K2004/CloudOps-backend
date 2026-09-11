import { env } from "../config/env";

export async function getAIProviders() {
  const response = await fetch(
    `${env.aiServerUrl}/api/providers`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(
      errorBody?.detail ||
        errorBody?.error ||
        `AI server returned status ${response.status}`,
    );
  }

  return response.json();
}