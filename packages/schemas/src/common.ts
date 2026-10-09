import { z } from "zod";

export const formattedIMEI = z.string().regex(/([0-9]{15})/, {
	message: "Formato inválido.",
});
