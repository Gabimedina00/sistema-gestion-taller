/** @description How the watch is powered. Drives which services make sense. */
export const WATCH_MOVEMENT_TYPES = {
	quartz: { id: "quartz", label: "Quartz (battery)" },
	automatic: { id: "automatic", label: "Automatic" },
	manual: { id: "manual", label: "Manual wind" },
	smartwatch: { id: "smartwatch", label: "Smartwatch" },
} as const;

export type WatchMovementType = keyof typeof WATCH_MOVEMENT_TYPES;

export const WATCH_MOVEMENT_TYPE_IDS = Object.keys(WATCH_MOVEMENT_TYPES) as [
	WatchMovementType,
	...WatchMovementType[],
];

/** @description Work the customer asks for when dropping off the watch. */
export const WATCH_SERVICES = {
	battery: { id: "battery", label: "Battery replacement" },
	full_service: { id: "full_service", label: "Full service (clean and oil)" },
	crystal: { id: "crystal", label: "Crystal (glass) replacement" },
	strap: { id: "strap", label: "Strap or bracelet" },
	crown_stem: { id: "crown_stem", label: "Crown or stem" },
	water_test: { id: "water_test", label: "Water resistance test" },
	gaskets: { id: "gaskets", label: "Gaskets (seals)" },
	regulation: { id: "regulation", label: "Timing adjustment" },
	polishing: { id: "polishing", label: "Case polishing" },
	diagnosis: { id: "diagnosis", label: "Diagnosis only" },
	other: { id: "other", label: "Other" },
} as const;

export type WatchService = keyof typeof WATCH_SERVICES;

export const WATCH_SERVICE_IDS = Object.keys(WATCH_SERVICES) as [
	WatchService,
	...WatchService[],
];

/** @description Things the customer leaves together with the watch. */
export const WATCH_ITEMS_RECEIVED = {
	box: { id: "box", label: "Box" },
	papers: { id: "papers", label: "Papers / warranty card" },
	original_strap: { id: "original_strap", label: "Original strap or bracelet" },
	extra_links: { id: "extra_links", label: "Extra bracelet links" },
	pouch: { id: "pouch", label: "Pouch" },
} as const;

export type WatchItemReceived = keyof typeof WATCH_ITEMS_RECEIVED;

export const WATCH_ITEM_RECEIVED_IDS = Object.keys(WATCH_ITEMS_RECEIVED) as [
	WatchItemReceived,
	...WatchItemReceived[],
];

/**
 * @description Brands loaded with the first install (migration `seed_watch_brands`).
 * The shop adds any other brand from the intake form.
 */
export const COMMON_WATCH_BRANDS = [
	"Amazfit",
	"Apple",
	"Casio",
	"Citizen",
	"Festina",
	"Fossil",
	"Garmin",
	"Guess",
	"Hamilton",
	"Huawei",
	"John L. Cook",
	"Knock Out",
	"Mido",
	"Mistral",
	"Montreal",
	"Omega",
	"Orient",
	"Q&Q",
	"Rolex",
	"Samsung",
	"Seiko",
	"Swatch",
	"Tag Heuer",
	"Timex",
	"Tissot",
	"Tressa",
	"Xiaomi",
] as const;

/** @description Device category every watch repair order goes under (seeded with the brands). */
export const WATCH_CATEGORY_SLUG = "watches";

/** @description Default warranty, in days, given on a repair. */
export const DEFAULT_WATCH_WARRANTY_DAYS = 90;
