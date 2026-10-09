import { permissions } from "@fixr/permissions/permissions";
import type { SidebarSection } from "./types";

// Only pages that exist. Add an entry here when its page is built.
export const sidebarSections: readonly SidebarSection[] = [
	{
		title: "Shop",
		items: [
			{
				id: "home",
				label: "Home",
				href: "/home",
				type: "route",
				icon: "Home",
				permission: permissions.serviceOrders.read,
			},
			{
				id: "service-orders",
				label: "Repair orders",
				href: "/service-orders",
				type: "route",
				icon: "Clipboard",
				permission: permissions.serviceOrders.read,
			},
		],
	},
	{
		title: "Team",
		items: [
			{
				id: "employees",
				label: "Employees",
				href: "/employees",
				type: "route",
				icon: "ContactRound",
				permission: permissions.employees.read,
			},
			{
				id: "profile",
				label: "My account",
				href: "/account",
				type: "route",
				icon: "User",
				permission: permissions.companies.read,
			},
		],
	},
];
