import http from "node:http";
import https from "node:https";

import { env } from "../config/env";

interface EmbeddingResponse {
  embedding: number[];
}

export function generateContextEmbedding(
  text: string,
  geminiApiKey: string,
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const url = new URL(
      `${env.aiServerUrl}/api/context/embed`,
    );

    const payload = JSON.stringify({
      text,
      api_key: geminiApiKey,
    });

    const transport =
      url.protocol === "https:" ? https : http;

    const request = transport.request(
      {
        hostname: url.hostname,
        port:
          url.port ||
          (url.protocol === "https:" ? 443 : 80),
        path:
          `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let responseData = "";

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          responseData += chunk;
        });

        response.on("end", () => {
          let parsed: EmbeddingResponse | { detail?: string } | null =
            null;

          try {
            parsed = responseData
              ? JSON.parse(responseData)
              : null;
          } catch {
            parsed = null;
          }

          const status = response.statusCode ?? 500;

          if (status < 200 || status >= 300) {
            reject(
              new Error(
                (parsed as { detail?: string } | null)?.detail ??
                  `Embedding request failed (${status})`,
              ),
            );
            return;
          }

          if (
            !parsed ||
            !("embedding" in parsed) ||
            !Array.isArray(parsed.embedding)
          ) {
            reject(
              new Error(
                "AI server returned an invalid embedding",
              ),
            );
            return;
          }

          resolve(parsed.embedding);
        });
      },
    );

    request.setTimeout(60_000, () => {
      request.destroy(
        new Error(
          "Embedding request timed out",
        ),
      );
    });

    request.on("error", reject);

    request.write(payload);
    request.end();
  });
}