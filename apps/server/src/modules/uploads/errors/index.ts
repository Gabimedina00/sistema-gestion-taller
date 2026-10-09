import { defineErrors } from "../../../core/utils/errors";

export const uploadsErrors = defineErrors({
	UPLOAD_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	UPLOAD_SIZE_EXCEEDED: {
		code: "upload_size_exceeded",
		message: "Arquivo excede o limite de tamanho permitido.",
		status: 413,
	},
	UPLOAD_LINK_INVALID: {
		code: "upload_link_invalid",
		message: "This upload link is invalid or has expired.",
		status: 403,
	},
	UPLOAD_CONTENT_MISMATCH: {
		code: "upload_content_mismatch",
		message:
			"The file doesn't match the type or size the upload link was issued for.",
		status: 400,
	},
});
