import { modelMakerSelectSchema } from "@fixr/db/schema";
import type { FastifyReply } from "fastify";
import { AppError } from "../../../core/lib/app-error";
import {
	getPaginatedCount,
	getPaginatedRecords,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import { MakersRepository, makersListSelect } from "../repositories";

/** @description Business logic for device makers */
export class MakersService {
	/**
	 * List makers with pagination, filtering, and sorting
	 *
	 * @param page - Current page number
	 * @param perPage - Items per page
	 * @param query - Optional name filter
	 * @param sort - Sort direction
	 * @param response - Fastify reply
	 */
	static async listMakers({
		page,
		perPage,
		query,
		sort,
		response,
	}: {
		page: number;
		perPage?: number;
		query?: string;
		sort?: string;
		response: FastifyReply;
	}) {
		const PER_PAGE = perPage ?? 10;

		const filter = MakersRepository.buildListFilter(query);
		const order = MakersRepository.buildOrder(sort);

		const [records, totalRecords] = await Promise.all([
			getPaginatedRecords({
				table: makersListSelect.id.table,
				select: makersListSelect,
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order,
			}),
			getPaginatedCount({
				table: makersListSelect.id.table,
				where: filter,
			}),
		]);

		if (totalRecords === 0) {
			return response.status(200).send(
				apiResponse({
					status: 200,
					error: null,
					message: "Makers successfully retrieved.",
					code: "list_makers_success",
					data: paginatedData({
						records: [],
						pagination: {
							total_records: 0,
							total_pages: 0,
							current_page: 1,
							next_page: null,
							prev_page: null,
						},
					}),
				})
			);
		}

		const total_pages = Math.ceil(totalRecords / PER_PAGE);

		if (page > total_pages) {
			throw new AppError("MAKER_PAGE_OUT_OF_BOUNDS");
		}

		const next_page =
			PER_PAGE * (page - 1) + records.length < totalRecords ? page + 1 : null;

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				message: "Makers successfully retrieved.",
				code: "list_makers_success",
				data: paginatedData({
					records,
					pagination: {
						total_records: totalRecords,
						total_pages,
						current_page: page,
						next_page,
						prev_page: page > 1 ? page - 1 : null,
					},
				}),
			})
		);
	}

	/**
	 * Get a maker by its slug
	 *
	 * @param slug - The maker slug
	 * @param response - Fastify reply
	 */
	static async getMakerBySlug({
		slug,
		response,
	}: {
		slug: string;
		response: FastifyReply;
	}) {
		const maker = await MakersRepository.queryMakerBySlug(slug);

		if (!maker) {
			throw new AppError("MAKER_NOT_FOUND");
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_maker_success",
				message: "Maker retrieved successfully.",
				data: modelMakerSelectSchema.parse(maker),
			})
		);
	}

	/** @description List the watch brands offered in the repair order form */
	static async listWatchBrands({ response }: { response: FastifyReply }) {
		const brands = await MakersRepository.queryWatchBrands();

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_watch_brands_success",
				message: "Watch brands retrieved successfully.",
				data: brands,
			})
		);
	}

	/**
	 * Add a watch brand. If one with the same name already exists (ignoring
	 * case and accents) it is returned instead of creating a duplicate.
	 */
	static async createWatchBrand({
		name,
		response,
	}: {
		name: string;
		response: FastifyReply;
	}) {
		const existing = await MakersRepository.queryWatchBrandByName(name);

		if (existing) {
			return response.status(200).send(
				apiResponse({
					status: 200,
					error: null,
					code: "watch_brand_already_exists",
					message: "This watch brand was already registered.",
					data: existing,
				})
			);
		}

		const brand = await MakersRepository.createWatchBrand(name);

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_watch_brand_success",
				message: "Watch brand added successfully.",
				data: brand,
			})
		);
	}
}
