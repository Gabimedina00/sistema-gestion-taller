import { env } from "@fixr/env/mail";
import { createTransport } from "nodemailer";

// Any regular mailbox works (Gmail with an app password, Outlook, the
// hosting's own mail). Without SMTP_HOST, emails are only printed to the logs.
export const transport = env.SMTP_HOST
	? createTransport({
			host: env.SMTP_HOST,
			port: env.SMTP_PORT,
			secure: env.SMTP_SECURE,
			auth: env.SMTP_USER
				? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
				: undefined,
		})
	: null;

export const mailFrom = env.MAIL_FROM ?? env.SMTP_USER;
