"use client";

import { toast } from "@pheralb/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	createWatchBrand,
	listWatchBrands,
	type WatchBrand,
	watchBrandsQueryKey,
} from "@/lib/services/watch-brands";

const ADD_BRAND_VALUE = "__add_brand__";

function brandsPlaceholder(failed: boolean, loading: boolean) {
	if (failed) {
		return "Couldn't load the brands";
	}
	return loading ? "Loading brands..." : "Pick the brand";
}

/**
 * @description Picks a watch brand from the shop's list. The last option lets
 * the person add a brand that isn't registered yet, which is then selected.
 */
export function WatchBrandField({
	subdomain,
	value,
	onChange,
}: {
	subdomain: string;
	value: string;
	onChange: (brandId: string) => void;
}) {
	const queryClient = useQueryClient();
	const [adding, setAdding] = useState(false);
	const [newBrand, setNewBrand] = useState("");

	const brands = useQuery({
		queryKey: watchBrandsQueryKey(subdomain),
		queryFn: async () => {
			const result = await listWatchBrands(subdomain);
			if (result.error !== null) {
				throw new Error(result.error);
			}
			return result.data;
		},
	});

	const addBrand = useMutation({
		mutationFn: async (name: string) => {
			const result = await createWatchBrand(subdomain, name);
			if (result.error !== null) {
				throw new Error(result.error);
			}
			return result.data;
		},
		onSuccess: (brand) => {
			queryClient.setQueryData<WatchBrand[]>(
				watchBrandsQueryKey(subdomain),
				(current = []) =>
					current.some((item) => item.id === brand.id)
						? current
						: [...current, brand].sort((a, b) => a.name.localeCompare(b.name))
			);
			onChange(brand.id);
			setAdding(false);
			setNewBrand("");
			toast.success({ text: `${brand.name} is now in the brand list.` });
		},
		onError: (error) => {
			toast.error({
				text: "Couldn't add the brand",
				description: error.message,
			});
		},
	});

	if (adding) {
		const name = newBrand.trim();
		return (
			<div className="flex gap-2">
				<Input
					autoFocus
					onChange={(e) => setNewBrand(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							if (name) addBrand.mutate(name);
						}
					}}
					placeholder="New brand name"
					value={newBrand}
				/>
				<Button
					disabled={!name || addBrand.isPending}
					onClick={() => addBrand.mutate(name)}
					type="button"
				>
					{addBrand.isPending ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						"Add"
					)}
				</Button>
				<Button
					onClick={() => {
						setAdding(false);
						setNewBrand("");
					}}
					type="button"
					variant="ghost"
				>
					Cancel
				</Button>
			</div>
		);
	}

	return (
		<Select
			disabled={brands.isPending}
			onValueChange={(next) => {
				if (next === ADD_BRAND_VALUE) {
					setAdding(true);
					return;
				}
				onChange(next);
			}}
			value={value}
		>
			<SelectTrigger className="w-full">
				<SelectValue
					placeholder={brandsPlaceholder(brands.isError, brands.isPending)}
				/>
			</SelectTrigger>
			<SelectContent>
				{brands.data?.map((brand) => (
					<SelectItem key={brand.id} value={brand.id}>
						{brand.name}
					</SelectItem>
				))}
				<SelectSeparator />
				<SelectItem value={ADD_BRAND_VALUE}>
					<Plus className="size-4" />
					Add a brand that's not listed
				</SelectItem>
			</SelectContent>
		</Select>
	);
}
