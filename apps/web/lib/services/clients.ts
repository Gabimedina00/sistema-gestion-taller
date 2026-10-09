import type { clientSchema, createClientSchema } from "@fixr/schemas/clients";
import type { ApiResponse } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";
import { api } from "../utils";
import { request } from "./request";

export type Client = z.infer<typeof clientSchema>;

/** @description Finds a customer by DNI (digits only). `data` is null when there's none. */
export async function findClientByDni(subdomain: string, dni: string) {
	const result = await request(
		axios.get<ApiResponse<Client>>(api(`/companies/${subdomain}/clients`), {
			params: { dni },
		})
	);

	if (result.status === 404) {
		return { data: null, error: null, status: 404 } as const;
	}

	return result;
}

export function createClient(
	subdomain: string,
	data: z.input<typeof createClientSchema>
) {
	return request(
		axios.post<ApiResponse<Client>>(
			api(`/companies/${subdomain}/clients`),
			data
		)
	);
}
