import {
	clientSchema,
	createClientSchema as createClientBodySchema,
	getClientByDniQuerySchema,
} from "@fixr/schemas/clients";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "./types";

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

const getClientByDniSchema: FastifySchema = {
	tags: ["Customers"],
	summary: "Find a customer by DNI",
	description: "Looks up a customer by DNI (digits only).",
	params: getCompanyNestedDataSchema,
	querystring: getClientByDniQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "get_client_success",
			message: "Customer retrieved successfully.",
			data: clientSchema,
		}).describe("Customer found."),
		403: forbidden,
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "client_not_found",
			message: "There's no customer with this DNI.",
			data: null,
		}).describe("No customer has this DNI."),
	},
	security: [{ JWT: [] }],
};

const createClientSchema: FastifySchema = {
	tags: ["Customers"],
	summary: "Create a customer",
	description:
		"Creates a walk-in customer (no login). Name, DNI and phone are required.",
	params: getCompanyNestedDataSchema,
	body: createClientBodySchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			code: "create_client_success",
			message: "Customer created successfully.",
			data: clientSchema,
		}).describe("Customer created."),
		403: forbidden,
		409: zodResponseSchema({
			status: 409,
			error: "Conflict",
			code: "client_dni_conflict",
			message: "A customer with this DNI already exists.",
			data: null,
		}).describe("DNI already registered."),
	},
	security: [{ JWT: [] }],
};

export const clientsDocs = {
	getClientByDniSchema,
	createClientSchema,
};
