import { Heading } from "@/components/dashboard/heading";
import { StatusSummary } from "@/components/dashboard/service-order/status-summary";

type Params = Promise<{ subdomain: string }>;

export default async function Home({ params }: { params: Params }) {
	const { subdomain } = await params;

	return (
		<div className="space-y-6">
			<Heading
				description="How many watches are at each step. Tap one to see them."
				title="Home"
			/>
			<StatusSummary subdomain={subdomain} />
		</div>
	);
}
