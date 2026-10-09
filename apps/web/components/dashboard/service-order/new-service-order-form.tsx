"use client";

import { dni as dniMaskPattern, unmask } from "@fixr/constants/masks";
import {
	DEFAULT_WATCH_WARRANTY_DAYS,
	WATCH_ITEMS_RECEIVED,
	WATCH_MOVEMENT_TYPES,
	WATCH_SERVICES,
} from "@fixr/constants/watches";
import { createOrderServiceSchema } from "@fixr/schemas/service-orders";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMaskito } from "@maskito/react";
import { toast } from "@pheralb/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ImagePlus, Loader2, Trash2, UserPlus } from "lucide-react";
import { useParams } from "next/navigation";
import { type ComponentPropsWithoutRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toDateOnly } from "@/lib/dates";
import { type Client, findClientByDni } from "@/lib/services/clients";
import {
	createServiceOrder,
	getWatchCategory,
	uploadServiceOrderPhoto,
} from "@/lib/services/service-orders";
import { cn } from "@/lib/utils";
import { NewClientForm } from "../clients/new-client-form";
import { ToggleChips } from "./toggle-chips";
import { WatchBrandField } from "./watch-brand-field";

type FormInput = z.input<typeof createOrderServiceSchema>;
type FormOutput = z.output<typeof createOrderServiceSchema>;

const DNI_REGEX = /^\d{7,8}$/;

const clientByDniQueryKey = (subdomain: string, dni: string) => [
	"clients",
	subdomain,
	"dni",
	dni,
];

function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(new Error("Could not read image"));
		reader.readAsDataURL(file);
	});
}
function getFilePreviewKey(file: File): string {
	return `${file.name}-${file.size}-${file.lastModified}`;
}

/** @description Shows who the typed DNI belongs to, so the counter knows if the customer is new */
function CustomerLookup({
	searched,
	loading,
	customer,
	error,
}: {
	searched: boolean;
	loading: boolean;
	customer: Client | null | undefined;
	error: string | undefined;
}) {
	if (!searched) {
		return null;
	}
	if (loading) {
		return <FormDescription>Looking up the customer...</FormDescription>;
	}
	if (error) {
		return <FormDescription>{error}</FormDescription>;
	}
	if (!customer) {
		return (
			<FormDescription>
				No customer with this DNI yet. Add them with "New customer".
			</FormDescription>
		);
	}
	return (
		<FormDescription className="text-foreground">
			<Check className="inline-block size-3.5" /> {customer.name}
			{customer.phone ? ` · ${customer.phone}` : ""}
		</FormDescription>
	);
}

/** @description Maps the intake form to the API fields, sending empty text as null */
function toOrderFields(values: FormOutput) {
	return {
		deviceBrandId: values.brandId,
		deviceModel: values.model,
		reportedDefect: values.description,
		observations: values.notes || null,
		referenceNumber: values.referenceNumber || null,
		serialNumber: values.serialNumber || null,
		movementType: values.movementType ?? null,
		caliber: values.caliber || null,
		requestedServices: values.requestedServices,
		itemsReceived: values.itemsReceived,
		intakeCondition: values.intakeCondition || null,
		estimatedCost: values.estimatedCost ?? null,
		estimatedDeliveryDate: values.estimatedDeliveryDate
			? toDateOnly(values.estimatedDeliveryDate)
			: null,
		warrantyDays: values.warrantyDays ?? null,
	};
}

export function NewServiceOrderForm({
	className,
	...props
}: ComponentPropsWithoutRef<"form">) {
	const { subdomain } = useParams<{ subdomain: string }>();
	const queryClient = useQueryClient();
	const [customerSheetOpen, setCustomerSheetOpen] = useState(false);
	// What's happening while saving, shown on the submit button
	const [progress, setProgress] = useState<string | null>(null);
	const dniMask = useMaskito({ options: { mask: dniMaskPattern } });

	const form = useForm<FormInput, unknown, FormOutput>({
		resolver: zodResolver(createOrderServiceSchema),
		defaultValues: {
			customerDocument: "",
			brandId: "",
			model: "",
			referenceNumber: "",
			serialNumber: "",
			movementType: null,
			caliber: "",
			requestedServices: [],
			itemsReceived: [],
			intakeCondition: "",
			description: "",
			estimatedCost: null,
			estimatedDeliveryDate: null,
			warrantyDays: DEFAULT_WATCH_WARRANTY_DAYS,
			notes: "",
			images: [],
		},
		mode: "all",
	});

	const customerDni = unmask.dni(form.watch("customerDocument") ?? "");

	const customer = useQuery({
		queryKey: clientByDniQueryKey(subdomain, customerDni),
		enabled: DNI_REGEX.test(customerDni),
		queryFn: async () => {
			const result = await findClientByDni(subdomain, customerDni);
			if (result.error !== null) {
				throw new Error(result.error);
			}
			return result.data;
		},
	});

	const handleCustomerCreated = (client: Client) => {
		queryClient.setQueryData(
			clientByDniQueryKey(subdomain, client.dni),
			client
		);
		form.setValue("customerDocument", client.dni, { shouldValidate: true });
		setCustomerSheetOpen(false);
	};

	const saveOrder = async (values: FormOutput) => {
		const dni = unmask.dni(values.customerDocument);

		setProgress("Checking the customer...");
		const client = await findClientByDni(subdomain, dni);
		if (client.error !== null) {
			toast.error({
				text: "Couldn't check the customer",
				description: client.error,
			});
			return;
		}
		if (!client.data) {
			form.setError("customerDocument", {
				message: 'No customer with this DNI. Add them with "New customer".',
			});
			return;
		}

		const category = await getWatchCategory(subdomain);
		if (category.error !== null) {
			toast.error({
				text: "Couldn't save the order",
				description: category.error,
			});
			return;
		}

		const photos: { uploadId: string }[] = [];
		for (const [index, file] of values.images.entries()) {
			setProgress(`Uploading photo ${index + 1} of ${values.images.length}...`);
			const upload = await uploadServiceOrderPhoto(file);
			if (upload.error !== null) {
				toast.error({
					text: `Couldn't upload ${file.name}`,
					description: upload.error,
				});
				return;
			}
			photos.push({ uploadId: upload.data });
		}

		setProgress("Saving the order...");
		const order = await createServiceOrder(subdomain, {
			clientId: client.data.id,
			deviceCategoryId: category.data.id,
			...toOrderFields(values),
			photos,
		});
		if (order.error !== null) {
			toast.error({
				text: "Couldn't save the order",
				description: order.error,
			});
			return;
		}

		toast.success({
			text: "Repair order saved",
			description: `${client.data.name}'s watch is now in the list.`,
		});
		form.reset();
		queryClient.invalidateQueries({ queryKey: ["service-orders"] });
	};

	const onSubmit = async (values: FormOutput) => {
		try {
			await saveOrder(values);
		} finally {
			setProgress(null);
		}
	};

	const selectedImages = form.watch("images") ?? [];

	const { data: previewUrlsByKey = {} } = useQuery<Record<string, string>>({
		queryKey: ["image-previews", selectedImages.map(getFilePreviewKey)],
		enabled: selectedImages.length > 0,
		queryFn: () =>
			Promise.all(
				selectedImages.map(async (file) => {
					const key = getFilePreviewKey(file);
					const url = await fileToDataUrl(file);
					return [key, url] as const;
				})
			).then((entries) => Object.fromEntries(entries)),
		staleTime: Number.POSITIVE_INFINITY,
	});

	return (
		<Form {...form}>
			<form
				className={cn("space-y-6", className)}
				onSubmit={form.handleSubmit(onSubmit)}
				{...props}
			>
				<section className="space-y-4">
					<h3 className="font-semibold text-sm">Customer</h3>
					<div className="flex grow gap-4">
						<FormField
							control={form.control}
							name="customerDocument"
							render={({ field }) => (
								<FormItem className="grow">
									<FormLabel>Customer ID (DNI)</FormLabel>
									<FormControl>
										<Input
											inputMode="numeric"
											placeholder="30123456"
											{...field}
											onInput={(e) =>
												form.setValue("customerDocument", e.currentTarget.value)
											}
											ref={dniMask}
										/>
									</FormControl>
									<CustomerLookup
										customer={customer.data}
										error={customer.error?.message}
										loading={customer.isFetching}
										searched={DNI_REGEX.test(customerDni)}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Sheet onOpenChange={setCustomerSheetOpen} open={customerSheetOpen}>
							<SheetTrigger asChild className="mt-5.5">
								<Button className="shrink-0" type="button">
									New customer <UserPlus className="size-4" />
								</Button>
							</SheetTrigger>
							<SheetContent>
								<SheetHeader>
									<SheetTitle>New customer</SheetTitle>
									<SheetDescription>
										Fill in the fields below to add a customer.
									</SheetDescription>
								</SheetHeader>
								<NewClientForm
									className="px-4"
									onCustomerCreated={handleCustomerCreated}
								/>
							</SheetContent>
						</Sheet>
					</div>
				</section>

				<section className="space-y-4">
					<h3 className="font-semibold text-sm">Watch</h3>
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="brandId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Brand</FormLabel>
									<WatchBrandField
										onChange={field.onChange}
										subdomain={subdomain}
										value={field.value}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="model"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Model</FormLabel>
									<FormControl>
										<Input placeholder="Seiko 5 Sports" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="referenceNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Reference number</FormLabel>
									<FormControl>
										<Input
											placeholder="SRPD55K1"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormDescription>
										Usually printed on the case back.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="serialNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Serial number</FormLabel>
									<FormControl>
										<Input
											placeholder="9X1234"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="movementType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Movement</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value ?? ""}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Pick the movement type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(WATCH_MOVEMENT_TYPES).map((movement) => (
												<SelectItem key={movement.id} value={movement.id}>
													{movement.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="caliber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Caliber</FormLabel>
									<FormControl>
										<Input
											placeholder="4R36, Miyota 2035..."
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</section>

				<section className="space-y-4">
					<h3 className="font-semibold text-sm">Intake</h3>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Problem reported by the customer</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Stopped working, runs late, fogged glass..."
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="requestedServices"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Services requested</FormLabel>
								<FormControl>
									<ToggleChips
										onChange={field.onChange}
										options={WATCH_SERVICES}
										value={field.value ?? []}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="intakeCondition"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Condition when received</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Scratches on the bezel, crown missing, strap worn..."
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormDescription>
									Write down anything already damaged so there are no surprises
									on pickup.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="itemsReceived"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Left with the watch</FormLabel>
								<FormControl>
									<ToggleChips
										onChange={field.onChange}
										options={WATCH_ITEMS_RECEIVED}
										value={field.value ?? []}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</section>

				<section className="space-y-4">
					<h3 className="font-semibold text-sm">Quote</h3>
					<div className="grid gap-4 sm:grid-cols-3">
						<FormField
							control={form.control}
							name="estimatedCost"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Estimated cost ($)</FormLabel>
									<FormControl>
										<Input
											inputMode="decimal"
											min={0}
											placeholder="15000"
											step="0.01"
											type="number"
											{...field}
											onChange={(e) =>
												field.onChange(
													e.target.value === "" ? null : e.target.value
												)
											}
											value={(field.value as string | number | null) ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="estimatedDeliveryDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Ready by</FormLabel>
									<FormControl>
										<Input
											type="date"
											{...field}
											onChange={(e) =>
												field.onChange(
													e.target.value === "" ? null : e.target.value
												)
											}
											value={(field.value as string | null) ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="warrantyDays"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Warranty (days)</FormLabel>
									<FormControl>
										<Input
											inputMode="numeric"
											min={0}
											type="number"
											{...field}
											onChange={(e) =>
												field.onChange(
													e.target.value === "" ? null : e.target.valueAsNumber
												)
											}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="notes"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Internal notes</FormLabel>
								<FormControl>
									<Textarea placeholder="Only visible to the shop" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</section>

				<FormField
					control={form.control}
					name="images"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Photos of the watch</FormLabel>
							<FormControl>
								<div className="space-y-3">
									<input
										accept="image/*"
										className="hidden"
										id="images-upload"
										multiple
										onChange={(e) => {
											const files = Array.from(e.target.files ?? []);
											field.onChange(files);
										}}
										type="file"
									/>

									<label
										className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-muted-foreground text-sm hover:bg-accent hover:text-foreground"
										htmlFor="images-upload"
									>
										<span>
											{selectedImages.length > 0
												? `${selectedImages.length} photo(s) selected`
												: "Front, back and any damage (PNG, JPG, WEBP)"}
										</span>
										<ImagePlus className="h-4 w-4" />
									</label>

									{selectedImages.length > 0 ? (
										<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
											{selectedImages.map((file) => {
												const fileKey = getFilePreviewKey(file);
												const url = previewUrlsByKey[fileKey];

												if (!url) {
													return null;
												}

												return (
													<div
														className="relative aspect-square overflow-hidden rounded-md border"
														key={fileKey}
													>
														<img
															alt={file.name}
															className="h-full w-full object-cover"
															height={320}
															src={url}
															width={320}
														/>

														<button
															aria-label={`Remove ${file.name}`}
															className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
															onClick={() => {
																const nextFiles = selectedImages.filter(
																	(currentFile) =>
																		getFilePreviewKey(currentFile) !== fileKey
																);
																field.onChange(nextFiles);
															}}
															type="button"
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</div>
												);
											})}
										</div>
									) : null}
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="pt-2">
					<Button className="w-full" disabled={progress !== null} type="submit">
						{progress === null ? (
							"Save repair order"
						) : (
							<>
								<Loader2 className="size-4 animate-spin" /> {progress}
							</>
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
