import "server-only";
import os from "node:os";
import path from "node:path";

/**
 * Directory for the file-backed stores (orders, inboxes).
 *
 * - `DATA_DIR` env var wins (use a persistent volume on a Node host).
 * - On Vercel the project directory is read-only, so we fall back to the writable
 *   temp dir. That keeps checkout, contact and newsletter working, but data there is
 *   per-instance and ephemeral: configure webhooks and/or swap the order store for a
 *   database before relying on it in production (see README → Data & persistence).
 * - Otherwise `./.data` in the project.
 */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : process.env.VERCEL
    ? path.join(os.tmpdir(), "railroom-data")
    : path.join(process.cwd(), ".data");
