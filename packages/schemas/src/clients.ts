import { z } from "zod";
import { documentSchema } from "./documents";

const optionalText = (max: number, label: string) =>
	z
		.string()
		.max(max, { message: `${label} is too long (max ${max}).` })
		.optional()
		.nullable();

/**
 * @description New customer, filled in at the counter. Only name, DNI and phone are required.
 * DNI and phone are sent as digits only.
 */
export const createClientSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required.")
		.max(100, "Name is too long (max 100)."),
	dni: documentSchema("dni").pipe(
		z.string().regex(/^\d{7,8}$/, "DNI must have 7 or 8 digits.")
	),
	phone: z
		.string()
		.regex(
			/^\d{10}$/,
			"Phone must have 10 digits: area code and number, without 0 or 15."
		),
	email: z
		.union([z.string().email("Invalid email.").max(255), z.literal("")])
		.optional()
		.nullable(),
	address: optionalText(255, "Address"),
	city: optionalText(100, "City"),
	province: optionalText(100, "Province"),
});

export const getClientByDniQuerySchema = z.object({
	dni: z.string().regex(/^\d{7,8}$/, "DNI must have 7 or 8 digits."),
});

export const clientSchema = z.object({
	id: z.string(),
	name: z.string(),
	dni: z.string(),
	phone: z.string().nullable(),
	email: z.string().nullable(),
	address: z.string().nullable(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	createdAt: z.coerce.date(),
});
