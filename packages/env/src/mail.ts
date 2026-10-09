import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the mail package directory
config({ path: join(__dirname, "../../mail/.env") });

export const env = createEnv({
	server: {
		SMTP_HOST: z
			.string()
			.optional()
			.describe(
				"SMTP server, e.g. smtp.gmail.com. Unset: emails are only logged"
			),
		SMTP_PORT: z.coerce.number().int().positive().default(587),
		SMTP_SECURE: z
			.enum(["true", "false"])
			.default("false")
			.transform((value) => value === "true")
			.describe("true for port 465, false for 587 (STARTTLS)"),
		SMTP_USER: z.string().optional(),
		SMTP_PASSWORD: z.string().optional(),
		MAIL_FROM: z
			.string()
			.optional()
			.describe(
				'Sender, e.g. "Relojería <taller@gmail.com>". Defaults to SMTP_USER'
			),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
