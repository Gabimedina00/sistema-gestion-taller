"use client";

import { MessageCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/hooks/use-session";
import type { ServiceOrderListItem } from "@/lib/services/service-orders";
import { orderRef, repairNotice, whatsappLink } from "@/lib/whatsapp";

type Order = ServiceOrderListItem & { warrantyDays?: number | null };

/**
 * @description Opens WhatsApp with a message for the customer that matches the
 * order's status (received, quote, ready...). Hidden when there's no phone.
 */
export function WhatsappNoticeButton({
	order,
	label = "Notify on WhatsApp",
	...props
}: { order: Order; label?: string } & Omit<
	ComponentProps<typeof Button>,
	"asChild" | "children"
>) {
	const { session } = useSession();

	if (!order.client.phone) {
		return null;
	}

	const message = repairNotice({
		status: order.status,
		customerName: order.client.name,
		watch: `${order.deviceMaker.name} ${order.deviceModel}`.trim(),
		orderRef: orderRef(order.id),
		shopName: session?.company?.name,
		estimatedCost: order.estimatedCost,
		readyBy: order.estimatedDeliveryDate,
		warrantyDays: order.warrantyDays,
	});

	return (
		<Button asChild {...props}>
			<a
				href={whatsappLink(order.client.phone, message)}
				onClick={(e) => e.stopPropagation()}
				rel="noopener noreferrer"
				target="_blank"
			>
				<MessageCircle className="size-4" />
				{label}
			</a>
		</Button>
	);
}
