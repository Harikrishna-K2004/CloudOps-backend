import crypto from "crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  if (!env.secretEncryptionKey) {
    throw new Error(
      "SECRET_ENCRYPTION_KEY is not configured",
    );
  }

  return Buffer.from(env.secretEncryptionKey, "base64");
}

export function encryptSecret(value: string): string {
  const key = getKey();

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptSecret(value: string): string {
  const key = getKey();

  const [ivBase64, authTagBase64, encryptedBase64] =
    value.split(".");

  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Invalid encrypted secret format");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivBase64, "base64"),
  );

  decipher.setAuthTag(
    Buffer.from(authTagBase64, "base64"),
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(encryptedBase64, "base64"),
    ),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}