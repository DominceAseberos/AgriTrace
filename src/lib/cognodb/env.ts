import { z } from "zod";
import { DatabaseUnavailableError } from "./errors";

const envSchema = z.object({
  COGNODB_URI: z.string().min(1),
  COGNODB_USERNAME: z.string().min(1),
  COGNODB_PASSWORD: z.string().min(1),
});

export interface CognoDbEnv {
  uri: string;
  username: string;
  password: string;
}

export function getCognoDbEnv(): CognoDbEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new DatabaseUnavailableError("Database configuration is incomplete.");
  }

  return {
    uri: parsed.data.COGNODB_URI,
    username: parsed.data.COGNODB_USERNAME,
    password: parsed.data.COGNODB_PASSWORD,
  };
}
