import { z } from "zod";
import { documentSchema } from "./documents";
import { getPaginatedDataSchema } from "./utils";

export const serviceOrderStatuses = z.enum([
	"pending",
	"diagnosing",
	"waiting_approval",
	"approved",
	"fixing",
	"ready",
	"delivered",
]);

// Keep these ids in sync with the labels in `@fixr/constants/watches`
export const watchMovementTypes = z.enum([
	"quartz",
	"automatic",
	"manual",
	"smartwatch",
]);
export const watchServices = z.enum([
	"battery",
	"full_service",
	"crystal",
	"strap",
	"crown_stem",
	"water_test",
	"gaskets",
	"regulation",
	"polishing",
	"diagnosis",
	"other",
]);
export const watchItemsReceived = z.enum([
	"box",
	"papers",
	"original_strap",
	"extra_links",
	"pouch",
]);

/** @description Watch-specific fields shared by the API and the intake form */
export const watchDetailsSchema = z.object({
	referenceNumber: z
		.string()
		.max(100, { message: "Reference number is too long (max 100)." })
		.optional()
		.nullable(),
	serialNumber: z
		.string()
		.max(100, { message: "Serial number is too long (max 100)." })
		.optional()
		.nullable(),
	movementType: watchMovementTypes.optional().nullable(),
	caliber: z
		.string()
		.max(100, { message: "Caliber is too long (max 100)." })
		.optional()
		.nullable(),
	requestedServices: z
		.array(watchServices)
		.min(1, { message: "Pick at least one service." }),
	itemsReceived: z.array(watchItemsReceived).default([]),
	intakeCondition: z
		.string()
		.max(65_535, { message: "Condition notes are too long." })
		.optional()
		.nullable(),
	estimatedCost: z.coerce
		.number({ message: "Estimated cost must be a number." })
		.nonnegative({ message: "Estimated cost can't be negative." })
		.optional()
		.nullable(),
	estimatedDeliveryDate: z.coerce
		.date({ message: "Invalid delivery date." })
		.optional()
		.nullable(),
	warrantyDays: z
		.number()
		.int({ message: "Warranty must be a whole number of days." })
		.min(0, { message: "Warranty can't be negative." })
		.max(3650, { message: "Warranty can't be longer than 10 years." })
		.optional()
		.nullable(),
});

export const createServiceOrderPhotoSchema = z.object({
	uploadId: z
		.string({ error: "Upload ID is required." })
		.min(1, { message: "Upload ID is required." }),
	description: z
		.string()
		.max(255, { message: "Description is too long (max 255)." })
		.optional()
		.nullable(),
});

export const createServiceOrderMockSchema = watchDetailsSchema.extend({
	clientId: z.string().cuid2({ message: "Invalid customer." }),
	deviceBrandId: z.string().cuid2({ message: "Invalid brand." }),
	deviceCategoryId: z.string().cuid2({ message: "Invalid device category." }),
	deviceModel: z
		.string({ error: "Model is required." })
		.min(1, { message: "Model is required." })
		.max(100, { message: "Model is too long (max 100)." }),
	imei: z
		.string()
		.max(50, { message: "IMEI is too long (max 50)." })
		.optional()
		.nullable(),
	reportedDefect: z
		.string({ error: "Reported issue is required." })
		.min(1, { message: "Reported issue is required." })
		.max(65_535, { message: "Reported issue is too long." }),
	observations: z
		.string()
		.max(65_535, { message: "Notes are too long." })
		.optional()
		.nullable(),
	photos: z
		.array(createServiceOrderPhotoSchema)
		.max(20, { message: "Up to 20 photos per order." })
		.default([]),
	/** Optional in the API so phone repairs can still be created without it */
	requestedServices: z.array(watchServices).default([]),
});

/** @deprecated Use createServiceOrderSchema */
export const createOrderServiceMockSchema = createServiceOrderMockSchema;

export const getServiceOrdersQuerySchema = getPaginatedDataSchema
	.extend({
		deviceCategoryId: z
			.string()
			.cuid2({ message: "Invalid device category." })
			.optional(),
		employeeId: z.string().cuid2({ message: "Invalid technician." }).optional(),
		status: serviceOrderStatuses.optional(),
		dateFrom: z.coerce.date({ message: "Invalid start date." }).optional(),
		dateTo: z.coerce.date({ message: "Invalid end date." }).optional(),
	})
	.refine(
		(data) => {
			if (data.dateFrom && data.dateTo) {
				return data.dateFrom <= data.dateTo;
			}
			return true;
		},
		{
			message: "Start date must be on or before the end date.",
			path: ["dateTo"],
		}
	);

/** @description Intake form for a watch repair order (web dashboard) */
export const createOrderServiceSchema = watchDetailsSchema.extend({
	customerDocument: documentSchema("dni").min(
		1,
		"Customer ID (DNI) is required."
	),
	brandId: z.string().min(1, "Pick the brand, or add it if it's not listed."),
	model: z
		.string()
		.min(1, "Model is required.")
		.max(100, "Model is too long (max 100)."),
	description: z.string().min(1, "Describe the problem the customer reports."),
	notes: z.string().optional(),
	assigned_to: z.string().optional(),
	images: z.array(z.instanceof(File)).max(15, "Add up to 15 photos."),
});
