/**
 * Integration tests run against a dedicated, disposable database on a local MongoDB (the same
 * replica set used for development). They refuse to run against anything that is not local,
 * because every test file empties the collections it uses.
 */
export const TEST_MONGODB_URI =
  process.env.TEST_MONGODB_URI ?? "mongodb://localhost:27017/tanvirdev_property_test?replicaSet=rs0&directConnection=true";

export function assertLocalTestDatabase(uri: string): void {
  const host = uri.replace(/^mongodb(\+srv)?:\/\//, "").split("@").pop()!.split(/[/?]/)[0] ?? "";
  const local = host.split(",").every((h) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(h));
  const database = uri.replace(/^mongodb(\+srv)?:\/\/[^/]+\/?/, "").split("?")[0] ?? "";
  if (!local || !database.endsWith("_test")) {
    throw new Error(`Integration tests only run against a local database whose name ends in "_test" (got ${host}/${database}).`);
  }
}
