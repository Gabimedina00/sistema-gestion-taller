import { z } from "zod";
import { documentSchema } from "./documents";

export const createClientSchema = z.object({
	name: z.string().min(1, "O nome é obrigatório"),
	email: z.string().email("Email inválido").min(1, "O email é obrigatório"),
	dni: documentSchema("dni"),
	phone: z.string().min(1, "O telefone é obrigatório"),
	alternativePhone: z.string().optional(),
	address: z.string().min(1, "O endereço é obrigatório"),
	province: z.string().min(1, "Province is required."),
	city: z.string().min(1, "A cidade é obrigatória"),
});
