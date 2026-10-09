import { db, eq } from "@fixr/db/connection";
import { clients } from "@fixr/db/schema";
import type { createClientSchema } from "@fixr/schemas/clients";
import type { z } from "zod";

/** @description Columns returned for a customer (never the linked user) */
export const clientSelect = {
	id: clients.id,
	name: clients.name,
	dni: clients.dni,
	phone: clients.phone,
	email: clients.email,
	address: clients.address,
	city: clients.city,
	province: clients.province,
	createdAt: clients.createdAt,
};

/** @description Data access layer for customers */
export class ClientsRepository {
	/**
	 * Find a customer by DNI (digits only)
	 *
	 * @param dni - The customer DNI
	 * @returns The customer or null
	 */
	static async queryClientByDni(dni: string) {
		const [client] = await db
			.select(clientSelect)
			.from(clients)
			.where(eq(clients.dni, dni))
			.limit(1);
		return client ?? null;
	}

	/**
	 * Create a walk-in customer (no login account)
	 *
	 * @param data - The customer data
	 * @returns The created customer
	 */
	static async createClient(data: z.infer<typeof createClientSchema>) {
		const [created] = await db
			.insert(clients)
			.values({
				name: data.name,
				dni: data.dni,
				phone: data.phone,
				email: data.email || null,
				address: data.address || null,
				city: data.city || null,
				province: data.province || null,
			})
			.$returningId();

		const [client] = await db
			.select(clientSelect)
			.from(clients)
			.where(eq(clients.id, created.id))
			.limit(1);
		return client;
	}
}
