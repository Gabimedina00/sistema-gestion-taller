import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { env } from "@fixr/env/server";
import {
	buildObjectPublicUrl as _buildObjectPublicUrl,
	isAllowedCompanyPhotoUrl as _isAllowedCompanyPhotoUrl,
} from "../core/lib/storage-keys";

export {
	buildAvatarObjectKey,
	buildModelObjectKey,
	buildUploadObjectKey,
	sanitizeUploadFileName,
} from "../core/lib/storage-keys";

/** Files are kept on the server's own disk, under this folder */
export const uploadsDir = resolve(env.UPLOADS_DIR);
mkdirSync(uploadsDir, { recursive: true });

const publicApiUrl = env.PUBLIC_API_URL.replace(/\/$/, "");

/** Stored files are served by the API under `/files/` */
export const filesPublicBaseUrl = `${publicApiUrl}/files`;
export const uploadUrlExpiresIn = env.UPLOAD_URL_EXPIRES_IN;

// Separate key so upload URLs can't be confused with session tokens
const signingKey = createHmac("sha256", env.JWT_SECRET)
	.update("uploads")
	.digest();

export function buildObjectPublicUrl(key: string) {
	return _buildObjectPublicUrl(filesPublicBaseUrl, key);
}

export function isAllowedCompanyPhotoUrl(url: string, companyId: string) {
	return _isAllowedCompanyPhotoUrl(filesPublicBaseUrl, url, companyId);
}

export interface UploadGrant {
	key: string;
	contentType: string;
	size: number;
	expiresAt: number;
}

function sign({ key, contentType, size, expiresAt }: UploadGrant) {
	return createHmac("sha256", signingKey)
		.update([key, contentType, size, expiresAt].join("\n"))
		.digest("base64url");
}

/**
 * Build a one-time PUT URL that lets the browser upload exactly this file
 * (same key, content type and size) until the URL expires.
 */
export function buildUploadUrl({
	key,
	contentType,
	size,
}: Omit<UploadGrant, "expiresAt">) {
	const expiresAt = Math.floor(Date.now() / 1000) + uploadUrlExpiresIn;
	const query = new URLSearchParams({
		ct: contentType,
		size: String(size),
		exp: String(expiresAt),
		sig: sign({ key, contentType, size, expiresAt }),
	});

	return `${publicApiUrl}/uploads/files/${key}?${query}`;
}

export function isValidUploadSignature(grant: UploadGrant, signature: string) {
	const expected = Buffer.from(sign(grant));
	const received = Buffer.from(signature);
	return (
		expected.length === received.length && timingSafeEqual(expected, received)
	);
}

/**
 * Resolve a storage key to a path inside `uploadsDir`, refusing keys that
 * would escape it (e.g. `../`).
 */
export function resolveObjectPath(key: string): string | null {
	const path = resolve(uploadsDir, key);
	return path.startsWith(`${uploadsDir}${sep}`) ? path : null;
}

export async function writeObject(key: string, body: Buffer) {
	const path = resolveObjectPath(key);
	if (!path) {
		throw new Error(`Invalid storage key: ${key}`);
	}
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, body);
}

export async function deleteObject(key: string) {
	const path = resolveObjectPath(key);
	if (path) {
		await rm(path, { force: true });
	}
}
