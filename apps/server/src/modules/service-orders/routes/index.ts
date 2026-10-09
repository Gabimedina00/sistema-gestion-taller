import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createServiceOrderMockSchema,
	getServiceOrdersQuerySchema,
	serviceOrderParamsSchema,
	updateServiceOrderStatusSchema,
} from "@fixr/schemas/service-orders";
import type { z } from "zod";
import { serviceOrdersDocs } from "../../../core/docs/service-orders.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { ServiceOrdersController } from "../controllers";

/** @description Service orders routes plugin */
export function serviceOrdersRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.serviceOrders.read),
			],
			schema: serviceOrdersDocs.getCompanyServiceOrdersSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const query = getServiceOrdersQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ServiceOrdersController.getCompanyServiceOrders({
				userJwt,
				subdomain,
				response,
				...query,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.serviceOrders.create),
			],
			schema: serviceOrdersDocs.createServiceOrderSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const body = await createServiceOrderMockSchema.parseAsync(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ServiceOrdersController.createServiceOrder({
				userJwt,
				data: body,
				subdomain,
				response,
			});
		})
	);

	fastify.get(
		"/:id",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.serviceOrders.read),
			],
			schema: serviceOrdersDocs.getServiceOrderSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain, id } = serviceOrderParamsSchema.parse(request.params);

			await ServiceOrdersController.getServiceOrder({
				userJwt,
				subdomain,
				id,
				response,
			});
		})
	);

	fastify.patch(
		"/:id/status",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.serviceOrders.changeStatus),
			],
			schema: serviceOrdersDocs.updateServiceOrderStatusSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain, id } = serviceOrderParamsSchema.parse(request.params);
			const { status } = updateServiceOrderStatusSchema.parse(request.body);

			await ServiceOrdersController.updateServiceOrderStatus({
				userJwt,
				subdomain,
				id,
				status,
				response,
			});
		})
	);
}
