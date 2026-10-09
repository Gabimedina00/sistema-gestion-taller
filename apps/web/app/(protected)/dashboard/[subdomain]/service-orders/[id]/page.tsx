import { ArrowLeft, Wrench } from "lucide-react";
import { Heading } from "@/components/dashboard/heading";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { ServiceOrderDetails } from "@/components/dashboard/service-order/service-order-details";
import { Button } from "@/components/ui/button";

type Params = Promise<{ subdomain: string; id: string }>;

export default async function ServiceOrderDetailsPage({
	params,
}: {
	params: Params;
}) {
	const { subdomain, id } = await params;

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3">
				<Button
					asChild
					className="-mt-3 w-fit -translate-x-2.5"
					size="sm"
					variant="ghost"
				>
					<DashLink href="/service-orders" subdomain={subdomain}>
						<ArrowLeft className="size-4" />
						Back
					</DashLink>
				</Button>

				<Heading
					description="Everything about this repair. Change the status and let the customer know."
					title={
						<>
							<Wrench className="mr-2.5 inline-block size-6.5 -translate-y-1 fill-primary text-primary" />
							Repair order
						</>
					}
				/>
			</div>

			<ServiceOrderDetails id={id} subdomain={subdomain} />
		</div>
	);
}
