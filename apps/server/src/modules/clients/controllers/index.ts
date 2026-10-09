import type { jwtPayload } from "@fixr/schemas/auth";
import type { createClientSchema } from "@fixr/schemas/clients";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { ClientsService } from "../services";

/** @description Customers request handlers */
export class ClientsController {
	static getClientByDni(params: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		dni: string;
		response: FastifyReply;
	}) {
		return ClientsService.getClientByDni(params);
	}

	static createClient(params: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		data: z.infer<typeof createClientSchema>;
		response: FastifyReply;
	}) {
		return ClientsService.createClient(params);
	}
}
