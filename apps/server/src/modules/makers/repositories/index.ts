import { and, asc, db, desc, eq, like, type SQL } from "@fixr/db/connection";
import { modelMakers } from "@fixr/db/schema";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

const NON_SLUG_CHARS_REGEX = /[^a-z0-9]+/g;
const EDGE_DASHES_REGEX = /^-+|-+$/g;

function watchBrandSlug(name: string) {
	const base = name
		.normalize("NFKD")
		.toLowerCase()
		.replace(NON_SLUG_CHARS_REGEX, "-")
		.replace(EDGE_DASHES_REGEX, "");
	return `watch-${base || "brand"}`;
}

/** @description Column selection for paginated makers list */
export const makersListSelect = {
	id: modelMakers.id,
	name: modelMakers.name,
	slug: modelMakers.slug,
	url: modelMakers.url,
	deviceCount: modelMakers.deviceCount,
	pageCount: modelMakers.pageCount,
	createdAt: modelMakers.createdAt,
};

/** @description Data access layer for device makers */
export class MakersRepository {
	/**
	 * Build a WHERE clause for filtering makers
	 *
	 * @param query - Optional name filter
	 */
	static buildListFilter(query?: string) {
		const conditions: SQL[] = [];
		if (query) {
			conditions.push(like(modelMakers.name, `%${query}%`));
		}
		return conditions.length > 0 ? and(...conditions) : undefined;
	}

	/**
	 * Build an ORDER BY clause for makers
	 *
	 * @param sort - Sort key: newer, older, name, most_devices
	 */
	static buildOrder(sort?: string) {
		switch (sort) {
			case "newer":
				return desc(modelMakers.createdAt);
			case "older":
				return asc(modelMakers.createdAt);
			case "most_devices":
				return desc(modelMakers.deviceCount);
			default:
				return asc(modelMakers.name);
		}
	}

	/**
	 * Find a maker by its slug
	 *
	 * @param slug - The maker slug
	 * @returns The maker record or null
	 */
	@Cached({ ttl: 3600, key: "makers:slug" })
	static async queryMakerBySlug(slug: string) {
		const [maker] = await db
			.select()
			.from(modelMakers)
			.where(eq(modelMakers.slug, slug))
			.limit(1);
		return maker ?? null;
	}

	/** @description All watch brands, sorted by name */
	@Cached({ ttl: 3600, key: "makers:watch-brands" })
	static async queryWatchBrands() {
		return await db
			.select({ id: modelMakers.id, name: modelMakers.name })
			.from(modelMakers)
			.where(eq(modelMakers.kind, "watch"))
			.orderBy(asc(modelMakers.name));
	}

	/**
	 * Find a watch brand by name. The column collation ignores case and accents,
	 * so "seiko" finds "Seiko".
	 */
	static async queryWatchBrandByName(name: string) {
		const [brand] = await db
			.select({ id: modelMakers.id, name: modelMakers.name })
			.from(modelMakers)
			.where(and(eq(modelMakers.kind, "watch"), eq(modelMakers.name, name)))
			.limit(1);
		return brand ?? null;
	}

	/** @description Add a watch brand the shop hadn't registered yet */
	@InvalidateCache({ patterns: ["makers:*"] })
	static async createWatchBrand(name: string) {
		const [created] = await db
			.insert(modelMakers)
			.values({ name, slug: watchBrandSlug(name), kind: "watch" })
			.$returningId();
		return { id: created.id, name };
	}
}
