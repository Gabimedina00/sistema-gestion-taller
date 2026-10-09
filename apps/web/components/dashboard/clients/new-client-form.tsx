"use client";

import { dni, phone, unmask } from "@fixr/constants/masks";
import { createClientSchema } from "@fixr/schemas/clients";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMaskito } from "@maskito/react";
import { toast } from "@pheralb/toast";
import {
	Building,
	IdCard,
	Loader2,
	Mail,
	MapPin,
	PhoneIcon,
	User,
} from "lucide-react";
import { useParams } from "next/navigation";
import { type ComponentPropsWithoutRef, useState } from "react";
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
import { type Client, createClient } from "@/lib/services/clients";
import { cn } from "@/lib/utils";

export function NewClientForm({
	onCustomerCreated,
	cols = 1,
	className,
	...props
}: {
	onCustomerCreated: (client: Client) => void;
	cols?: number;
} & ComponentPropsWithoutRef<"form">) {
	const { subdomain } = useParams<{ subdomain: string }>();
	const [loading, setLoading] = useState(false);

	const form = useForm<z.infer<typeof createClientSchema>>({
		resolver: zodResolver(createClientSchema),
		defaultValues: {
			name: "",
			email: "",
			dni: "",
			phone: "",
			address: "",
			province: "Corrientes",
			city: "",
		},
		mode: "all",
	});

	const dniMask = useMaskito({ options: { mask: dni } });
	const phoneMask = useMaskito({ options: { mask: phone } });

	async function onSubmit(values: z.infer<typeof createClientSchema>) {
		setLoading(true);

		const result = await createClient(subdomain, {
			...values,
			dni: unmask.dni(values.dni),
			phone: unmask.phone(values.phone) ?? "",
			email: values.email || null,
			address: values.address || null,
			city: values.city || null,
			province: values.province || null,
		});

		setLoading(false);

		if (result.error !== null) {
			toast.error({
				text: "Couldn't add the customer",
				description: result.error,
			});
			return;
		}

		toast.success({ text: `${result.data.name} was added.` });
		form.reset();
		onCustomerCreated(result.data);
	}

	return (
		<Form {...form}>
			<form
				className={cn("space-y-3", className)}
				onSubmit={form.handleSubmit(onSubmit)}
				{...props}
			>
				<div
					className={cn(
						"grid grid-cols-1 gap-4",
						cols === 2 && "md:grid-cols-2"
					)}
				>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<User className="inline-block size-3.5" /> Name
								</FormLabel>
								<FormControl>
									<Input placeholder="Juan Pérez" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Mail className="inline-block size-3.5" /> Email
								</FormLabel>
								<FormControl>
									<Input
										placeholder="juan.perez@gmail.com"
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
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<PhoneIcon className="inline-block size-3.5" /> Phone
								</FormLabel>
								<FormControl>
									<Input
										inputMode="tel"
										placeholder="3794123456"
										{...field}
										onInput={(e) =>
											form.setValue("phone", e.currentTarget.value)
										}
										ref={phoneMask}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="dni"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<IdCard className="inline-block size-3.5" /> DNI
								</FormLabel>
								<FormControl>
									<Input
										inputMode="numeric"
										placeholder="30123456"
										{...field}
										onInput={(e) => form.setValue("dni", e.currentTarget.value)}
										ref={dniMask}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="address"
						render={({ field }) => (
							<FormItem className="col-span-full">
								<FormLabel>
									<MapPin className="inline-block size-3.5" /> Address
								</FormLabel>
								<FormControl>
									<Input
										placeholder="Street and number"
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
						name="province"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Building className="inline-block size-3.5" /> Province
								</FormLabel>
								<FormControl>
									<Input
										placeholder="Corrientes"
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
						name="city"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Building className="inline-block size-3.5" /> City
								</FormLabel>
								<FormControl>
									<Input
										placeholder="Corrientes"
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<Button className="mt-4 w-full" disabled={loading} type="submit">
					Add customer{" "}
					{loading ? <Loader2 className="animate-spin" /> : <User />}
				</Button>
			</form>
		</Form>
	);
}
