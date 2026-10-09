"use client";

import { REPAIR_STATUSES } from "@fixr/constants/watches";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
	getStatusCounts,
	serviceOrdersQueryKey,
} from "@/lib/services/service-orders";
import { cn } from "@/lib/utils";

/** @description Statuses that need someone in the shop to act, shown first */
const NEEDS_ACTION = new Set(["pending", "diagnosing", "approved", "ready"]);

/**
 * @description One tile per status with how many watches are in it. Each tile
 * opens the orders list filtered by that status.
 */
export function StatusSummary({ subdomain }: { subdomain: string }) {
	const counts = useQuery({
		queryKey: [...serviceOrdersQueryKey(subdomain), "summary"],
		queryFn: async () => {
			const result = await getStatusCounts(subdomain);
			if (result.error !== null) {
				throw new Error(result.error);
			}
			return result.data;
		},
	});

	if (counts.isError) {
		return <p className="text-destructive text-sm">{counts.error.message}</p>;
	}

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{Object.values(REPAIR_STATUSES).map((status) => {
				const total = counts.data?.[status.id];
				return (
					<Link
						className={cn(
							"rounded-lg border p-4 transition-colors hover:border-primary/50",
							NEEDS_ACTION.has(status.id) && total ? "bg-primary/5" : ""
						)}
						href={`/dashboard/${subdomain}/service-orders?status=${status.id}`}
						key={status.id}
					>
						<p className="font-semibold text-3xl tabular-nums">
							{total ?? "…"}
						</p>
						<p className="text-muted-foreground text-sm">{status.label}</p>
					</Link>
				);
			})}
		</div>
	);
}
