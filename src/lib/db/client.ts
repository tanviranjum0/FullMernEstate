import "server-only";
import { MongoClient } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";
import { getServerEnv } from "@/lib/env";

interface MongoGlobal {
  __mongoClient?: MongoClient;
  __mongoConnecting?: Promise<MongoClient>;
}

const globalForMongo = globalThis as typeof globalThis & MongoGlobal;

/**
 * One MongoClient per server instance, shared by Better Auth (native driver) and Mongoose
 * (via `setClient`), so each function instance holds a single connection pool.
 */
export function getMongoClient(): MongoClient {
  if (!globalForMongo.__mongoClient) {
    const client = new MongoClient(getServerEnv().MONGODB_URI, {
      appName: "tanvirdev-property",
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 8_000,
    });
    if (process.env.VERCEL) attachDatabasePool(client);
    globalForMongo.__mongoClient = client;
  }
  return globalForMongo.__mongoClient;
}

export function connectMongoClient(): Promise<MongoClient> {
  if (!globalForMongo.__mongoConnecting) {
    globalForMongo.__mongoConnecting = getMongoClient()
      .connect()
      .catch((error: unknown) => {
        globalForMongo.__mongoConnecting = undefined;
        throw error;
      });
  }
  return globalForMongo.__mongoConnecting;
}
