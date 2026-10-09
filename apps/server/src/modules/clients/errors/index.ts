import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the clients (customers) module */
export const clientsErrors = defineErrors({
	CLIENT_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	CLIENT_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	CLIENT_NOT_FOUND: {
		code: "client_not_found",
		message: "There's no customer with this DNI.",
		status: 404,
	},
	CLIENT_DNI_CONFLICT: {
		code: "client_dni_conflict",
		message: "A customer with this DNI already exists.",
		status: 409,
	},
});
