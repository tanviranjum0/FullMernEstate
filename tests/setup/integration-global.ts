import { MongoClient } from "mongodb";
import { assertLocalTestDatabase, TEST_MONGODB_URI } from "./test-database";

/** Starts every integration run from an empty test database. */
export default async function setup() {
  assertLocalTestDatabase(TEST_MONGODB_URI);
  const client = new MongoClient(TEST_MONGODB_URI, { serverSelectionTimeoutMS: 5_000 });
  try {
    await client.connect();
  } catch (error) {
    throw new Error(
      `Integration tests need a local MongoDB replica set (see docs/TESTING.md). Could not connect: ${(error as Error).message}`,
    );
  }
  await client.db().dropDatabase();
  await client.close();
}
