import { ClipboardPlus } from "lucide-react";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { NewServiceOrderForm } from "@/components/dashboard/service-order/new-service-order-form";

export default function NewServiceOrderPage() {
	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description="Fill in the watch and customer details to open a repair order."
				Icon={ClipboardPlus}
				title="New watch repair order"
			/>
			<div>
				<NewServiceOrderForm className="max-w-2xl" />
			</div>
		</div>
	);
}
