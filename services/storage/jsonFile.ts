import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./dataDir";

/**
 * Tiny JSON-file document store used when no database is configured (local
 * development, tests). Writes are serialised per file and atomic (temp + rename).
 */
const queues = new Map<string, Promise<unknown>>();

const fileFor = (name: string) => path.join(DATA_DIR, `${name}.json`);

export async function readJsonFile<T>(name: string, fallback: () => T): Promise<T> {
  await queues.get(name);
  try {
    return JSON.parse(await fs.readFile(fileFor(name), "utf8")) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback();
    throw err;
  }
}

async function writeJsonFile(name: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = fileFor(name);
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  // On Windows, renaming over a file that a concurrent request is reading fails with
  // EPERM/EBUSY/EACCES for a few milliseconds; retry briefly.
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.rename(tmp, file);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (attempt >= 8 || (code !== "EPERM" && code !== "EBUSY" && code !== "EACCES")) {
        await fs.rm(tmp, { force: true });
        throw err;
      }
      await new Promise((r) => setTimeout(r, 15 * (attempt + 1)));
    }
  }
}

/** Read–modify–write under a per-file lock. `fn` may throw to abort without writing. */
export function mutateJsonFile<T, R>(name: string, fallback: () => T, fn: (data: T) => { data: T; result: R }): Promise<R> {
  const previous = queues.get(name) ?? Promise.resolve();
  const run = previous.then(async () => {
    let current: T;
    try {
      current = JSON.parse(await fs.readFile(fileFor(name), "utf8")) as T;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      current = fallback();
    }
    const { data, result } = fn(current);
    await writeJsonFile(name, data);
    return result;
  });
  queues.set(
    name,
    run.catch(() => undefined),
  );
  return run;
}
