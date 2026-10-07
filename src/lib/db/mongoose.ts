import "server-only";
import mongoose from "mongoose";
import { connectMongoClient } from "./client";

mongoose.set("strictQuery", true);
mongoose.set("autoIndex", process.env.NODE_ENV !== "production");

interface MongooseGlobal {
  __mongooseReady?: Promise<typeof mongoose>;
}

const globalForMongoose = globalThis as typeof globalThis & MongooseGlobal;

export function connectToDatabase(): Promise<typeof mongoose> {
  if (!globalForMongoose.__mongooseReady) {
    globalForMongoose.__mongooseReady = (async () => {
      const client = await connectMongoClient();
      if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) {
        mongoose.connection.setClient(client);
      }
      return mongoose;
    })().catch((error: unknown) => {
      globalForMongoose.__mongooseReady = undefined;
      throw error;
    });
  }
  return globalForMongoose.__mongooseReady;
}
