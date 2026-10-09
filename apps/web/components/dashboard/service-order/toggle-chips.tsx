"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

function toggleValue<T extends string>(values: T[], value: T): T[] {
	return values.includes(value)
		? values.filter((current) => current !== value)
		: [...values, value];
}

/** @description Pill-style multi select, easier to tap on the shop counter than checkboxes */
export function ToggleChips<T extends string>({
	options,
	value,
	onChange,
}: {
	options: Record<T, { id: T; label: string }>;
	value: T[];
	onChange: (value: T[]) => void;
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{(Object.values(options) as { id: T; label: string }[]).map((option) => {
				const selected = value.includes(option.id);
				return (
					<Button
						aria-pressed={selected}
						key={option.id}
						onClick={() => onChange(toggleValue(value, option.id))}
						size="sm"
						type="button"
						variant={selected ? "default" : "outline"}
					>
						{selected && <Check className="size-3.5" />}
						{option.label}
					</Button>
				);
			})}
		</div>
	);
}
