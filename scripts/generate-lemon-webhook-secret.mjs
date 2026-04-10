#!/usr/bin/env node
/**
 * Prints a random secret suitable for Lemon Squeezy webhook "Signing secret"
 * (docs: typically 6–40 characters). Uses 40 hex chars from 20 random bytes.
 *
 * Usage: node scripts/generate-lemon-webhook-secret.mjs
 *
 * Copy the output into Lemon Squeezy → Webhooks → Signing secret,
 * and the same value into LEMON_SQUEEZY_WEBHOOK_SECRET (never commit).
 */
import crypto from "node:crypto";

process.stdout.write(`${crypto.randomBytes(20).toString("hex")}\n`);
