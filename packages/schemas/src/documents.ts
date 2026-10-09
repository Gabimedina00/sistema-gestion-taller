import { z } from "zod";

const REPEATED_DIGITS_REGEX = /^(\d)\1+$/;
const ONLY_DIGITS_REGEX = /\D/g;

function shouldValidateDocuments() {
	const appEnv =
		process.env.NEXT_PUBLIC_APP_ENV ??
		process.env.APP_ENV ??
		process.env.NODE_ENV;

	return appEnv === "production";
}

function onlyDigits(value: string) {
	return value.replace(ONLY_DIGITS_REGEX, "");
}

function isRepeatedDigits(value: string) {
	return REPEATED_DIGITS_REGEX.test(value);
}

/**
 * Validates an Argentine DNI (Documento Nacional de Identidad) number.
 *
 * A DNI has no check digit, so only the shape is checked: 7 or 8 digits.
 */
export function isValidDNI(dni: string) {
	const value = onlyDigits(dni);

	return (value.length === 7 || value.length === 8) && !isRepeatedDigits(value);
}

const CUIT_PREFIXES = new Set([
	"20",
	"23",
	"24",
	"25",
	"26",
	"27",
	"30",
	"33",
	"34",
]);
const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Validates an Argentine CUIT/CUIL number (11 digits, e.g. 20-12345678-6).
 *
 * The last digit is a check digit: multiply the first 10 digits by the weights
 * [5,4,3,2,7,6,5,4,3,2], sum them and take 11 - (sum % 11).
 * A result of 11 means 0; a result of 10 is never a valid CUIT.
 */
export function isValidCUIT(cuit: string) {
	const value = onlyDigits(cuit);

	if (
		value.length !== 11 ||
		isRepeatedDigits(value) ||
		!CUIT_PREFIXES.has(value.slice(0, 2))
	) {
		return false;
	}

	const total = CUIT_WEIGHTS.reduce(
		(sum, weight, index) => sum + Number(value[index]) * weight,
		0
	);
	const check = 11 - (total % 11);

	if (check === 10) {
		return false;
	}

	return (check === 11 ? 0 : check) === Number(value[10]);
}

export function documentSchema(type: "dni" | "cuit") {
	return z.string().superRefine((value, ctx) => {
		if (!shouldValidateDocuments()) {
			return;
		}

		const valid = type === "dni" ? isValidDNI(value) : isValidCUIT(value);

		if (!valid) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `Invalid ${type.toUpperCase()}`,
			});
		}
	});
}
