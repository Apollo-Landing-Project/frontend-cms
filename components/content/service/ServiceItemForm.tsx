"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import {
	Loader2,
	Plus,
	X,
	Phone,
	Mail,
	Sparkles,
	MapPin,
	Quote,
	ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getCroppedImg } from "@/utils/canvasUtils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadField } from "@/components/forms/FormComponents";
import { CropImageDialog } from "@/components/ui/crop-image-dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// --- 1. SCHEMA VALIDATION ---
const formSchema = z.object({
	// ID
	title: z.string().min(1, "Title (ID) required"),
	badge: z.string().min(1, "Badge (ID) required"),
	desc: z.string().min(1, "Description (ID) required"),
	quote: z.string().optional(),
	location: z.string().min(1, "Location (ID) required"),
	desc_sort: z.string().min(1, "Description Sort (ID) is required"),

	// EN
	title_en: z.string().min(1, "Title (EN) required"),
	badge_en: z.string().min(1, "Badge (EN) required"),
	desc_sort_en: z.string().min(1, "Description Sort (EN) is required"),
	desc_en: z.string().min(1, "Description (EN) required"),
	quote_en: z.string().optional(),
	location_en: z.string().min(1, "Location (EN) required"),

	// SHARED (Dynamic Lists - Array of Objects for useFieldArray)
	contact: z.array(z.object({ value: z.string().min(1, "Phone number is required") })),
	email: z.array(z.object({ value: z.string().email("Invalid email") })),
});

type FormValues = z.infer<typeof formSchema>;

interface ServiceItemFormProps {
	initialData?: any;
	isEditMode?: boolean;
}

const getErrorMessage = (error: any): string | null => {
	if (!error) return null;
	if (typeof error.message === "string") return error.message;
	if (typeof error === "object") {
		for (const key in error) {
			const msg = getErrorMessage(error[key]);
			if (msg) return msg;
		}
	}
	return null;
};

// --- 2. HELPER COMPONENT (FormInput) ---
interface FormInputProps {
	id: string;
	label: string;
	register: any;
	error?: any;
	textarea?: boolean;
	placeholder?: string;
}

const FormInput = ({
	id,
	label,
	register,
	error,
	textarea,
	placeholder,
}: FormInputProps) => (
	<div className="space-y-1.5 w-full">
		<Label
			htmlFor={id}
			className="text-xs font-semibold text-slate-500 uppercase tracking-wide"
		>
			{label}
		</Label>
		{textarea ?
			<Textarea
				id={id}
				{...register(id)}
				placeholder={placeholder}
				className={cn(
					"resize-none min-h-[100px] bg-slate-50 focus:bg-white transition-colors text-sm",
					error && "border-red-500 focus-visible:ring-red-500",
				)}
			/>
		:	<Input
				id={id}
				{...register(id)}
				placeholder={placeholder}
				className={cn(
					"bg-slate-50 focus:bg-white transition-colors h-9 text-sm",
					error && "border-red-500 focus-visible:ring-red-500",
				)}
			/>
		}
		{error && (
			<p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
				<X size={10} /> {error.message}
			</p>
		)}
	</div>
);

// --- 3. MAIN COMPONENT ---
export default function ServiceItemForm({
	initialData,
	isEditMode,
}: ServiceItemFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isTranslating, setIsTranslating] = useState(false);

	// Image State
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(
		initialData?.bg_image || null,
	);

	// Cropper State
	const [cropOpen, setCropOpen] = useState(false);
	const [cropSrc, setCropSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedArea, setCroppedArea] = useState(null);

	// Form Init
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			contact: [{ value: "" }],
			email: [{ value: "" }],
			title: "",
			desc_sort: "",
			badge: "",
			desc: "",
			quote: "",
			location: "",
			title_en: "",
			badge_en: "",
			desc_en: "",
			desc_sort_en: "",
			quote_en: "",
			location_en: "",
		},
	});

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
		reset,
		getValues,
		setValue,
	} = form;

	// Field Arrays (Dynamic Inputs)
	const {
		fields: contactFields,
		append: appendContact,
		remove: removeContact,
	} = useFieldArray({ control, name: "contact" });
	const {
		fields: emailFields,
		append: appendEmail,
		remove: removeEmail,
	} = useFieldArray({ control, name: "email" });

	// Prefill Data
	useEffect(() => {
		if (initialData) {
			// Mapping array string ["a", "b"] -> array object [{value: "a"}, {value: "b"}]
			const mapArray = (arr: string[]) =>
				arr?.length ? arr.map((s) => ({ value: s })) : [{ value: "" }];

			reset({
				title: initialData.serviceId?.title || "",
				badge: initialData.serviceId?.badge || "",
				desc: initialData.serviceId?.desc || "",
				desc_sort: initialData.serviceId?.desc_sort || "",
				quote: initialData.serviceId?.quote || "",
				location: initialData.serviceId?.location || "",
				title_en: initialData.serviceEn?.title || "",
				badge_en: initialData.serviceEn?.badge || "",
				desc_en: initialData.serviceEn?.desc || "",
				desc_sort_en: initialData.serviceEn?.desc_sort || "",
				quote_en: initialData.serviceEn?.quote || "",
				location_en: initialData.serviceEn?.location || "",
				contact: mapArray(initialData.serviceId?.contact),
				email: mapArray(initialData.serviceId?.email),
			});
		}
	}, [initialData, reset]);

	// --- HANDLERS ---

	const initiateCrop = (file: File) => {
		setCropSrc(URL.createObjectURL(file));
		setCropOpen(true);
		setZoom(1);
	};

	const handleSaveCrop = async () => {
		if (!cropSrc || !croppedArea) return;
		try {
			const croppedFile = await getCroppedImg(cropSrc, croppedArea);
			if (croppedFile) {
				setFile(croppedFile);
				setPreview(URL.createObjectURL(croppedFile));
				setCropOpen(false);
				toast.success("Image cropped!");
			}
		} catch {
			toast.error("Crop failed");
		}
	};

	// --- AUTO TRANSLATE (UPDATED WITH CHUNKING) ---
	const handleAutoTranslate = async (lang: string) => {
		setIsTranslating(true);
		let fieldMapping;

		if (lang == "en") {
			fieldMapping = [
				{ src: "title", dest: "title_en" },
				{ src: "badge", dest: "badge_en" },
				{ src: "desc", dest: "desc_en" },
				{ src: "desc_sort", dest: "desc_sort_en" },
				{ src: "quote", dest: "quote_en" },
				{ src: "location", dest: "location_en" },
			];
		} else {
			fieldMapping = [
				{ src: "title_en", dest: "title" },
				{ src: "badge_en", dest: "badge" },
				{ src: "desc_en", dest: "desc" },
				{ src: "desc_sort_en", dest: "desc_sort" },
				{ src: "quote_en", dest: "quote" },
				{ src: "location_en", dest: "location" },
			];
		}

		// Validate source fields
		const sourceKeys = fieldMapping.map((f) => f.src);
		const isValid = await form.trigger(sourceKeys as any);

		if (!isValid) {
			toast.error("Please fill in required fields first");
			setIsTranslating(false);
			return;
		}

		const textsToTranslate = fieldMapping.map(
			(f) => getValues(f.src as any) || "",
		);

		if (textsToTranslate.every((t) => t.trim() === "")) {
			setIsTranslating(false);
			return toast.error("Please fill ID content first.");
		}

		try {
			const CHUNK_SIZE = 3;
			const totalChunks = Math.ceil(textsToTranslate.length / CHUNK_SIZE);
			let finalTranslatedResults: string[] = [];

			for (let i = 0; i < totalChunks; i++) {
				const start = i * CHUNK_SIZE;
				const end = start + CHUNK_SIZE;
				const chunkTexts = textsToTranslate.slice(start, end);

				if (chunkTexts.length === 0) continue;

				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/translate`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ texts: chunkTexts, target_lang: lang }),
						cache: "no-store",
					},
				);

				const result = await response.json();
				if (!response.ok) throw new Error(result.message);

				const batchResult = result.data.translated_text || result.data;
				if (Array.isArray(batchResult)) {
					finalTranslatedResults = [...finalTranslatedResults, ...batchResult];
				}
			}

			fieldMapping.forEach((field, index) => {
				if (finalTranslatedResults[index]) {
					setValue(field.dest as any, finalTranslatedResults[index], {
						shouldValidate: true,
					});
				}
			});
			toast.success("Translation complete!");
		} catch (error: any) {
			toast.error("Translation failed: " + error.message);
		} finally {
			setIsTranslating(false);
		}
	};

	// --- SUBMIT ---
	const onSubmit = async (data: FormValues) => {
		if (!isEditMode && !file) return toast.error("Service Image is required");
		setIsLoading(true);

		const formData = new FormData();
		if (file) formData.append("bg_image", file);

		// Transform Data: Convert array object [{value: "a"}] back to string array ["a"]
		const payload = {
			...data,
			contact: data.contact.map((c) => c.value).filter((v) => v !== ""),
			email: data.email.map((e) => e.value).filter((v) => v !== ""),
		};

		Object.entries(payload).forEach(([key, val]) => {
			if (Array.isArray(val)) formData.append(key, JSON.stringify(val));
			else formData.append(key, String(val));
		});

		const url =
			isEditMode ?
				`${process.env.NEXT_PUBLIC_API_URL}/service/items/${initialData.id}`
			:	`${process.env.NEXT_PUBLIC_API_URL}/service/items`;

		const method = isEditMode ? "PUT" : "POST";

		try {
			const res = await fetch(url, {
				method,
				credentials: "include",
				body: formData,
			});
			if (!res.ok) throw new Error("Failed");
			toast.success(isEditMode ? "Service updated!" : "Service created!");
			setTimeout(() => {
				router.push("/admin/content/services-items");
			}, 500);
		} catch {
			toast.error("Error saving service");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-5xl mx-auto pb-20 space-y-8">
			{/* HEADER */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ArrowLeft size={20} />
					</Button>
					<h1 className="text-2xl font-bold">
						{isEditMode ? "Edit Service" : "Create New Service"}
					</h1>
				</div>
				<div>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => handleAutoTranslate("id")}
						disabled={isTranslating}
						className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
					>
						{isTranslating ?
							<Loader2 className="animate-spin mr-2 h-4 w-4" />
						:	<Sparkles className="mr-2 h-4 w-4" />}
						Auto Translate (EN → ID)
					</Button>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => handleAutoTranslate("en")}
						disabled={isTranslating}
						className="text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
					>
						{isTranslating ?
							<Loader2 className="animate-spin mr-2 h-4 w-4" />
						:	<Sparkles className="mr-2 h-4 w-4" />}
						Auto Translate (ID → EN)
					</Button>
				</div>
			</div>

			<form
				onSubmit={handleSubmit(onSubmit, (errors) => {
					const msg = getErrorMessage(errors);
					if (msg) {
						toast.error(msg);
					} else {
						toast.error("Please check the form for errors");
					}
					console.error("Form Errors:", errors);
				})}
				className="space-y-8"
			>
				{/* 1. IMAGE UPLOAD */}
				<Card>
					<CardHeader>
						<CardTitle>Service Image (392:325)</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="max-w-md">
							<ImageUploadField
								label="Background Image"
								preview={preview}
								onFileSelect={initiateCrop}
								isNew={!!file}
								aspectClass="aspect-[392/325]"
							/>
						</div>
					</CardContent>
				</Card>

				{/* 2. SHARED INFO (CONTACT & EMAIL) */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<Card className="h-fit">
						<CardHeader className="bg-slate-50/50 border-b pb-3">
							<CardTitle className="flex gap-2 text-base">
								<Phone className="w-4 h-4 text-slate-500" /> Phone Numbers
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-4 space-y-3">
							{contactFields.map((f, i) => (
								<div key={f.id} className="flex gap-2">
									<div className="w-full">
										<Input
											{...register(`contact.${i}.value`)}
											placeholder="+62..."
											className={
												errors.contact?.[i]?.value ? "border-red-500" : ""
											}
										/>
										{errors.contact?.[i]?.value && (
											<p className="text-[10px] text-red-500 mt-1">Required</p>
										)}
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeContact(i)}
										className="text-red-500 hover:bg-red-50"
									>
										<X size={16} />
									</Button>
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => appendContact({ value: "" })}
								className="w-full h-8 text-xs border-dashed border-slate-300 hover:border-slate-400 text-slate-500"
							>
								<Plus size={14} className="mr-1" /> Add Phone
							</Button>
						</CardContent>
					</Card>
					<Card className="h-fit">
						<CardHeader className="bg-slate-50/50 border-b pb-3">
							<CardTitle className="flex gap-2 text-base">
								<Mail className="w-4 h-4 text-slate-500" /> Emails
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-4 space-y-3">
							{emailFields.map((f, i) => (
								<div key={f.id} className="flex gap-2">
									<div className="w-full">
										<Input
											{...register(`email.${i}.value`)}
											placeholder="sales@example.com"
											className={
												errors.email?.[i]?.value ? "border-red-500" : ""
											}
										/>
										{errors.email?.[i]?.value && (
											<p className="text-[10px] text-red-500 mt-1">
												Invalid Email
											</p>
										)}
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeEmail(i)}
										className="text-red-500 hover:bg-red-50"
									>
										<X size={16} />
									</Button>
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => appendEmail({ value: "" })}
								className="w-full h-8 text-xs border-dashed border-slate-300 hover:border-slate-400 text-slate-500"
							>
								<Plus size={14} className="mr-1" /> Add Email
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* 3. MULTILINGUAL TABS */}
				<Tabs defaultValue="id" className="w-full">
					<TabsList className="w-full justify-start bg-slate-100 p-1 rounded-lg mb-4">
						<TabsTrigger
							value="id"
							className="flex-1 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
						>
							🇮🇩 Indonesia
						</TabsTrigger>
						<TabsTrigger
							value="en"
							className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
						>
							🇺🇸 English
						</TabsTrigger>
					</TabsList>

					{/* CONTENT ID */}
					<TabsContent value="id" className="space-y-6 mt-0">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">Content (ID)</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormInput
									id="title"
									label="Service Title"
									register={register}
									error={errors.title}
								/>
								<FormInput
									id="badge"
									label="Service Badge"
									register={register}
									error={errors.badge}
								/>
								<FormInput
									id="desc"
									label="Description"
									textarea
									register={register}
									error={errors.desc}
								/>
								<FormInput
									id="desc_sort"
									label="Description Sort"
									textarea
									register={register}
									error={errors.desc}
								/>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex gap-1">
											<MapPin size={12} /> Location
										</Label>
										<Input
											{...register("location")}
											className="bg-slate-50"
											placeholder="e.g. Jakarta Pusat"
										/>
										{errors.location && (
											<p className="text-[10px] text-red-500 mt-1">
												{errors.location.message}
											</p>
										)}
									</div>
									<div>
										<Label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex gap-1">
											<Quote size={12} /> Quote (Optional)
										</Label>
										<Input
											{...register("quote")}
											className="bg-slate-50"
											placeholder="Short tagline..."
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* CONTENT EN */}
					<TabsContent value="en" className="space-y-6 mt-0">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">Content (EN)</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormInput
									id="title_en"
									label="Service Title"
									register={register}
									error={errors.title_en}
								/>
								<FormInput
									id="badge_en"
									label="Service Badge (EN)"
									register={register}
									error={errors.badge_en}
								/>
								<FormInput
									id="desc_en"
									label="Description"
									textarea
									register={register}
									error={errors.desc_en}
								/>
								<FormInput
									id="desc_sort_en"
									label="Description Sort"
									textarea
									register={register}
									error={errors.desc_en}
								/>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex gap-1">
											<MapPin size={12} /> Location
										</Label>
										<Input
											{...register("location_en")}
											className="bg-slate-50"
											placeholder="e.g. Central Jakarta"
										/>
										{errors.location_en && (
											<p className="text-[10px] text-red-500 mt-1">
												{errors.location_en.message}
											</p>
										)}
									</div>
									<div>
										<Label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex gap-1">
											<Quote size={12} /> Quote (Optional)
										</Label>
										<Input
											{...register("quote_en")}
											className="bg-slate-50"
											placeholder="Short tagline..."
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* SUBMIT */}
				<div className="flex justify-end pt-6 border-t">
					<Button
						type="submit"
						size="lg"
						disabled={isLoading}
						className="min-w-[150px]"
					>
						{isLoading ?
							<Loader2 className="animate-spin mr-2" />
						:	null}
						{isEditMode ? "Save Changes" : "Create Service"}
					</Button>
				</div>
			</form>

			{/* CROPPER */}
			<CropImageDialog
				isOpen={cropOpen}
				onClose={setCropOpen}
				onSave={handleSaveCrop}
				imageSrc={cropSrc}
				crop={crop}
				setCrop={setCrop}
				zoom={zoom}
				setZoom={setZoom}
				aspect={392 / 325}
				setCroppedAreaPixels={setCroppedArea}
			/>
		</div>
	);
}
