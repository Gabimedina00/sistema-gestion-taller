import { modelMakerSelectSchema } from "@fixr/db/schema";
import {
	createWatchBrandSchema as createWatchBrandBodySchema,
	getModelMakerParamsSchema,
	getModelMakersQuerySchema,
	watchBrandSchema,
} from "@fixr/schemas/models";
import { paginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "../types";

const makerListRecordSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	url: z.string(),
	deviceCount: z.number(),
	pageCount: z.number().nullable(),
	createdAt: z.coerce.date(),
});

const listMakersSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "List model makers",
	description: `
**Retrieves device makers (brands) with pagination.**

Optional filters (query string):
- \`query\`: search by maker name
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\` | \`name\` | \`most_devices\`): pagination (see API pagination docs)
`,
	querystring: getModelMakersQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Makers successfully retrieved.",
			code: "list_makers_success",
			data: paginatedDataSchema(makerListRecordSchema),
		}).describe("Makers retrieved successfully."),
		416: zodResponseSchema({
			status: 416,
			error: "Range Not Satisfiable",
			code: "page_out_of_bounds",
			message: "The requested page exceeds the total number of pages.",
			data: null,
		}).describe("Requested page exceeds total pages."),
	},
	security: [{ JWT: [] }],
};

const getMakerBySlugSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "Get maker by slug",
	description: "Retrieves a single device maker by its slug.",
	params: getModelMakerParamsSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Maker retrieved successfully.",
			code: "get_maker_success",
			data: modelMakerSelectSchema,
		}).describe("Maker retrieved successfully."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "maker_not_found",
			message: "Maker not found.",
			data: null,
		}).describe("Maker not found."),
	},
	security: [{ JWT: [] }],
};

const listWatchBrandsSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "List watch brands",
	description: "All watch brands, sorted by name, for the repair order form.",
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "list_watch_brands_success",
			message: "Watch brands retrieved successfully.",
			data: z.array(watchBrandSchema),
		}).describe("Watch brands retrieved."),
	},
	security: [{ JWT: [] }],
};

const createWatchBrandSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "Add a watch brand",
	description:
		"Adds a watch brand that isn't in the list yet. If one with the same name exists (ignoring case and accents), it is returned with status 200 instead.",
	body: createWatchBrandBodySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "watch_brand_already_exists",
			message: "This watch brand was already registered.",
			data: watchBrandSchema,
		}).describe("The brand already existed."),
		201: zodResponseSchema({
			status: 201,
			error: null,
			code: "create_watch_brand_success",
			message: "Watch brand added successfully.",
			data: watchBrandSchema,
		}).describe("Brand added."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "missing_required_permissions",
			message: "You dont have the required permissions to perform this action",
			data: null,
		}).describe("The employee's role can't create repair orders."),
	},
	security: [{ JWT: [] }],
};

/** @description OpenAPI schemas for the makers module */
export const makersDocs = {
	listMakersSchema,
	getMakerBySlugSchema,
	listWatchBrandsSchema,
	createWatchBrandSchema,
};
