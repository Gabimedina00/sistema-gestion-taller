import { createCompanySchema } from "@fixr/schemas/companies";
import { isValidCUIT, isValidDNI } from "@fixr/schemas/documents";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("isValidCUIT", () => {
	it("accepts CUITs with a correct check digit, with or without dashes", () => {
		expect(isValidCUIT("20-30123456-3")).toBe(true);
		expect(isValidCUIT("30712345671")).toBe(true);
	});

	it("rejects a wrong check digit, a wrong length or an unknown prefix", () => {
		expect(isValidCUIT("20-30123456-4")).toBe(false);
		expect(isValidCUIT("2030123456")).toBe(false);
		expect(isValidCUIT("99-30123456-3")).toBe(false);
		expect(isValidCUIT("11-11111111-1")).toBe(false);
	});
});

describe("isValidDNI", () => {
	it("accepts 7 and 8 digit DNIs, with or without dots", () => {
		expect(isValidDNI("30.123.456")).toBe(true);
		expect(isValidDNI("5123456")).toBe(true);
	});

	it("rejects other lengths and repeated digits", () => {
		expect(isValidDNI("123456")).toBe(false);
		expect(isValidDNI("123456789")).toBe(false);
		expect(isValidDNI("11111111")).toBe(false);
	});
});

describe("createCompanySchema in production", () => {
	const previousAppEnv = process.env.APP_ENV;
	const company = {
		name: "Relojería",
		subdomain: "relojeria",
		cuit: "30-71234567-1",
		owner_dni: "30123456",
		owner_email: "dueno@ejemplo.com",
		owner_password: "UnaClaveSegura123!",
	};

	beforeEach(() => {
		process.env.APP_ENV = "production";
	});

	afterEach(() => {
		process.env.APP_ENV = previousAppEnv;
	});

	it("accepts a valid CUIT and DNI", () => {
		expect(createCompanySchema.safeParse(company).success).toBe(true);
	});

	it("rejects an invalid CUIT", () => {
		const result = createCompanySchema.safeParse({
			...company,
			cuit: "30-71234567-2",
		});
		expect(result.success).toBe(false);
	});
});
