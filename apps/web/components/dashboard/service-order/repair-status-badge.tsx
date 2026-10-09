import { REPAIR_STATUSES, type RepairStatus } from "@fixr/constants/watches";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<RepairStatus, string> = {
	pending: "bg-sky-600/20 text-sky-800 dark:text-sky-300",
	diagnosing: "bg-amber-600/20 text-amber-800 dark:text-amber-300",
	waiting_approval: "bg-yellow-600/25 text-yellow-800 dark:text-yellow-300",
	approved: "bg-indigo-600/20 text-indigo-800 dark:text-indigo-300",
	fixing: "bg-blue-600/20 text-blue-800 dark:text-blue-300",
	ready: "bg-emerald-600/25 text-emerald-800 dark:text-emerald-300",
	delivered: "bg-muted text-muted-foreground",
};

export function RepairStatusBadge({
	status,
	className,
}: {
	status: RepairStatus;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex w-fit items-center whitespace-nowrap rounded-md px-2 py-0.5 font-medium text-xs",
				STATUS_COLORS[status],
				className
			)}
		>
			{REPAIR_STATUSES[status].label}
		</span>
	);
}
