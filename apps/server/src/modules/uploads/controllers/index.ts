import type {
	createUploadPresignSchema,
	uploadFileQuerySchema,
	uploadPurpose,
} from "@fixr/schemas/uploads";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { UploadsService } from "../services";

export class UploadsController {
	static createPresignedUpload({
		purpose,
		data,
		userId,
		companyId,
		response,
	}: {
		purpose: z.infer<typeof uploadPurpose>;
		data: z.infer<typeof createUploadPresignSchema>;
		userId: string;
		companyId?: string;
		response: FastifyReply;
	}) {
		return UploadsService.createPresignedUpload({
			purpose,
			data,
			userId,
			companyId,
			response,
		});
	}

	static storeUploadedFile(params: {
		key: string;
		query: z.infer<typeof uploadFileQuerySchema>;
		contentType: string;
		body: Buffer;
		response: FastifyReply;
	}) {
		return UploadsService.storeUploadedFile(params);
	}
}
