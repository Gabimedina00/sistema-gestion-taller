import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@fixr/env/server";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../lib/app-error";

function digest(value: string) {
	return createHash("sha256").update(value).digest();
}

/**
 * @description Guards one-off setup routes (e.g. creating the shop) with the
 * `SETUP_KEY` env var, sent as `Authorization: Bearer <SETUP_KEY>`.
 */
export function authenticateSetupKey(
	req: FastifyRequest,
	_res: FastifyReply
): Promise<void> {
	const authHeader = req.headers.authorization;

	// Hash both sides so the comparison is constant-time regardless of length
	const isValid =
		authHeader?.startsWith("Bearer ") === true &&
		timingSafeEqual(digest(authHeader.slice(7)), digest(env.SETUP_KEY));

	if (!isValid) {
		return Promise.reject(new AppError("AUTH_JWT_INVALID"));
	}

	return Promise.resolve();
}
