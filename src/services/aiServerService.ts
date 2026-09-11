import { env } from "../config/env";

export interface AIChatRequest {
  userId: string;
  message: string;
  provider?: string;
  model?: string;
  apiKey?: string;
  tools?: string[];
}

export interface AIChatResponse {
  response: string;
}

export class AIProviderError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AIProviderError";
    this.status = status;
  }
}

export async function sendToAIServer(
  request: AIChatRequest,
): Promise<AIChatResponse> {
  const response = await fetch(
    `${env.aiServerUrl}/api/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...request,
        api_key: request.apiKey,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new AIProviderError(
      errorBody?.detail ||
        errorBody?.error ||
        `AI server returned status ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<AIChatResponse>;
}


export async function generateChatTitle(
  request: AIChatRequest,
): Promise<{ title: string }> {
  const response = await fetch(
    `${env.aiServerUrl}/api/title`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...request,
        api_key: request.apiKey,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new AIProviderError(
      errorBody?.detail ||
        errorBody?.error ||
        `AI server returned status ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<{ title: string }>;
}