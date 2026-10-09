import type { RepairStatus } from "@fixr/constants/watches";

/** @description Argentine country code plus the 9 WhatsApp uses for mobiles */
const AR_WHATSAPP_PREFIX = "549";
const NON_DIGITS = /\D/g;
const WHITESPACE = /\s+/;

/**
 * Click-to-chat link that opens WhatsApp with the message already written.
 * `phone` is the 10-digit number (area code + number, without 0 or 15).
 */
export function whatsappLink(phone: string, message: string) {
	const digits = phone.replace(NON_DIGITS, "");
	return `https://wa.me/${AR_WHATSAPP_PREFIX}${digits}?text=${encodeURIComponent(message)}`;
}

const moneyFormat = new Intl.NumberFormat("es-AR", {
	style: "currency",
	currency: "ARS",
	maximumFractionDigits: 2,
});

/** Dates without time are stored at UTC midnight, so read them in UTC */
const dayFormat = new Intl.DateTimeFormat("es-AR", {
	day: "numeric",
	month: "long",
	timeZone: "UTC",
});

export interface RepairNoticeInput {
	status: RepairStatus;
	customerName: string;
	watch: string;
	orderRef: string;
	shopName?: string | null;
	estimatedCost?: string | number | null;
	readyBy?: Date | null;
	warrantyDays?: number | null;
}

/**
 * @description Message for the customer about where their repair stands.
 * Written in Spanish because it goes to the shop's customers.
 */
export function repairNotice(input: RepairNoticeInput) {
	const firstName = input.customerName.trim().split(WHITESPACE)[0];
	const cost =
		input.estimatedCost === null || input.estimatedCost === undefined
			? null
			: moneyFormat.format(Number(input.estimatedCost));
	const readyBy = input.readyBy ? dayFormat.format(input.readyBy) : null;

	const body = noticeBody(input, cost, readyBy);
	const signature = input.shopName ? `\n\n${input.shopName}` : "";

	return `Hola ${firstName}! ${body}${signature}`;
}

function noticeBody(
	{ status, watch, orderRef, warrantyDays }: RepairNoticeInput,
	cost: string | null,
	readyBy: string | null
) {
	switch (status) {
		case "pending":
		case "diagnosing":
			return `Recibimos tu reloj ${watch} (orden ${orderRef}). Lo estamos revisando y te avisamos el presupuesto.`;
		case "waiting_approval":
			return cost
				? `Ya revisamos tu reloj ${watch}. El arreglo sale ${cost}. ¿Querés que lo hagamos?`
				: `Ya revisamos tu reloj ${watch} y tenemos el presupuesto. ¿Te lo pasamos?`;
		case "approved":
		case "fixing":
			return readyBy
				? `Estamos trabajando en tu reloj ${watch}. Calculamos tenerlo listo el ${readyBy}.`
				: `Estamos trabajando en tu reloj ${watch}. Te avisamos apenas esté listo.`;
		case "ready":
			return cost
				? `Tu reloj ${watch} ya está listo para retirar. El total es ${cost}.`
				: `Tu reloj ${watch} ya está listo para retirar.`;
		case "delivered":
			return warrantyDays
				? `Gracias por confiar en nosotros. Tu reloj ${watch} tiene ${warrantyDays} días de garantía (orden ${orderRef}).`
				: "Gracias por confiar en nosotros. Cualquier cosa con tu reloj, escribinos.";
		default:
			return `Te escribimos por tu reloj ${watch} (orden ${orderRef}).`;
	}
}

/** @description Short code to tell the customer, e.g. "WU49W2" */
export function orderRef(id: string) {
	return id.slice(0, 6).toUpperCase();
}
