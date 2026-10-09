import type { FastifyReply, FastifyRequest } from "fastify";
import { describe, expect, it, vi } from "vitest";
import { authenticateSetupKey } from "./authenticate-setup-key";

vi.mock("@fixr/env/server", () => ({
	env: { SETUP_KEY: "a".repeat(32) },
}));

function requestWith(authorization?: string) {
	return { headers: { authorization } } as unknown as FastifyRequest;
}

const reply = {} as FastifyReply;

describe("authenticateSetupKey", () => {
	it("accepts the configured setup key", async () => {
		await expect(
			authenticateSetupKey(requestWith(`Bearer ${"a".repeat(32)}`), reply)
		).resolves.toBeUndefined();
	});

	it("rejects a wrong key", async () => {
		await expect(
			authenticateSetupKey(requestWith(`Bearer ${"b".repeat(32)}`), reply)
		).rejects.toMatchObject({ name: "AppError" });
	});

	it("rejects a missing header", async () => {
		await expect(
			authenticateSetupKey(requestWith(), reply)
		).rejects.toBeDefined();
	});
});
