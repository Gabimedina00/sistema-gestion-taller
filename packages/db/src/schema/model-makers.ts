import { createId } from "@paralleldrive/cuid2";
import {
	int,
	mysqlEnum,
	mysqlTable,
	timestamp,
	varchar,
} from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";

/** @description What a maker makes: phones come from the device catalog, watches are added by the shop */
export const makerKindEnum = mysqlEnum("maker_kind", ["phone", "watch"]);

/** @description Device makers (brands) table: stores manufacturer/brand info */
export const modelMakers = mysqlTable("model_makers", {
	id: varchar("id", { length: 25 })
		.$defaultFn(() => createId())
		.primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	slug: varchar("slug", { length: 100 }).notNull(),
	url: varchar("url", { length: 255 }).notNull().default(""),
	kind: makerKindEnum.notNull().default("phone"),
	deviceCount: int("device_count").notNull().default(0),
	pageCount: int("page_count"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** @description Zod schema for selecting a maker record */
export const modelMakerSelectSchema = createSelectSchema(modelMakers);

/** @deprecated Renamed to {@link modelMakers} */
export const deviceBrands = modelMakers;
/** @deprecated Renamed to {@link modelMakerSelectSchema} */
export const deviceBrandSelectSchema = modelMakerSelectSchema;
