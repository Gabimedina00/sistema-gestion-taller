import { permissions } from "@fixr/permissions";
import {
	createWatchBrandSchema,
	getModelMakerParamsSchema,
	getModelMakersQuerySchema,
} from "@fixr/schemas/models";
import { makersDocs } from "../../../core/docs/makers/makers.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { MakersController } from "../controllers";

/** @description Makers routes plugin */
export function makersRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.read),
			],
			schema: makersDocs.listMakersSchema,
		},
		withErrorHandler(async (request, response) => {
			const { query, sort, page, perPage } = getModelMakersQuerySchema.parse(
				request.query
			);

			await MakersController.listMakers({
				page,
				perPage,
				query,
				sort,
				response,
			});
		})
	);

	fastify.get(
		"/watch-brands",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.read),
			],
			schema: makersDocs.listWatchBrandsSchema,
		},
		withErrorHandler(async (_request, response) => {
			await MakersController.listWatchBrands({ response });
		})
	);

	fastify.post(
		"/watch-brands",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.serviceOrders.create),
			],
			schema: makersDocs.createWatchBrandSchema,
		},
		withErrorHandler(async (request, response) => {
			const { name } = createWatchBrandSchema.parse(request.body);

			await MakersController.createWatchBrand({ name, response });
		})
	);

	fastify.get(
		"/:slug",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.read),
			],
			schema: makersDocs.getMakerBySlugSchema,
		},
		withErrorHandler(async (request, response) => {
			const { slug } = getModelMakerParamsSchema.parse(request.params);

			await MakersController.getMakerBySlug({ slug, response });
		})
	);
}
