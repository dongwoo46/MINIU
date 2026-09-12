import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MiniuDb } from "./types";

const dataPath = path.join(process.cwd(), ".data", "miniu-db.json");

const emptyDb = (): MiniuDb => ({
  users: [],
  sessions: [],
  invitations: [],
  couples: [],
  preQuestions: [],
  minius: [],
  records: [],
  profileCards: [],
  chatUsages: [],
  events: [],
});

let writeQueue = Promise.resolve();

async function readDb(): Promise<MiniuDb> {
  try {
    const raw = await readFile(dataPath, "utf8");
    return { ...emptyDb(), ...JSON.parse(raw) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyDb();
    }
    throw error;
  }
}

async function writeDb(db: MiniuDb): Promise<void> {
  await mkdir(path.dirname(dataPath), { recursive: true });
  await writeFile(dataPath, JSON.stringify(db, null, 2), "utf8");
}

export async function getDb(): Promise<MiniuDb> {
  await writeQueue;
  return readDb();
}

export async function updateDb<T>(change: (db: MiniuDb) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await readDb();
    const result = await change(db);
    await writeDb(db);
    return result;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
