import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 16;

function deriveKey(): Buffer {
  const raw = process.env.STUDIO_INTEGRATIONS_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("STUDIO_INTEGRATIONS_ENCRYPTION_KEY_MISSING");
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return createHash("sha256").update(raw, "utf8").digest();
}

/** True when the server can encrypt/decrypt org provider secrets. */
export function isStudioIntegrationsEncryptionConfigured(): boolean {
  return Boolean(process.env.STUDIO_INTEGRATIONS_ENCRYPTION_KEY?.trim());
}

/**
 * Encrypt a UTF-8 secret for storage in `secret_ciphertext`.
 * Format: JSON { v, iv, ct, tag } (base64 fields).
 */
export function encryptProviderSecret(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    v: 1,
    iv: iv.toString("base64"),
    ct: enc.toString("base64"),
    tag: tag.toString("base64"),
  });
}

export function decryptProviderSecret(payload: string): string {
  const key = deriveKey();
  const parsed = JSON.parse(payload) as {
    v: number;
    iv: string;
    ct: string;
    tag: string;
  };
  if (parsed.v !== 1 || !parsed.iv || !parsed.ct || !parsed.tag) {
    throw new Error("STUDIO_INTEGRATIONS_CIPHER_INVALID");
  }
  const decipher = createDecipheriv(
    ALGO,
    key,
    Buffer.from(parsed.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(parsed.ct, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
