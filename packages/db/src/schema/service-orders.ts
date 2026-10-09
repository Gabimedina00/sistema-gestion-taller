import { createId } from "@paralleldrive/cuid2";
import {
	date,
	decimal,
	int,
	json,
	mysqlEnum,
	mysqlTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { clients } from "./clients";
import { companies } from "./companies";
import { employees } from "./employees";
import { modelCategories } from "./model-categories";
import { modelMakers } from "./model-makers";

export const serviceOrderStatusEnum = mysqlEnum("status", [
	"pending",
	"diagnosing",
	"waiting_approval",
	"approved",
	"fixing",
	"ready",
	"delivered",
]);

/** @description Keep in sync with `WATCH_MOVEMENT_TYPES` in `@fixr/constants/watches` */
export const watchMovementTypeEnum = mysqlEnum("movement_type", [
	"quartz",
	"automatic",
	"manual",
	"smartwatch",
]);

export const serviceOrders = mysqlTable("service_orders", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	companyId: varchar("company_id", { length: 25 })
		.references(() => companies.id, { onDelete: "cascade" })
		.notNull(),
	clientId: varchar("client_id", { length: 25 })
		.references(() => clients.id, { onDelete: "restrict" })
		.notNull(),
	employeeId: varchar("employee_id", { length: 25 })
		.references(() => employees.id, { onDelete: "restrict" })
		.notNull(),
	deviceMakerId: varchar("device_brand_id", { length: 25 })
		.references(() => modelMakers.id, { onDelete: "restrict" })
		.notNull(),
	deviceCategoryId: varchar("device_category_id", { length: 25 })
		.references(() => modelCategories.id, { onDelete: "restrict" })
		.notNull(),
	deviceModel: varchar("device_model", { length: 100 }).notNull(),
	imei: varchar("imei", { length: 50 }),
	/** Watch reference number printed on the case back (e.g. "SRPD55K1") */
	referenceNumber: varchar("reference_number", { length: 100 }),
	serialNumber: varchar("serial_number", { length: 100 }),
	movementType: watchMovementTypeEnum,
	caliber: varchar("caliber", { length: 100 }),
	/** Ids from `WATCH_SERVICES` in `@fixr/constants/watches` */
	requestedServices: json("requested_services").$type<string[]>(),
	/** Ids from `WATCH_ITEMS_RECEIVED` in `@fixr/constants/watches` */
	itemsReceived: json("items_received").$type<string[]>(),
	/** Scratches, dents, missing parts, etc. noted when the watch is received */
	intakeCondition: text("intake_condition"),
	reportedDefect: text("reported_defect").notNull(),
	observations: text("observations"),
	estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
	estimatedDeliveryDate: date("estimated_delivery_date", { mode: "date" }),
	warrantyDays: int("warranty_days"),
	status: serviceOrderStatusEnum.default("pending").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});

/** @description MariaDB stores JSON as text, so the driver can hand back a string */
const jsonStringArray = z.preprocess(
	(value) => (typeof value === "string" ? JSON.parse(value) : value),
	z.array(z.string()).nullable()
);

export const serviceOrderSelectSchema = createSelectSchema(serviceOrders, {
	requestedServices: jsonStringArray,
	itemsReceived: jsonStringArray,
	estimatedDeliveryDate: z.coerce.date().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
