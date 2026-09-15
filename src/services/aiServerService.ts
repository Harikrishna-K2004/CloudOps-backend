import http from "node:http";
import https from "node:https";

import { env } from "../config/env";

const AI_REQUEST_TIMEOUT_MS = 45 * 60 * 1000;

export interface AIChatRequest {
  userId: string;
  message: string;
  provider?: string;
  model?: string;
  apiKey?: string;
  toolCredentials?: Record<string, Record<string, unknown>>;
  context?: Array<{
    content: string;
    similarity: number;
  }>;
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

function postJson<T>(
  urlString: string,
  payload: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);

    const data = JSON.stringify(payload);

    const isHttps = url.protocol === "https:";
    const transport = isHttps ? https : http;

    const request = transport.request(
      {
        hostname: url.hostname,
        port:
          url.port ||
          (isHttps ? 443 : 80),
        path:
          `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (response) => {
        let responseData = "";

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          responseData += chunk;
        });

        response.on("end", () => {
          let parsed: any = null;

          try {
            parsed = responseData
              ? JSON.parse(responseData)
              : null;
          } catch {
            parsed = null;
          }

          const status =
            response.statusCode ?? 500;

          if (status < 200 || status >= 300) {
            reject(
              new AIProviderError(
                parsed?.detail ||
                  parsed?.error ||
                  `AI server returned status ${status}`,
                status,
              ),
            );

            return;
          }

          resolve(parsed as T);
        });
      },
    );

    /**
     * Allow the AI server up to 45 minutes
     * to respond.
     *
     * This is a real Node HTTP request timeout,
     * not fetch's AbortSignal timeout.
     */
    request.setTimeout(
      AI_REQUEST_TIMEOUT_MS,
      () => {
        request.destroy(
          new Error(
            "AI server request timed out after 45 minutes",
          ),
        );
      },
    );

    request.on("error", (error) => {
      reject(error);
    });

    request.write(data);
    request.end();
  });
}

export async function sendToAIServer(
  request: AIChatRequest,
): Promise<AIChatResponse> {
  return postJson<AIChatResponse>(
    `${env.aiServerUrl}/api/chat`,
    {
      ...request,
      api_key: request.apiKey,
      tool_credentials:
        request.toolCredentials,
    },
  );
}

export async function generateChatTitle(
  request: AIChatRequest,
): Promise<{ title: string }> {
  return postJson<{ title: string }>(
    `${env.aiServerUrl}/api/title`,
    {
      ...request,
      api_key: request.apiKey,
    },
  );
}