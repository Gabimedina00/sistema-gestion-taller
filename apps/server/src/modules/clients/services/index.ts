import type { jwtPayload } from "@fixr/schemas/auth";
import type { createClientSchema } from "@fixr/schemas/clients";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import { apiResponse } from "../../../core/lib/response";
import { ClientsRepository } from "../repositories";

function assertCompanyAccess(
	userJwt: z.infer<typeof jwtPayload>,
	subdomain: string
) {
	if (!userJwt.company) {
		throw new AppError("CLIENT_COMPANY_NOT_FOUND");
	}
	if (userJwt.company.subdomain !== subdomain) {
		throw new AppError("CLIENT_NOT_ALLOWED");
	}
}

/** @description Business logic for customers */
export class ClientsService {
	static async getClientByDni({
		userJwt,
		subdomain,
		dni,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		dni: string;
		response: FastifyReply;
	}) {
		assertCompanyAccess(userJwt, subdomain);

		const client = await ClientsRepository.queryClientByDni(dni);

		if (!client) {
			throw new AppError("CLIENT_NOT_FOUND");
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_client_success",
				message: "Customer retrieved successfully.",
				data: client,
			})
		);
	}

	static async createClient({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		data: z.infer<typeof createClientSchema>;
		response: FastifyReply;
	}) {
		assertCompanyAccess(userJwt, subdomain);

		const existing = await ClientsRepository.queryClientByDni(data.dni);

		if (existing) {
			throw new AppError("CLIENT_DNI_CONFLICT");
		}

		const client = await ClientsRepository.createClient(data);

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_client_success",
				message: "Customer created successfully.",
				data: client,
			})
		);
	}
}
