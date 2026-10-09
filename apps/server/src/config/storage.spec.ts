import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "uploads-"));

vi.mock("@fixr/env/server", () => ({
	env: {
		JWT_SECRET: "s".repeat(32),
		PUBLIC_API_URL: "http://localhost:3333/",
		UPLOADS_DIR: dir,
		UPLOAD_URL_EXPIRES_IN: 600,
	},
}));

const storage = await import("./storage");

function grantFromUrl(url: string) {
	const parsed = new URL(url);
	const key = parsed.pathname.replace("/uploads/files/", "");
	const q = parsed.searchParams;
	return {
		grant: {
			key,
			contentType: q.get("ct") ?? "",
			size: Number(q.get("size")),
			expiresAt: Number(q.get("exp")),
		},
		sig: q.get("sig") ?? "",
	};
}

describe("storage", () => {
	const key = "companies/c1/service-orders/123-front.webp";

	it("builds upload links that verify", () => {
		const url = storage.buildUploadUrl({
			key,
			contentType: "image/webp",
			size: 42,
		});
		expect(url.startsWith("http://localhost:3333/uploads/files/")).toBe(true);
		const { grant, sig } = grantFromUrl(url);
		expect(grant.key).toBe(key);
		expect(storage.isValidUploadSignature(grant, sig)).toBe(true);
	});

	it("rejects a link whose size or type was changed", () => {
		const { grant, sig } = grantFromUrl(
			storage.buildUploadUrl({ key, contentType: "image/webp", size: 42 })
		);
		expect(storage.isValidUploadSignature({ ...grant, size: 43 }, sig)).toBe(
			false
		);
		expect(
			storage.isValidUploadSignature(
				{ ...grant, contentType: "text/html" },
				sig
			)
		).toBe(false);
	});

	it("refuses keys that leave the uploads folder", () => {
		expect(storage.resolveObjectPath("../etc/passwd")).toBeNull();
		expect(storage.resolveObjectPath("a/../../x")).toBeNull();
		expect(storage.resolveObjectPath(key)).toBe(join(dir, key));
	});

	it("writes and deletes files", async () => {
		await storage.writeObject(key, Buffer.from("hello"));
		expect(await readFile(join(dir, key), "utf8")).toBe("hello");
		await storage.deleteObject(key);
		await expect(readFile(join(dir, key))).rejects.toThrow();
	});

	it("serves files from the API's /files path", () => {
		expect(storage.buildObjectPublicUrl(key)).toBe(
			`http://localhost:3333/files/${key}`
		);
	});
});
