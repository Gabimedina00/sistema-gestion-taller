"use client";

import { REPAIR_STATUSES } from "@fixr/constants/watches";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	listServiceOrders,
	type ServiceOrderStatus,
	serviceOrdersQueryKey,
} from "@/lib/services/service-orders";
import { orderRef } from "@/lib/whatsapp";
import { DashLink } from "../dash-link";
import { RepairStatusBadge } from "../repair-status-badge";
import { WhatsappNoticeButton } from "../whatsapp-notice-button";

const ALL_STATUSES = "all";
const SEARCH_DELAY_MS = 300;

const dayFormat = new Intl.DateTimeFormat("en-GB", {
	day: "2-digit",
	month: "short",
});
/** Ready-by dates have no time and are stored at UTC midnight */
const dateOnlyFormat = new Intl.DateTimeFormat("en-GB", {
	day: "2-digit",
	month: "short",
	timeZone: "UTC",
});

function useDebounced<T>(value: T, delay: number) {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
}

export function ServiceOrdersTable({ subdomain }: { subdomain: string }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	// The home page links here with ?status=ready and so on
	const [status, setStatus] = useState<ServiceOrderStatus | undefined>(() => {
		const fromUrl = searchParams.get("status");
		return fromUrl && fromUrl in REPAIR_STATUSES
			? (fromUrl as ServiceOrderStatus)
			: undefined;
	});
	const query = useDebounced(search.trim(), SEARCH_DELAY_MS);

	const orders = useQuery({
		queryKey: [...serviceOrdersQueryKey(subdomain), { page, query, status }],
		queryFn: async () => {
			const result = await listServiceOrders(subdomain, {
				page,
				query,
				status,
			});
			if (result.error !== null) {
				throw new Error(result.error);
			}
			return result.data;
		},
		placeholderData: keepPreviousData,
	});

	const records = orders.data?.records ?? [];
	const pagination = orders.data?.pagination;

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
					<Input
						className="sm:max-w-sm"
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						placeholder="Search by customer, DNI, brand or model..."
						value={search}
					/>
					<Select
						onValueChange={(value) => {
							setStatus(
								value === ALL_STATUSES
									? undefined
									: (value as ServiceOrderStatus)
							);
							setPage(1);
						}}
						value={status ?? ALL_STATUSES}
					>
						<SelectTrigger className="sm:w-52">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
							{Object.values(REPAIR_STATUSES).map((item) => (
								<SelectItem key={item.id} value={item.id}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{orders.isFetching && (
						<Loader2 className="size-4 animate-spin text-muted-foreground" />
					)}
				</div>
				<Button asChild className="shrink-0">
					<DashLink href="/service-orders/new" prefetch subdomain={subdomain}>
						New repair order <Plus className="size-3.5" />
					</DashLink>
				</Button>
			</div>

			<div className="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Order</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Watch</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Ready by</TableHead>
							<TableHead className="text-right">Notify</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{records.map((order) => (
							<TableRow
								className="cursor-pointer"
								key={order.id}
								onClick={() =>
									router.push(
										`/dashboard/${subdomain}/service-orders/${order.id}`
									)
								}
							>
								<TableCell>
									<div className="font-medium font-mono">
										{orderRef(order.id)}
									</div>
									<div className="text-muted-foreground text-xs">
										{dayFormat.format(order.createdAt)}
									</div>
								</TableCell>
								<TableCell>
									<div className="font-medium">{order.client.name}</div>
									<div className="text-muted-foreground text-xs">
										DNI {order.client.dni}
									</div>
								</TableCell>
								<TableCell>
									<div className="font-medium">{order.deviceMaker.name}</div>
									<div className="text-muted-foreground text-xs">
										{order.deviceModel}
									</div>
								</TableCell>
								<TableCell>
									<RepairStatusBadge status={order.status} />
								</TableCell>
								<TableCell>
									{order.estimatedDeliveryDate
										? dateOnlyFormat.format(order.estimatedDeliveryDate)
										: "—"}
								</TableCell>
								<TableCell className="text-right">
									<WhatsappNoticeButton
										label="WhatsApp"
										order={order}
										size="sm"
										variant="outline"
									/>
								</TableCell>
							</TableRow>
						))}
						{records.length === 0 && (
							<TableRow>
								<TableCell
									className="h-24 text-center text-muted-foreground"
									colSpan={6}
								>
									<EmptyMessage
										error={orders.error?.message}
										filtered={Boolean(query || status)}
										loading={orders.isPending}
									/>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{pagination && pagination.total_pages > 1 && (
				<div className="flex items-center justify-end gap-2 text-sm">
					<span className="text-muted-foreground">
						Page {pagination.current_page} of {pagination.total_pages}
					</span>
					<Button
						aria-label="Previous page"
						disabled={!pagination.prev_page}
						onClick={() => setPage((current) => current - 1)}
						size="icon"
						variant="outline"
					>
						<ChevronLeft className="size-4" />
					</Button>
					<Button
						aria-label="Next page"
						disabled={!pagination.next_page}
						onClick={() => setPage((current) => current + 1)}
						size="icon"
						variant="outline"
					>
						<ChevronRight className="size-4" />
					</Button>
				</div>
			)}
		</div>
	);
}

function EmptyMessage({
	loading,
	error,
	filtered,
}: {
	loading: boolean;
	error: string | undefined;
	filtered: boolean;
}) {
	if (loading) {
		return "Loading orders...";
	}
	if (error) {
		return error;
	}
	return filtered
		? "No orders match the search."
		: "No repair orders yet. Add the first one with New repair order.";
}
