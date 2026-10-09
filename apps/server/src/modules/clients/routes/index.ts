import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import {
	createClientSchema,
	getClientByDniQuerySchema,
} from "@fixr/schemas/clients";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import type { z } from "zod";
import { clientsDocs } from "../../../core/docs/clients.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { ClientsController } from "../controllers";

/** @description Customers routes plugin */
export function clientsRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.customers.read),
			],
			schema: clientsDocs.getClientByDniSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { dni } = getClientByDniQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ClientsController.getClientByDni({
				userJwt,
				subdomain,
				dni,
				response,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.customers.create),
			],
			schema: clientsDocs.createClientSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const data = await createClientSchema.parseAsync(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ClientsController.createClient({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);
}
