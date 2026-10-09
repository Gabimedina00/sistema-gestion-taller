import {
	serviceOrderImageSelectSchema,
	serviceOrderSelectSchema,
} from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createServiceOrderMockSchema,
	getServiceOrdersQuerySchema,
	serviceOrderDetailsSchema,
	serviceOrderParamsSchema,
	serviceOrderStatuses,
	updateServiceOrderStatusSchema,
} from "@fixr/schemas/service-orders";
import { paginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "./types";

const createServiceOrderResponseDataSchema = serviceOrderSelectSchema.extend({
	photos: z.array(serviceOrderImageSelectSchema),
});

const serviceOrderListRecordSchema = z.object({
	...serviceOrderSelectSchema.shape,
	client: z.object({
		id: z.string(),
		name: z.string(),
		dni: z.string(),
		phone: z.string().nullable(),
	}),
	employee: z.object({
		id: z.string(),
		name: z.string(),
	}),
	deviceCategory: z.object({
		id: z.string(),
		name: z.string(),
	}),
	deviceMaker: z.object({
		id: z.string(),
		name: z.string(),
	}),
});

const forbidden = z
	.union([
		zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to access this company.",
			data: null,
		}).describe("The account doesn't belong to this company."),
		zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "missing_required_permissions",
			message: "You dont have the required permissions to perform this action",
			data: null,
		}).describe("The employee's role can't do this."),
	])
	.describe("Not allowed.");

const notFound = z
	.union([
		zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "company_not_found",
			message: "There's no companies bound to your account",
			data: null,
		}),
		zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "service_order_not_found",
			message: "This service order doesn't exist.",
			data: null,
		}),
	])
	.describe("No company, or no such order in it.");

const getServiceOrderSchema: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Get a service order",
	description:
		"Everything about one order: customer, watch, intake, quote and photos.",
	params: serviceOrderParamsSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "get_service_order_success",
			message: "Service order retrieved successfully.",
			data: serviceOrderDetailsSchema,
		}).describe("Service order found."),
		403: forbidden,
		404: notFound,
	},
	security: [{ JWT: [] }],
};

const updateServiceOrderStatusDoc: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Change a service order's status",
	description: `Moves the order to another status: ${serviceOrderStatuses.options.join(", ")}.`,
	params: serviceOrderParamsSchema,
	body: updateServiceOrderStatusSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "update_service_order_status_success",
			message: "Service order status updated.",
			data: z.object({ id: z.string(), status: serviceOrderStatuses }),
		}).describe("Status changed."),
		403: forbidden,
		404: notFound,
	},
	security: [{ JWT: [] }],
};

const getCompanyServiceOrdersSchema: FastifySchema = {
	tags: ["Service Orders"],
	summary: "List service orders",
	description: `
**Retrieves company service orders (paginated)**

Optional filters (query string):
- \`deviceCategoryId\`: device category (cuid2)
- \`employeeId\`: responsible employee (cuid2)
- \`status\`: one of: ${serviceOrderStatuses.options.join(", ")}
- \`dateFrom\` / \`dateTo\`: filter by \`created_at\` (inclusive; ISO date or datetime)
- \`query\`: search in model, reference number, reported defect, brand, customer name or DNI
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\`): pagination (see API pagination docs)
`,
	params: getCompanyNestedDataSchema,
	querystring: getServiceOrdersQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Company service orders successfully retrieved.",
			code: "get_company_service_orders_success",
			data: paginatedDataSchema(serviceOrderListRecordSchema),
		}).describe("Service orders retrieved successfully."),
		416: zodResponseSchema({
			status: 416,
			error: "Range Not Satisfiable",
			code: "page_out_of_bounds",
			message: "The requested page exceeds the total number of pages.",
			data: null,
		}).describe("Requested page exceeds total pages."),
		403: forbidden,
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "company_not_found",
			message: "There's no companies bound to your account",
			data: null,
		}).describe("User is not associated with a company."),
	},
	security: [{ JWT: [] }],
};

const createServiceOrderSchemaDoc: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Create service order",
	description: `
**Creates a new service order for the authenticated company**

The \`company_id\` and \`employee_id\` are inferred from the authenticated employee session (\`req.user\`).
Photo uploads are assumed to have been completed beforehand via pre-signed URLs; this endpoint only persists metadata.

Rules:
- Only authenticated employees can create service orders.
- The \`subdomain\` in the URL must match the employee's company.
`,
	params: getCompanyNestedDataSchema,
	body: createServiceOrderMockSchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Service order created successfully.",
			code: "create_service_order_success",
			data: createServiceOrderResponseDataSchema,
		}).describe("Service order created successfully."),
		400: zodResponseSchema({
			status: 400,
			error: "Bad Request",
			code: "upload_not_found",
			message:
				"One or more uploads were not found or do not belong to this company.",
			data: null,
		}).describe("Upload was not found or does not belong to this company."),
		403: z
			.union([
				zodResponseSchema({
					status: 403,
					error: "Forbidden",
					code: "not_allowed",
					message: "You are not allowed to perform this action.",
					data: null,
				}),
				zodResponseSchema({
					status: 403,
					error: "Forbidden",
					code: "employee_not_found",
					message: "Employee profile not found for this account.",
					data: null,
				}),
			])
			.describe("User is not allowed to perform this action."),
		404: z
			.union([
				zodResponseSchema({
					status: 404,
					error: "Not Found",
					code: "company_not_found",
					message: "There's no companies bound to your account",
					data: null,
				}),
				zodResponseSchema({
					status: 404,
					error: "Not Found",
					code: "client_not_found",
					message: "Client not found.",
					data: null,
				}),
				zodResponseSchema({
					status: 404,
					error: "Not Found",
					code: "device_brand_not_found",
					message: "Device brand not found.",
					data: null,
				}),
				zodResponseSchema({
					status: 404,
					error: "Not Found",
					code: "device_category_not_found",
					message: "Device category not found.",
					data: null,
				}),
			])
			.describe("Referenced resource was not found."),
	},
	security: [{ JWT: [] }],
};

export const serviceOrdersDocs = {
	getCompanyServiceOrdersSchema,
	getServiceOrderSchema,
	updateServiceOrderStatusSchema: updateServiceOrderStatusDoc,
	createServiceOrderSchema: createServiceOrderSchemaDoc,
};
