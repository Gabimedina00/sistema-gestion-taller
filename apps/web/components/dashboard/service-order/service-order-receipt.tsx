import type { ServiceOrderDetails } from "@/lib/services/service-orders";
import { orderRef } from "@/lib/whatsapp";

// The receipt goes to the customer, so it's in Spanish like the WhatsApp messages
const SERVICES_ES: Record<string, string> = {
	battery: "Cambio de pila",
	full_service: "Service completo (limpieza y aceitado)",
	crystal: "Cambio de cristal",
	strap: "Malla o correa",
	crown_stem: "Corona o vástago",
	water_test: "Prueba de hermeticidad",
	gaskets: "Juntas",
	regulation: "Ajuste de marcha",
	polishing: "Pulido de caja",
	diagnosis: "Solo diagnóstico",
	other: "Otro",
};

const ITEMS_ES: Record<string, string> = {
	box: "Caja",
	papers: "Papeles / garantía",
	original_strap: "Malla original",
	extra_links: "Eslabones extra",
	pouch: "Estuche",
};

const moneyFormat = new Intl.NumberFormat("es-AR", {
	style: "currency",
	currency: "ARS",
});
const dateTimeFormat = new Intl.DateTimeFormat("es-AR", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});
/** Ready-by dates have no time and are stored at UTC midnight */
const dateOnlyFormat = new Intl.DateTimeFormat("es-AR", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	timeZone: "UTC",
});

function list(ids: string[] | null, labels: Record<string, string>) {
	return ids && ids.length > 0
		? ids.map((id) => labels[id] ?? id).join(", ")
		: "—";
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex gap-2">
			<dt className="w-36 shrink-0 text-neutral-500">{label}</dt>
			<dd className="font-medium">{value}</dd>
		</div>
	);
}

/**
 * @description Intake receipt the customer takes home. Only visible when
 * printing (see the `#print-receipt` rule in globals.css).
 */
export function ServiceOrderReceipt({
	order,
	shopName,
}: {
	order: ServiceOrderDetails;
	shopName?: string | null;
}) {
	const watch = [
		order.deviceMaker.name,
		order.deviceModel,
		order.referenceNumber ? `Ref. ${order.referenceNumber}` : null,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			className="hidden bg-white p-8 text-black text-sm print:block"
			id="print-receipt"
		>
			<header className="mb-6 flex items-start justify-between border-black border-b pb-4">
				<div>
					<h1 className="font-bold text-xl">{shopName ?? "Taller"}</h1>
					<p>Comprobante de ingreso de reloj</p>
				</div>
				<div className="text-right">
					<p className="font-bold font-mono text-2xl">{orderRef(order.id)}</p>
					<p>{dateTimeFormat.format(order.createdAt)}</p>
				</div>
			</header>

			<section className="mb-5">
				<h2 className="mb-2 font-semibold uppercase">Cliente</h2>
				<dl className="space-y-1">
					<Row label="Nombre" value={order.client.name} />
					<Row label="DNI" value={order.client.dni} />
					<Row label="Teléfono" value={order.client.phone ?? "—"} />
				</dl>
			</section>

			<section className="mb-5">
				<h2 className="mb-2 font-semibold uppercase">Reloj</h2>
				<dl className="space-y-1">
					<Row label="Reloj" value={watch} />
					<Row label="N.º de serie" value={order.serialNumber ?? "—"} />
					<Row label="Problema" value={order.reportedDefect} />
					<Row
						label="Trabajo pedido"
						value={list(order.requestedServices, SERVICES_ES)}
					/>
					<Row label="Estado al recibir" value={order.intakeCondition ?? "—"} />
					<Row
						label="Deja además"
						value={list(order.itemsReceived, ITEMS_ES)}
					/>
				</dl>
			</section>

			<section className="mb-8">
				<h2 className="mb-2 font-semibold uppercase">Presupuesto</h2>
				<dl className="space-y-1">
					<Row
						label="Precio estimado"
						value={
							order.estimatedCost === null
								? "A confirmar"
								: moneyFormat.format(Number(order.estimatedCost))
						}
					/>
					<Row
						label="Listo para el"
						value={
							order.estimatedDeliveryDate
								? dateOnlyFormat.format(order.estimatedDeliveryDate)
								: "A confirmar"
						}
					/>
					<Row
						label="Garantía"
						value={
							order.warrantyDays ? `${order.warrantyDays} días` : "Sin garantía"
						}
					/>
				</dl>
			</section>

			<p className="mb-12">
				Presentá este comprobante para retirar tu reloj. Te avisamos por
				WhatsApp cuando esté listo.
			</p>

			<div className="grid grid-cols-2 gap-12">
				<div className="border-black border-t pt-1 text-center">
					Firma del cliente
				</div>
				<div className="border-black border-t pt-1 text-center">
					Firma del taller
				</div>
			</div>
		</div>
	);
}
