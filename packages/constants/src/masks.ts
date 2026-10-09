// CUIT/CUIL: 20-12345678-6
export const cuit = [
	/\d/,
	/\d/,
	"-",
	/\d/,
	/\d/,
	/\d/,
	/\d/,
	/\d/,
	/\d/,
	/\d/,
	/\d/,
	"-",
	/\d/,
];

// DNI: digits only, 7 or 8 of them (old DNIs have 7)
export const dni = /^\d{0,8}$/;

// Phone: area code + number without the 0 and the 15, e.g. 3794123456
export const phone = /^\d{0,10}$/;

export const unmask = {
	dni: (value: string) => value.replace(/\D/g, ""),
	cuit: (value: string) => value.replace(/\D/g, ""),
	phone: (value?: string | null) => value?.replace(/\D/g, ""),
};
