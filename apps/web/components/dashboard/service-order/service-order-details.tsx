"use client";

import {
	REPAIR_STATUSES,
	WATCH_ITEMS_RECEIVED,
	WATCH_MOVEMENT_TYPES,
	WATCH_SERVICES,
} from "@fixr/constants/watches";
import { permissions } from "@fixr/permissions";
import { createAbility } from "@fixr/permissions/accessor";
import { toast } from "@pheralb/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Camera,
	ClipboardList,
	Loader2,
	Receipt,
	User,
	Watch,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/hooks/use-session";
import {
	getServiceOrder,
	type ServiceOrderDetails as Order,
	type ServiceOrderStatus,
	serviceOrdersQueryKey,
	updateServiceOrderStatus,
} from "@/lib/services/service-orders";
import { orderRef } from "@/lib/whatsapp";
import { RepairStatusBadge } from "./repair-status-badge";
import { ServiceOrderDetailsCard } from "./service-order-details-card";
import { WhatsappNoticeButton } from "./whatsapp-notice-button";
import {
	ServiceOrderKeyValueItem as Item,
	ServiceOrderKeyValueList as List,
} from "./widgets/service-order-key-value";

const moneyFormat = new Intl.NumberFormat("es-AR", {
	style: "currency",
	currency: "ARS",
});
/** Ready-by dates have no time and are stored at UTC midnight */
const dateOnlyFormat = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "long",
	year: "numeric",
	timeZone: "UTC",
});
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "long",
	hour: "2-digit",
	minute: "2-digit",
});

function labels<T extends string>(
	ids: string[] | null,
	options: Record<T, { label: string }>
) {
	if (!ids || ids.length === 0) {
		return "—";
	}
	return ids
		.map(
			(id) => (options as Record<string, { label: string }>)[id]?.label ?? id
		)
		.join(", ");
}

function orNone(value: ReactNode) {
	return value === null || value === undefined || value === "" ? "—" : value;
}

export const serviceOrderQueryKey = (subdomain: string, id: string) => [
	...serviceOrdersQueryKey(subdomain),
	"details",
	id,
];

export function ServiceOrderDetails({
	subdomain,
	id,
}: {
	subdomain: string;
	id: string;
}) {
	const order = useQuery({
		queryKey: serviceOrderQueryKey(subdomain, id),
		queryFn: async () => {
			const result = await getServiceOrder(subdomain, id);
			if (result.error !== null) {
				throw new Error(result.error);
			}
			return result.data;
		},
	});

	if (order.isPending) {
		return (
			<p className="flex items-center gap-2 text-muted-foreground text-sm">
				<Loader2 className="size-4 animate-spin" /> Loading the order...
			</p>
		);
	}

	if (order.isError) {
		return <p className="text-destructive text-sm">{order.error.message}</p>;
	}

	return <OrderView order={order.data} subdomain={subdomain} />;
}

function OrderView({ order, subdomain }: { order: Order; subdomain: string }) {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<span className="font-medium font-mono">{orderRef(order.id)}</span>
						<RepairStatusBadge status={order.status} />
					</div>
					<p className="text-muted-foreground text-xs">
						Received {dateTimeFormat.format(order.createdAt)} by{" "}
						{order.employee.name}
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<StatusSelect order={order} subdomain={subdomain} />
					<WhatsappNoticeButton order={order} />
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<ServiceOrderDetailsCard icon={User} title="Customer">
					<List>
						<Item label="Name" value={order.client.name} />
						<Item label="DNI" value={order.client.dni} />
						<Item label="Phone" value={orNone(order.client.phone)} />
						<Item label="Email" value={orNone(order.client.email)} />
					</List>
				</ServiceOrderDetailsCard>

				<ServiceOrderDetailsCard icon={Watch} title="Watch">
					<List>
						<Item label="Brand" value={order.deviceMaker.name} />
						<Item label="Model" value={order.deviceModel} />
						<Item label="Reference" value={orNone(order.referenceNumber)} />
						<Item label="Serial" value={orNone(order.serialNumber)} />
						<Item
							label="Movement"
							value={
								order.movementType
									? WATCH_MOVEMENT_TYPES[order.movementType].label
									: "—"
							}
						/>
						<Item label="Caliber" value={orNone(order.caliber)} />
					</List>
				</ServiceOrderDetailsCard>

				<ServiceOrderDetailsCard icon={ClipboardList} title="Intake">
					<List>
						<Item
							label="Problem reported"
							stacked
							value={order.reportedDefect}
						/>
						<Item
							label="Services requested"
							stacked
							value={labels(order.requestedServices, WATCH_SERVICES)}
						/>
						<Item
							label="Condition when received"
							stacked
							value={orNone(order.intakeCondition)}
						/>
						<Item
							label="Left with the watch"
							stacked
							value={labels(order.itemsReceived, WATCH_ITEMS_RECEIVED)}
						/>
					</List>
				</ServiceOrderDetailsCard>

				<ServiceOrderDetailsCard icon={Receipt} title="Quote">
					<List>
						<Item
							label="Estimated cost"
							value={
								order.estimatedCost === null
									? "—"
									: moneyFormat.format(Number(order.estimatedCost))
							}
						/>
						<Item
							label="Ready by"
							value={
								order.estimatedDeliveryDate
									? dateOnlyFormat.format(order.estimatedDeliveryDate)
									: "—"
							}
						/>
						<Item
							label="Warranty"
							value={
								order.warrantyDays === null ? "—" : `${order.warrantyDays} days`
							}
						/>
						<Item
							label="Internal notes"
							stacked
							value={orNone(order.observations)}
						/>
					</List>
				</ServiceOrderDetailsCard>
			</div>

			<ServiceOrderDetailsCard icon={Camera} title="Photos">
				<PhotoGrid photos={order.photos} />
			</ServiceOrderDetailsCard>
		</div>
	);
}

function StatusSelect({
	order,
	subdomain,
}: {
	order: Order;
	subdomain: string;
}) {
	const { session } = useSession();
	const queryClient = useQueryClient();

	const canChangeStatus = session?.company
		? createAbility(session.company.role).can(
				permissions.serviceOrders.changeStatus
			)
		: false;

	const change = useMutation({
		mutationFn: async (status: ServiceOrderStatus) => {
			const result = await updateServiceOrderStatus(
				subdomain,
				order.id,
				status
			);
			if (result.error !== null) {
				throw new Error(result.error);
			}
			return result.data.status;
		},
		onSuccess: (status) => {
			queryClient.setQueryData<Order>(
				serviceOrderQueryKey(subdomain, order.id),
				(current) => (current ? { ...current, status } : current)
			);
			queryClient.invalidateQueries({
				queryKey: serviceOrdersQueryKey(subdomain),
			});
			toast.success({
				text: `Status changed to "${REPAIR_STATUSES[status].label}"`,
				description: order.client.phone
					? "Let the customer know with the WhatsApp button."
					: undefined,
			});
		},
		onError: (error) => {
			toast.error({
				text: "Couldn't change the status",
				description: error.message,
			});
		},
	});

	if (!canChangeStatus) {
		return null;
	}

	return (
		<Select
			disabled={change.isPending}
			onValueChange={(value) => change.mutate(value as ServiceOrderStatus)}
			value={order.status}
		>
			<SelectTrigger aria-label="Change status" className="sm:w-56">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{Object.values(REPAIR_STATUSES).map((status) => (
					<SelectItem key={status.id} value={status.id}>
						{status.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function PhotoGrid({ photos }: { photos: Order["photos"] }) {
	const [selected, setSelected] = useState<Order["photos"][number] | null>(
		null
	);

	if (photos.length === 0) {
		return (
			<p className="text-muted-foreground text-xs">No photos for this order.</p>
		);
	}

	return (
		<>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{photos.map((photo, index) => (
					<button
						className="cursor-pointer overflow-hidden rounded-lg border transition-colors hover:border-primary/50"
						key={photo.id}
						onClick={() => setSelected(photo)}
						type="button"
					>
						{/** biome-ignore lint/correctness/useImageSize: thumbnails fill the grid cell */}
						<img
							alt={photo.description ?? `Photo ${index + 1}`}
							className="aspect-square w-full object-cover"
							src={photo.url}
						/>
					</button>
				))}
			</div>
			<Dialog
				onOpenChange={(open) => {
					if (!open) {
						setSelected(null);
					}
				}}
				open={selected !== null}
			>
				<DialogContent className="max-w-3xl">
					<DialogTitle className="sr-only">Watch photo</DialogTitle>
					{selected && (
						// biome-ignore lint/correctness/useImageSize: shown at its own size
						<img
							alt={selected.description ?? "Watch photo"}
							className="max-h-[75vh] w-full rounded-lg object-contain"
							src={selected.url}
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
