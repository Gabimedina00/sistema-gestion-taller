import type { watchBrandSchema } from "@fixr/schemas/models";
import type { ApiResponse } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";
import { api } from "../utils";
import { request } from "./request";

export type WatchBrand = z.infer<typeof watchBrandSchema>;

export function watchBrandsQueryKey(subdomain: string) {
	return ["watch-brands", subdomain];
}

export function listWatchBrands(subdomain: string) {
	return request(
		axios.get<ApiResponse<WatchBrand[]>>(
			api(`/companies/${subdomain}/makers/watch-brands`)
		)
	);
}

/** @description Adds a brand. If it already exists, the existing one comes back. */
export function createWatchBrand(subdomain: string, name: string) {
	return request(
		axios.post<ApiResponse<WatchBrand>>(
			api(`/companies/${subdomain}/makers/watch-brands`),
			{ name }
		)
	);
}
