import { ClipboardPlus } from "lucide-react";
import { NewServiceOrderForm } from "@/components/dashboard/service-order/new-service-order-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewServiceOrderModal() {
	return (
		<ResponsiveDialogDrawer
			description="Fill in the watch and customer details to open a repair order."
			icon={<ClipboardPlus />}
			title="New watch repair order"
		>
			<NewServiceOrderForm />
		</ResponsiveDialogDrawer>
	);
}
