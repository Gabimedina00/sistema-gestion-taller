import { unmask } from "@fixr/constants/masks";
import { db, eq } from "@fixr/db/connection";
import { employees, users } from "@fixr/db/schema";
import type { createEmployeeSchema } from "@fixr/schemas/employees";
import type { z } from "zod";
import { hashPassword } from "../../../core/lib/hash-password";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

/** @description Employees data access layer */
export class EmployeesRepository {
	/**
	 * Get an employee by DNI
	 *
	 * @param dni - The employee DNI
	 * @returns The employee data or undefined
	 */
	@Cached({ ttl: 3600, key: "employees:dni" })
	static async getEmployeeByDni(dni: string) {
		const [data] = await db
			.select()
			.from(employees)
			.where(eq(employees.dni, dni));
		return data;
	}

	/**
	 * Create an employee and its associated user account
	 *
	 * @param data - The employee registration data
	 * @param companyId - The company ID
	 */
	@InvalidateCache({ patterns: ["employees:*"] })
	static async createEmployeeAndAccount({
		data,
		companyId,
	}: {
		data: z.infer<typeof createEmployeeSchema>;
		companyId: string;
	}) {
		const [userId] = await db
			.insert(users)
			.values({
				email: data.email,
				passwordHash: await hashPassword(data.password!),
				verified: true,
			})
			.$returningId();

		await db.insert(employees).values({
			dni: data.dni,
			name: data.name,
			phone: unmask.phone(data.phone),
			role: data.role,
			userId: userId.id,
			companyId,
		});
	}
}
