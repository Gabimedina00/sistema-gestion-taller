import {
	createUploadPresignSchema,
	uploadFileQuerySchema,
	uploadPresignResponseSchema,
} from "@fixr/schemas/uploads";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "./types";

const createPresignSchema: FastifySchema = {
	tags: ["Uploads"],
	summary: "Generate pre-signed upload URL",
	description: `**Generate a signed PUT URL for uploading a file to this server**

Send the file to \`uploadUrl\` with \`PUT\`, using the same \`Content-Type\` and exact size given here. Once uploaded it is served at \`url\`.

Supports three purposes controlled by the path parameter:

- \`avatar\` - user profile picture. Deterministic key, no DB record. Call \`PUT /account/avatar\` after uploading.
- \`service-orders\` - service order images. Creates a pending upload record, reference the returned \`id\` when creating the service order.
- \`models\` - model images. Creates a pending upload record, reference the returned \`id\` when assigning to a model.
`,
	params: z.object({
		purpose: z.enum(["avatar", "service-orders", "models"]),
	}),
	body: createUploadPresignSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Upload URL generated successfully.",
			code: "create_avatar_presign_success",
			data: uploadPresignResponseSchema,
		})
			.extend({
				// One code per purpose: avatar, service-orders, models
				code: z.enum([
					"create_avatar_presign_success",
					"create_upload_presign_success",
					"create_model_image_presign_success",
				]),
			})
			.describe("Presigned upload URL generated."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to perform this action.",
			data: null,
		}).describe("Forbidden."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "company_not_found",
			message: "There's no company associated with this account.",
			data: null,
		}).describe("Company not found."),
	},
	security: [{ JWT: [] }],
};

const uploadFileSchema: FastifySchema = {
	tags: ["Uploads"],
	summary: "Upload a file to a signed link",
	description:
		"Receives the raw file for an `uploadUrl` returned by the presign endpoint. No session is needed: the link's signature allows exactly one key, content type and size until it expires.",
	params: z.object({ "*": z.string().describe("Storage key") }),
	querystring: uploadFileQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "File uploaded successfully.",
			code: "upload_file_success",
			data: null,
		}).describe("File stored."),
		400: zodResponseSchema({
			status: 400,
			error: "Bad Request",
			code: "upload_content_mismatch",
			message:
				"The file doesn't match the type or size the upload link was issued for.",
			data: null,
		}).describe("Wrong content type or size."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "upload_link_invalid",
			message: "This upload link is invalid or has expired.",
			data: null,
		}).describe("Bad signature or expired link."),
	},
};

export const uploadsDocs = {
	createPresignSchema,
	uploadFileSchema,
};
