import mongoose from "mongoose";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Add it to .env.local (see docs/ENVIRONMENT.md).`);
    process.exit(1);
  }
  return value;
}

export function describeHost(uri: string): { host: string; isLocal: boolean } {
  const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, "");
  const afterCredentials = withoutScheme.includes("@") ? withoutScheme.split("@")[1]! : withoutScheme;
  const host = afterCredentials.split(/[/?]/)[0] ?? "";
  const isLocal = host.split(",").every((h) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(h));
  return { host: host.replace(/:[^,]*$/, ""), isLocal };
}

export async function connectScriptDatabase(uri: string) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, autoIndex: false });
  return mongoose.connection;
}

export function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

export function readOption(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}
