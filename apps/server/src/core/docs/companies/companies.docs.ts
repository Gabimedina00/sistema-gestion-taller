import { companySelectSchema } from "@fixr/db/schema";
import {
	createCompanySchema,
	getCompanyBySubdomainSchema as getCompanyBySubdomainParamsSchema,
} from "@fixr/schemas/companies";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "../types";

const getUserCompanySchema: FastifySchema = {
	tags: ["Companies"],
	summary: "Get user company",
	description: "Retrieves user company",
	response: {
		404: zodResponseSchema({
			status: 404,
			error: null,
			code: "company_not_found",
			message: "Couldn't find any company you belong to.",
			data: null,
		}).describe("Couldn't find any company user belongs to."),
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "get_company_success",
			message: "Company retrieved successfully.",
			data: companySelectSchema,
		}).describe("Company retrieved successfully"),
	},
	security: [{ JWT: [] }],
};

const getCompanyBySubdomainSchema: FastifySchema = {
	tags: ["Companies"],
	summary: "Get company by subdomain",
	description:
		"Retrieves the specified company. The user can only retrieve companies it belongs to.",
	params: getCompanyBySubdomainParamsSchema,
	response: {
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to access this company.",
			data: null,
		}).describe("You are not allowed to access this company."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "company_not_found",
			message: "Company not found",
			data: null,
		}).describe("Couldn't find any company user belongs to."),
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "get_company_success",
			message: "Company retrieved successfully.",
			data: companySelectSchema,
		}).describe("Company retrieved successfully"),
	},
	security: [{ JWT: [] }],
};

const createCompanySchemaDoc: FastifySchema = {
	tags: ["Companies"],
	summary: "Create a new company",
	description:
		"Creates a new company with an admin user and sends an invite email. Restricted to whoever holds the server's SETUP_KEY, sent as a Bearer token.",
	body: createCompanySchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			code: "company_create_success",
			message: "Company created successfully.",
			data: null,
		}).describe("Company created successfully."),
		401: zodResponseSchema({
			status: 401,
			error: "Unauthorized",
			code: "auth_jwt_invalid",
			message: "Authorization token is invalid or expired.",
			data: null,
		}).describe("Missing or wrong setup key."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "missing_required_permissions",
			message: "You dont have the required permissions to perform this action",
			data: null,
		}).describe("User is not a platform admin."),
		409: z
			.union([
				zodResponseSchema({
					status: 409,
					error: "Conflict",
					code: "dni_conflict",
					message: "DNI is already registered.",
					data: null,
				}).describe("The owner's DNI is already registered."),
				zodResponseSchema({
					status: 409,
					error: "Conflict",
					code: "cuit_conflict",
					message: "CUIT is already registered.",
					data: null,
				}).describe("A shop with this CUIT already exists."),
				zodResponseSchema({
					status: 409,
					error: "Conflict",
					code: "email_already_exists",
					message: "Email is already used.",
					data: null,
				}).describe("The owner's email is already used."),
				zodResponseSchema({
					status: 409,
					error: "Conflict",
					code: "subdomain_taken",
					message: "Subdomain is already taken.",
					data: null,
				}).describe("The subdomain is already taken."),
			])
			.describe("Conflict with existing data."),
	},
	security: [{ JWT: [] }],
};

export const companiesDocs = {
	getUserCompanySchema,
	getCompanyByIdSchema: getCompanyBySubdomainSchema,
	createCompanySchema: createCompanySchemaDoc,
};
