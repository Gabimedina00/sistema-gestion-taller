import { WATCH_CATEGORY_SLUG } from "@fixr/constants/watches";
import type { createServiceOrderMockSchema } from "@fixr/schemas/service-orders";
import type { uploadPresignResponseSchema } from "@fixr/schemas/uploads";
import type { ApiResponse } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";
import { api } from "../utils";
import { request, type ServiceResult } from "./request";

interface Category {
	id: string;
	name: string;
	slug: string;
}
interface CreatedServiceOrder {
	id: string;
}

/** @description The "Watches" device category every watch order goes under */
export function getWatchCategory(subdomain: string) {
	return request(
		axios.get<ApiResponse<Category>>(
			api(`/companies/${subdomain}/categories/${WATCH_CATEGORY_SLUG}`)
		)
	);
}

/**
 * Stores one photo on the server and returns its upload id, to reference when
 * creating the order.
 */
export async function uploadServiceOrderPhoto(
	file: File
): Promise<ServiceResult<string>> {
	const contentType = file.type || "application/octet-stream";

	const presign = await request(
		axios.post<ApiResponse<z.infer<typeof uploadPresignResponseSchema>>>(
			api("/uploads/service-orders/presign"),
			{ fileName: file.name, contentType, size: file.size }
		)
	);

	if (presign.error !== null) {
		return presign;
	}

	const upload = await request(
		axios.put<ApiResponse<null>>(presign.data.uploadUrl, file, {
			headers: { "Content-Type": contentType },
		})
	);

	if (upload.error !== null) {
		return upload;
	}

	return { data: presign.data.id, error: null, status: upload.status };
}

export function createServiceOrder(
	subdomain: string,
	data: z.input<typeof createServiceOrderMockSchema>
) {
	return request(
		axios.post<ApiResponse<CreatedServiceOrder>>(
			api(`/companies/${subdomain}/service-orders`),
			data
		)
	);
}
