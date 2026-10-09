import type { ApiResponse } from "@fixr/schemas/utils";
import { AxiosError, type AxiosResponse } from "axios";
import { tryCatch } from "../utils";

export type ServiceResult<T> =
	| { data: T; error: null; status: number }
	| { data: null; error: string; status: number | null };

/**
 * Runs an API call and turns the response into data or a readable error
 * message, so components don't need to unpack Axios errors.
 */
export async function request<T>(
	call: Promise<AxiosResponse<ApiResponse<T>>>
): Promise<ServiceResult<T>> {
	const { data: response, error } = await tryCatch(call);

	if (error) {
		if (error instanceof AxiosError && error.response) {
			const body = error.response.data as Partial<ApiResponse> | undefined;
			return {
				data: null,
				error: body?.message ?? "Something went wrong.",
				status: error.response.status,
			};
		}
		return {
			data: null,
			error: "Couldn't reach the server. Check the connection.",
			status: null,
		};
	}

	return {
		data: response.data.data as T,
		error: null,
		status: response.status,
	};
}
