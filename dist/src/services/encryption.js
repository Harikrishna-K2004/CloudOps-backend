"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSecret = encryptSecret;
exports.decryptSecret = decryptSecret;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const ALGORITHM = "aes-256-gcm";
function getKey() {
    if (!env_1.env.secretEncryptionKey) {
        throw new Error("SECRET_ENCRYPTION_KEY is not configured");
    }
    return Buffer.from(env_1.env.secretEncryptionKey, "base64");
}
function encryptSecret(value) {
    const key = getKey();
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
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
function decryptSecret(value) {
    const key = getKey();
    const [ivBase64, authTagBase64, encryptedBase64] = value.split(".");
    if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
        throw new Error("Invalid encrypted secret format");
    }
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, Buffer.from(ivBase64, "base64"));
    decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedBase64, "base64")),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}
