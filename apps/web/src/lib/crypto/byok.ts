// Encrypts BYOK provider API keys at rest (PRD §8.5). AES-256-GCM with a
// server-only key (BYOK_ENCRYPTION_KEY) that never reaches Postgres or the
// client — only this module ever sees a decrypted key.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const secret = process.env.BYOK_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('BYOK_ENCRYPTION_KEY is not set')
  }
  const key = Buffer.from(secret, 'hex')
  if (key.length !== 32) {
    throw new Error('BYOK_ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
  }
  return key
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64')
}

export function decryptSecret(encoded: string): string {
  const raw = Buffer.from(encoded, 'base64')
  const iv = raw.subarray(0, IV_LENGTH)
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8')
}
