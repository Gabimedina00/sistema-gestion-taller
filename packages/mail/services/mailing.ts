import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { mailFrom, transport } from "../config/transport";
import { renderEmail as renderDeletionEmail } from "../emails/account-deletion";
import {
	type EmailProps as InviteEmailProps,
	renderEmail as renderInviteEmail,
} from "../emails/invite";
import { renderEmail as renderPasswordResetEmail } from "../emails/password-reset";
import { renderEmail as renderVerificationEmail } from "../emails/verification";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

interface EmailCommonProps {
	to: string;
	appName: string;
}

const sendEmail = async ({
	to,
	subject,
	html,
}: EmailCommonProps & {
	html: string;
	subject: string;
}) => {
	if (!transport) {
		console.log(
			`SMTP_HOST is not set, email to ${to} was not sent. Subject: ${subject}`
		);
		return null;
	}

	try {
		const info = await transport.sendMail({
			from: mailFrom,
			to,
			subject,
			html,
		});

		console.log(`Email sent to ${to}: ${info.messageId}`);
		return info;
	} catch (error) {
		console.error(`Failed to send email to ${to}:`, error);
		throw error;
	}
};

export const sendInviteEmail = async ({
	to,
	appName,
	...props
}: InviteEmailProps & EmailCommonProps) =>
	sendEmail({
		to,
		appName,
		subject: `Your access to ${appName}`,
		html: await renderInviteEmail({
			appName,
			...props,
		}),
	});

export const sendAccountVerificationEmail = async ({
	to,
	verificationUrl,
	displayName,
	appName,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
	sendEmail({
		to,
		appName,
		subject: `Verify your email, @${displayName}!`,
		html: await renderVerificationEmail({
			verificationUrl,
			displayName,
			appName,
		}),
	});

export const sendAccountDeletionEmail = async ({
	to,
	verificationUrl,
	displayName,
	appName,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
	sendEmail({
		to,
		appName,
		subject: `Confirm deleting your account, ${displayName}`,
		html: await renderDeletionEmail({ verificationUrl, displayName, appName }),
	});

export const sendPasswordResetEmail = async ({
	to,
	verificationUrl,
	displayName,
	appName,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
	sendEmail({
		to,
		appName,
		subject: `Reset your password, ${displayName}`,
		html: await renderPasswordResetEmail({
			verificationUrl,
			displayName,
			appName,
		}),
	});

// Extracts display name from an email
export const emailDisplayName = (email: string) => email.split("@")[0];

export const emails = {
	sendInviteEmail,
	sendAccountVerificationEmail,
	sendAccountDeletionEmail,
	sendPasswordResetEmail,
};
