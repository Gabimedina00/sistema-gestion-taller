import { WATCH_CATEGORY_SLUG } from "@fixr/constants/watches";
import {
	type createServiceOrderMockSchema,
	serviceOrderDetailsSchema,
	serviceOrderListItemSchema,
	type serviceOrderStatuses,
	type updateServiceOrderSchema,
} from "@fixr/schemas/service-orders";
import type { uploadPresignResponseSchema } from "@fixr/schemas/uploads";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
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

export type ServiceOrderListItem = z.infer<typeof serviceOrderListItemSchema>;
export type ServiceOrderDetails = z.infer<typeof serviceOrderDetailsSchema>;
export type ServiceOrderStatus = z.infer<typeof serviceOrderStatuses>;

export const serviceOrdersQueryKey = (subdomain: string) => [
	"service-orders",
	subdomain,
];

export async function listServiceOrders(
	subdomain: string,
	params: { page: number; query?: string; status?: ServiceOrderStatus }
): Promise<ServiceResult<PaginatedData<ServiceOrderListItem>>> {
	const result = await request(
		axios.get<ApiResponse<PaginatedData<unknown>>>(
			api(`/companies/${subdomain}/service-orders`),
			{ params: { ...params, perPage: 20, query: params.query || undefined } }
		)
	);
	if (result.error !== null) {
		return result;
	}
	// Parsing turns the JSON date strings into Date objects
	const records = result.data.records.map((record) =>
		serviceOrderListItemSchema.parse(record)
	);
	return { ...result, data: { ...result.data, records } };
}

export async function getServiceOrder(
	subdomain: string,
	id: string
): Promise<ServiceResult<ServiceOrderDetails>> {
	const result = await request(
		axios.get<ApiResponse<unknown>>(
			api(`/companies/${subdomain}/service-orders/${id}`)
		)
	);
	if (result.error !== null) {
		return result;
	}
	return { ...result, data: serviceOrderDetailsSchema.parse(result.data) };
}

export function updateServiceOrderStatus(
	subdomain: string,
	id: string,
	status: ServiceOrderStatus
) {
	return request(
		axios.patch<ApiResponse<{ id: string; status: ServiceOrderStatus }>>(
			api(`/companies/${subdomain}/service-orders/${id}/status`),
			{ status }
		)
	);
}

export type ServiceOrderUpdate = Omit<
	z.input<typeof updateServiceOrderSchema>,
	"estimatedDeliveryDate"
> & {
	/** YYYY-MM-DD */
	estimatedDeliveryDate?: string | null;
};

export function updateServiceOrder(
	subdomain: string,
	id: string,
	data: ServiceOrderUpdate
) {
	return request(
		axios.patch<ApiResponse<{ id: string }>>(
			api(`/companies/${subdomain}/service-orders/${id}`),
			data
		)
	);
}

export function getStatusCounts(subdomain: string) {
	return request(
		axios.get<ApiResponse<Record<ServiceOrderStatus, number>>>(
			api(`/companies/${subdomain}/service-orders/summary`)
		)
	);
}
