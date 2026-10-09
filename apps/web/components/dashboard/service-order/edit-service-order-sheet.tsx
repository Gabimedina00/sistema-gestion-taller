"use client";

import { WATCH_MOVEMENT_TYPES, WATCH_SERVICES } from "@fixr/constants/watches";
import { updateServiceOrderSchema } from "@fixr/schemas/service-orders";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
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
import {
	type ServiceOrderDetails,
	serviceOrdersQueryKey,
	updateServiceOrder,
} from "@/lib/services/service-orders";
import { ToggleChips } from "./toggle-chips";

type FormInput = z.input<typeof updateServiceOrderSchema>;
type FormOutput = z.output<typeof updateServiceOrderSchema>;

function defaultsFrom(order: ServiceOrderDetails): FormInput {
	return {
		deviceModel: order.deviceModel,
		referenceNumber: order.referenceNumber ?? "",
		serialNumber: order.serialNumber ?? "",
		movementType: order.movementType,
		caliber: order.caliber ?? "",
		reportedDefect: order.reportedDefect,
		requestedServices: (order.requestedServices ??
			[]) as FormOutput["requestedServices"],
		intakeCondition: order.intakeCondition ?? "",
		estimatedCost: order.estimatedCost,
		estimatedDeliveryDate: order.estimatedDeliveryDate
			? toDateOnly(order.estimatedDeliveryDate)
			: null,
		warrantyDays: order.warrantyDays,
		observations: order.observations ?? "",
	};
}

/**
 * @description Edits the watch details, intake notes and quote of an order,
 * e.g. to set the price once the watch has been checked.
 */
export function EditServiceOrderSheet({
	order,
	subdomain,
}: {
	order: ServiceOrderDetails;
	subdomain: string;
}) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<FormInput, unknown, FormOutput>({
		resolver: zodResolver(updateServiceOrderSchema),
		defaultValues: defaultsFrom(order),
		mode: "all",
	});

	const save = useMutation({
		mutationFn: async (values: FormOutput) => {
			const result = await updateServiceOrder(subdomain, order.id, {
				...values,
				referenceNumber: values.referenceNumber || null,
				serialNumber: values.serialNumber || null,
				caliber: values.caliber || null,
				intakeCondition: values.intakeCondition || null,
				observations: values.observations || null,
				estimatedDeliveryDate: values.estimatedDeliveryDate
					? toDateOnly(values.estimatedDeliveryDate)
					: null,
			});
			if (result.error !== null) {
				throw new Error(result.error);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: serviceOrdersQueryKey(subdomain),
			});
			toast.success({ text: "Order updated" });
			setOpen(false);
		},
		onError: (error) => {
			toast.error({
				text: "Couldn't update the order",
				description: error.message,
			});
		},
	});

	return (
		<Sheet
			onOpenChange={(next) => {
				// Start from what's saved every time the sheet opens
				if (next) {
					form.reset(defaultsFrom(order));
				}
				setOpen(next);
			}}
			open={open}
		>
			<SheetTrigger asChild>
				<Button variant="outline">
					<Pencil className="size-4" /> Edit
				</Button>
			</SheetTrigger>
			<SheetContent className="overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Edit order</SheetTitle>
					<SheetDescription>
						Update the quote once the watch is checked, or fix any detail.
					</SheetDescription>
				</SheetHeader>
				<Form {...form}>
					<form
						className="space-y-4 px-4 pb-6"
						onSubmit={form.handleSubmit((values) => save.mutate(values))}
					>
						<div className="grid gap-4 sm:grid-cols-2">
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
														e.target.value === ""
															? null
															: e.target.valueAsNumber
													)
												}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="deviceModel"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Model</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
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
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
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
											<Input {...field} value={field.value ?? ""} />
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
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="reportedDefect"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Problem reported by the customer</FormLabel>
									<FormControl>
										<Textarea {...field} value={field.value ?? ""} />
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
									<FormLabel>Services</FormLabel>
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
										<Textarea {...field} value={field.value ?? ""} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="observations"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Internal notes</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Only visible to the shop"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button className="w-full" disabled={save.isPending} type="submit">
							{save.isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								"Save changes"
							)}
						</Button>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
