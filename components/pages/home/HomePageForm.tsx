"use client";

import React, { useState, useEffect } from "react";
import { useForm, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast, { Toaster } from "react-hot-toast";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
	Loader2,
	UploadCloud,
	X,
	Sparkles,
	RefreshCw,
	Image as ImageIcon,
	LayoutTemplate,
	Info,
	Briefcase,
	Newspaper,
	Handshake,
	Phone,
	Globe,
	Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCroppedImg } from "@/utils/canvasUtils";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";

// --- 1. TYPES & INTERFACES ---

// Interface untuk Initial Data dari Backend (Menggantikan 'any')
interface HomePageContent {
	hero_title?: string;
	hero_desc?: string;
	about_us_title?: string;
	about_us_desc?: string;
	services_title?: string;
	services_desc?: string;
	news_title?: string;
	news_desc?: string;
	partners_title?: string;
	partners_desc?: string;
	contact_title?: string;
	contact_desc?: string;
}

interface HomePageData {
	id: string;
	hero_bg: string[];
	about_us_years_exp: number;
	about_us_products: number;
	about_us_countries: number;
	about_us_brands: number;
	contact_email: string[];
	contact_phone: string[];
	contact_link_map?: string;
	contact_address?: string;
	homePageId?: HomePageContent;
	homePageEn?: HomePageContent;
}

// --- 2. SCHEMA VALIDATION ---
const baseSchema = z.object({
	about_us_years_exp: z.coerce.number().min(0),
	about_us_products: z.coerce.number().min(0),
	about_us_countries: z.coerce.number().min(0),
	about_us_brands: z.coerce.number().min(0),
	contact_email: z.string().min(1, "Email is required"),
	contact_phone: z.string().min(1, "Phone is required"),
	contact_link_map: z.string().url().or(z.literal("")),
	contact_address: z.string().min(1, "Address is required"),

	// ID
	hero_title: z.string().min(1, "Required"),
	hero_desc: z.string().min(1, "Required"),
	about_us_title: z.string().min(1, "Required"),
	about_us_desc: z.string().min(1, "Required"),
	services_title: z.string().min(1, "Required"),
	services_desc: z.string().min(1, "Required"),
	news_title: z.string().min(1, "Required"),
	news_desc: z.string().min(1, "Required"),
	partners_title: z.string().min(1, "Required"),
	partners_desc: z.string().min(1, "Required"),
	contact_title: z.string().min(1, "Required"),
	contact_desc: z.string().min(1, "Required"),

	// EN
	hero_title_en: z.string().min(1, "Required"),
	hero_desc_en: z.string().min(1, "Required"),
	about_us_title_en: z.string().min(1, "Required"),
	about_us_desc_en: z.string().min(1, "Required"),
	services_title_en: z.string().min(1, "Required"),
	services_desc_en: z.string().min(1, "Required"),
	news_title_en: z.string().min(1, "Required"),
	news_desc_en: z.string().min(1, "Required"),
	partners_title_en: z.string().min(1, "Required"),
	partners_desc_en: z.string().min(1, "Required"),
	contact_title_en: z.string().min(1, "Required"),
	contact_desc_en: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof baseSchema>;

// --- 3. HELPER COMPONENTS ---

interface FormInputProps {
	id: string;
	label: string;
	register: UseFormRegister<any>;
	error?: any;
	textarea?: boolean;
	type?: string;
	placeholder?: string;
}

const FormInput = ({
	id,
	label,
	register,
	error,
	textarea,
	type = "text",
	placeholder,
}: FormInputProps) => (
	<div className="space-y-1.5 w-full">
		<Label
			htmlFor={id}
			className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex justify-between"
		>
			{label}
		</Label>
		{textarea ?
			<Textarea
				id={id}
				{...register(id)}
				placeholder={placeholder}
				className={cn(
					"resize-none min-h-[80px] bg-slate-50 focus:bg-white transition-colors text-sm",
					error && "border-red-500 focus-visible:ring-red-500",
				)}
			/>
		:	<Input
				id={id}
				type={type}
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

const SectionGroup = ({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon?: React.ElementType; // Fix type for Icon
	children: React.ReactNode;
}) => (
	<div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
		<div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
			{Icon && <Icon className="w-4 h-4 text-slate-500" />}
			<h5 className="font-semibold text-sm text-slate-800">{title}</h5>
		</div>
		<div className="p-4 space-y-4">{children}</div>
	</div>
);

// --- 4. MAIN COMPONENT ---

interface HomePageFormProps {
	initialData?: HomePageData; // Ganti 'any' dengan Interface
	isEditMode?: boolean;
}

export default function HomePageForm({
	initialData,
	isEditMode = false,
}: HomePageFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isTranslating, setIsTranslating] = useState(false);

	// Image Slots Type
	type ImageSlot =
		| { type: "url"; url: string }
		| { type: "file"; file: File; preview: string }
		| null;
	const [slots, setSlots] = useState<ImageSlot[]>([null, null, null]);

	// Cropper State
	const [isCropOpen, setIsCropOpen] = useState(false);
	const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
	const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);

	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

	const form = useForm({
		resolver: zodResolver(baseSchema),
		defaultValues: {
			about_us_years_exp: 0,
			about_us_products: 0,
			about_us_countries: 0,
			about_us_brands: 0,
			contact_email: "",
			contact_phone: "",
			contact_link_map: "",
			contact_address: "",
			hero_title: "",
			hero_desc: "",
			about_us_title: "",
			about_us_desc: "",
			services_title: "",
			services_desc: "",
			news_title: "",
			news_desc: "",
			partners_title: "",
			partners_desc: "",
			contact_title: "",
			contact_desc: "",
			hero_title_en: "",
			hero_desc_en: "",
			about_us_title_en: "",
			about_us_desc_en: "",
			services_title_en: "",
			services_desc_en: "",
			news_title_en: "",
			news_desc_en: "",
			partners_title_en: "",
			partners_desc_en: "",
			contact_title_en: "",
			contact_desc_en: "",
		},
	});

	// --- PREFILL DATA ---
	useEffect(() => {
		if (isEditMode && initialData) {
			// Images
			const loadedSlots: ImageSlot[] = [null, null, null];
			if (initialData.hero_bg && Array.isArray(initialData.hero_bg)) {
				initialData.hero_bg.forEach((url: string, idx: number) => {
					if (idx < 3) loadedSlots[idx] = { type: "url", url };
				});
			}
			setSlots(loadedSlots);

			// Fields Mapping
			const flatData = {
				// Base
				about_us_years_exp: initialData.about_us_years_exp,
				about_us_products: initialData.about_us_products,
				about_us_countries: initialData.about_us_countries,
				about_us_brands: initialData.about_us_brands,
				contact_link_map: initialData.contact_link_map || "",
				contact_address: initialData.contact_address || "",

				// Arrays to String
				contact_email:
					Array.isArray(initialData.contact_email) ?
						initialData.contact_email.join(", ")
					:	"",
				contact_phone:
					Array.isArray(initialData.contact_phone) ?
						initialData.contact_phone.join(", ")
					:	"",

				// ID Content
				hero_title: initialData.homePageId?.hero_title || "",
				hero_desc: initialData.homePageId?.hero_desc || "",
				about_us_title: initialData.homePageId?.about_us_title || "",
				about_us_desc: initialData.homePageId?.about_us_desc || "",
				services_title: initialData.homePageId?.services_title || "",
				services_desc: initialData.homePageId?.services_desc || "",
				news_title: initialData.homePageId?.news_title || "",
				news_desc: initialData.homePageId?.news_desc || "",
				partners_title: initialData.homePageId?.partners_title || "",
				partners_desc: initialData.homePageId?.partners_desc || "",
				contact_title: initialData.homePageId?.contact_title || "",
				contact_desc: initialData.homePageId?.contact_desc || "",

				// EN Content
				hero_title_en: initialData.homePageEn?.hero_title || "",
				hero_desc_en: initialData.homePageEn?.hero_desc || "",
				about_us_title_en: initialData.homePageEn?.about_us_title || "",
				about_us_desc_en: initialData.homePageEn?.about_us_desc || "",
				services_title_en: initialData.homePageEn?.services_title || "",
				services_desc_en: initialData.homePageEn?.services_desc || "",
				news_title_en: initialData.homePageEn?.news_title || "",
				news_desc_en: initialData.homePageEn?.news_desc || "",
				partners_title_en: initialData.homePageEn?.partners_title || "",
				partners_desc_en: initialData.homePageEn?.partners_desc || "",
				contact_title_en: initialData.homePageEn?.contact_title || "",
				contact_desc_en: initialData.homePageEn?.contact_desc || "",
			};

			// Reset form with new values
			// Note: We need to cast this because 'reset' expects the inferred values
			form.reset(flatData as any);
		}
	}, [initialData, isEditMode, form]);

	// --- IMAGE & CROP HANDLERS ---
	const handleFileSelect = (
		e: React.ChangeEvent<HTMLInputElement>,
		index: number,
	) => {
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0];
			setActiveSlotIndex(index);
			setCropImageSrc(URL.createObjectURL(file));
			setZoom(1);
			setIsCropOpen(true);
			e.target.value = "";
		}
	};

	const handleSaveCrop = async () => {
		if (!cropImageSrc || !croppedAreaPixels || activeSlotIndex === null) return;
		try {
			const croppedFile = await getCroppedImg(cropImageSrc, croppedAreaPixels);
			if (croppedFile) {
				const newSlots = [...slots];
				newSlots[activeSlotIndex] = {
					type: "file",
					file: croppedFile,
					preview: URL.createObjectURL(croppedFile),
				};
				setSlots(newSlots);
				setIsCropOpen(false);
				setCropImageSrc(null);
				setActiveSlotIndex(null);
				toast.success("Image cropped!");
			}
		} catch {
			toast.error("Crop failed");
		}
	};

	// --- TRANSLATE HANDLER ---
	const handleAutoTranslate = async () => {
		setIsTranslating(true);

		const fieldMapping = [
			{ src: "hero_title", dest: "hero_title_en" },
			{ src: "hero_desc", dest: "hero_desc_en" },
			{ src: "about_us_title", dest: "about_us_title_en" },
			{ src: "about_us_desc", dest: "about_us_desc_en" },
			{ src: "services_title", dest: "services_title_en" },
			{ src: "services_desc", dest: "services_desc_en" },
			{ src: "news_title", dest: "news_title_en" },
			{ src: "news_desc", dest: "news_desc_en" },
			{ src: "partners_title", dest: "partners_title_en" },
			{ src: "partners_desc", dest: "partners_desc_en" },
			{ src: "contact_title", dest: "contact_title_en" },
			{ src: "contact_desc", dest: "contact_desc_en" },
		];

		const textsToTranslate = fieldMapping.map(
			(f) => form.getValues(f.src as any) || "",
		);

		if (textsToTranslate.every((t) => t.trim() === "")) {
			toast.error("Please fill Indonesian content first.");
			setIsTranslating(false);
			return;
		}

		const CHUNK_SIZE = 3;
		const totalChunks = Math.ceil(textsToTranslate.length / CHUNK_SIZE);
		let finalTranslatedResults: string[] = [];

		try {
			for (let i = 0; i < totalChunks; i++) {
				const start = i * CHUNK_SIZE;
				const end = start + CHUNK_SIZE;
				const chunkTexts = textsToTranslate.slice(start, end);

				if (chunkTexts.length === 0) continue;

				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/translate`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: "include",
						body: JSON.stringify({ texts: chunkTexts, target_lang: "en" }),
					},
				);

				const textResponse = await response.text();
				let result;
				try {
					result = JSON.parse(textResponse);
				} catch {
					throw new Error("Translation service error");
				}

				if (!response.ok)
					throw new Error(result.message || "Failed to translate");

				const batchResult = result.data.translated_text || result.data;
				if (Array.isArray(batchResult)) {
					finalTranslatedResults = [...finalTranslatedResults, ...batchResult];
				}
			}

			fieldMapping.forEach((field, index) => {
				if (finalTranslatedResults[index]) {
					form.setValue(field.dest as any, finalTranslatedResults[index], {
						shouldValidate: true,
					});
				}
			});
			toast.success("Auto Translate Complete!");
		} catch (error: any) {
			toast.error(error.message || "Translation Error");
		} finally {
			setIsTranslating(false);
		}
	};

	// --- SUBMIT ---
	// Gunakan tipe FormValues di sini agar data ter-type dengan benar
	const onSubmit = async (data: FormValues) => {
		if (slots.some((s) => s === null))
			return toast.error("Please fill all 3 image slots.");

		setIsLoading(true);
		const formData = new FormData();
		const imageStatus: string[] = [];

		slots.forEach((slot) => {
			if (slot?.type === "file") {
				imageStatus.push("change");
				formData.append("hero_bg", slot.file);
			} else {
				imageStatus.push("keep");
			}
		});

		formData.append("image_status", JSON.stringify(imageStatus));
		formData.append("prefix", "homepage");

		Object.entries(data).forEach(([key, value]) => {
			if (
				(key === "contact_email" || key === "contact_phone") &&
				typeof value === "string"
			) {
				const arr = value.split(",").map((s) => s.trim());
				arr.forEach((val) => formData.append(key, val));
			} else {
				formData.append(key, String(value));
			}
		});

		// Handle URL based on mode
		const url =
			isEditMode && initialData?.id ?
				`${process.env.NEXT_PUBLIC_API_URL}/page/home/${initialData.id}`
			:	`${process.env.NEXT_PUBLIC_API_URL}/page/home`;
		const method = isEditMode ? "PUT" : "POST";

		try {
			const res = await fetch(url, {
				method,
				credentials: "include",
				body: formData,
			});
			const result = await res.json();

			if (!res.ok) throw new Error(result.message);
			toast.success(
				isEditMode ? "Updated successfully" : "Created successfully",
			);
		} catch (e: any) {
			toast.error(e.message || "Failed to submit");
		} finally {
			setIsLoading(false);
		}
	};

	const { errors } = form.formState;

	return (
		<div className="space-y-8">
			<Toaster position="top-right" />

			{/* HEADER CONTROLS */}
			<div className="flex justify-end items-center mb-2">
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={handleAutoTranslate}
					disabled={isTranslating}
					className="text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
				>
					{isTranslating ?
						<Loader2 className="animate-spin mr-2 h-4 w-4" />
					:	<Sparkles className="mr-2 h-4 w-4" />}
					Auto Translate (ID → EN)
				</Button>
			</div>

			<form onSubmit={form.handleSubmit(onSubmit)}>
				{/* ... (BAGIAN UI IMAGE, SAMA SEPERTI SEBELUMNYA) ... */}
				{/* ... Paste ulang bagian Card Image di sini ... */}
				<Card className="mb-8 border-slate-200 shadow-sm">
					<CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
						<CardTitle className="flex items-center gap-2 text-base text-slate-800">
							<ImageIcon className="h-5 w-5 text-blue-600" /> Hero Banners (3
							Slots)
						</CardTitle>
						<CardDescription>
							Upload 3 landscape images (16:9). Click image to change.
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{[0, 1, 2].map((idx) => (
								<div key={idx} className="space-y-2">
									<div className="flex justify-between items-center px-1">
										<Label className="text-xs font-semibold text-slate-500">
											SLOT {idx + 1}
										</Label>
										{slots[idx]?.type === "file" && (
											<Badge className="bg-blue-100 text-blue-700 text-[10px] hover:bg-blue-100">
												New
											</Badge>
										)}
										{slots[idx]?.type === "url" && (
											<Badge
												variant="outline"
												className="text-[10px] text-slate-500"
											>
												Existing
											</Badge>
										)}
									</div>

									<div className="aspect-video border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center relative overflow-hidden bg-white group hover:border-blue-400 transition-all">
										{slots[idx] ?
											<>
												<Image
													height={225}
													width={400}
													src={
														slots[idx]?.type === "file" ?
															(slots[idx] as any).preview
														:	(slots[idx] as any).url
													}
													alt={`slot-${idx}`}
													className="w-full h-full object-cover transition-transform group-hover:scale-105"
												/>
												<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
													<label className="cursor-pointer bg-white text-slate-900 p-2.5 rounded-full hover:bg-blue-50 transition-colors shadow-lg">
														<RefreshCw size={18} className="text-blue-600" />
														<input
															type="file"
															className="hidden"
															accept="image/*"
															onChange={(e) => handleFileSelect(e, idx)}
														/>
													</label>
												</div>
											</>
										:	<label className="cursor-pointer flex flex-col items-center p-4 w-full h-full justify-center hover:bg-slate-50/50 transition-colors">
												<div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-blue-50">
													<UploadCloud className="text-slate-400 h-6 w-6 group-hover:text-blue-500" />
												</div>
												<span className="text-xs text-slate-600 font-medium">
													Click to Upload
												</span>
												<input
													type="file"
													className="hidden"
													accept="image/*"
													onChange={(e) => handleFileSelect(e, idx)}
												/>
											</label>
										}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* ... (BAGIAN UI INPUT GRID, SAMA SEPERTI SEBELUMNYA) ... */}
				{/* Paste ulang Grid Input dan Tabs di sini (tidak ada perubahan pada bagian JSX) */}

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					{/* === LEFT COLUMN: GLOBAL CONFIGS (Col-Span-4) === */}
					<div className="lg:col-span-4 space-y-6">
						{/* STATS */}
						<Card className="border-slate-200 shadow-sm h-fit">
							<CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
								<CardTitle className="text-sm font-semibold flex items-center gap-2">
									<Globe className="w-4 h-4 text-emerald-600" /> Statistics
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 space-y-4">
								<div className="grid grid-cols-2 gap-3">
									<FormInput
										id="about_us_years_exp"
										label="Years"
										type="number"
										register={form.register}
										error={errors.about_us_years_exp}
									/>
									<FormInput
										id="about_us_products"
										label="Products"
										type="number"
										register={form.register}
										error={errors.about_us_products}
									/>
									<FormInput
										id="about_us_countries"
										label="Countries"
										type="number"
										register={form.register}
										error={errors.about_us_countries}
									/>
									<FormInput
										id="about_us_brands"
										label="Brands"
										type="number"
										register={form.register}
										error={errors.about_us_brands}
									/>
								</div>
							</CardContent>
						</Card>

						{/* CONTACT INFO */}
						<Card className="border-slate-200 shadow-sm h-fit">
							<CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
								<CardTitle className="text-sm font-semibold flex items-center gap-2">
									<Phone className="w-4 h-4 text-orange-600" /> Contact Info
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 space-y-4">
								<FormInput
									id="contact_email"
									label="Emails (comma separated)"
									placeholder="email@web.com, ..."
									register={form.register}
									error={errors.contact_email}
								/>
								<FormInput
									id="contact_phone"
									label="Phones (comma separated)"
									placeholder="0812..., 021..."
									register={form.register}
									error={errors.contact_phone}
								/>
								<FormInput
									id="contact_link_map"
									label="Google Map Link"
									register={form.register}
									error={errors.contact_link_map}
								/>
								<FormInput
									id="contact_address"
									label="Full Address"
									textarea
									register={form.register}
									error={errors.contact_address}
								/>
							</CardContent>
						</Card>
					</div>

					{/* === RIGHT COLUMN: TABS CONTENT (Col-Span-8) === */}
					<div className="lg:col-span-8">
						<Tabs defaultValue="id" className="w-full">
							<TabsList className="w-full justify-start bg-slate-100 p-1 mb-4 border border-slate-200 rounded-lg">
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

							{/* === CONTENT INDONESIA === */}
							<TabsContent
								value="id"
								className="space-y-6 animate-in fade-in-50"
							>
								{/* 1. HERO */}
								<SectionGroup title="Hero Section" icon={LayoutTemplate}>
									<FormInput
										id="hero_title"
										label="Hero Title"
										register={form.register}
										error={errors.hero_title}
									/>
									<FormInput
										id="hero_desc"
										label="Hero Description"
										textarea
										register={form.register}
										error={errors.hero_desc}
									/>
								</SectionGroup>

								{/* 2. ABOUT US */}
								<SectionGroup title="About Us Section" icon={Info}>
									<FormInput
										id="about_us_title"
										label="About Title"
										register={form.register}
										error={errors.about_us_title}
									/>
									<FormInput
										id="about_us_desc"
										label="About Description"
										textarea
										register={form.register}
										error={errors.about_us_desc}
									/>
								</SectionGroup>

								{/* 3. SERVICES */}
								<SectionGroup title="Services Section" icon={Briefcase}>
									<FormInput
										id="services_title"
										label="Services Title"
										register={form.register}
										error={errors.services_title}
									/>
									<FormInput
										id="services_desc"
										label="Services Description"
										textarea
										register={form.register}
										error={errors.services_desc}
									/>
								</SectionGroup>

								{/* 4. NEWS */}
								<SectionGroup title="News Section" icon={Newspaper}>
									<FormInput
										id="news_title"
										label="News Title"
										register={form.register}
										error={errors.news_title}
									/>
									<FormInput
										id="news_desc"
										label="News Description"
										textarea
										register={form.register}
										error={errors.news_desc}
									/>
								</SectionGroup>

								{/* 5. PARTNERS */}
								<SectionGroup title="Partners Section" icon={Handshake}>
									<FormInput
										id="partners_title"
										label="Partners Title"
										register={form.register}
										error={errors.partners_title}
									/>
									<FormInput
										id="partners_desc"
										label="Partners Description"
										textarea
										register={form.register}
										error={errors.partners_desc}
									/>
								</SectionGroup>

								{/* 6. CONTACT FOOTER */}
								<SectionGroup title="Contact Footer Section" icon={Mail}>
									<FormInput
										id="contact_title"
										label="Contact Title"
										register={form.register}
										error={errors.contact_title}
									/>
									<FormInput
										id="contact_desc"
										label="Contact Description"
										textarea
										register={form.register}
										error={errors.contact_desc}
									/>
								</SectionGroup>
							</TabsContent>

							{/* === CONTENT ENGLISH === */}
							<TabsContent
								value="en"
								className="space-y-6 animate-in fade-in-50"
							>
								{/* 1. HERO */}
								<SectionGroup title="Hero Section (EN)" icon={LayoutTemplate}>
									<FormInput
										id="hero_title_en"
										label="Hero Title"
										register={form.register}
										error={errors.hero_title_en}
									/>
									<FormInput
										id="hero_desc_en"
										label="Hero Description"
										textarea
										register={form.register}
										error={errors.hero_desc_en}
									/>
								</SectionGroup>

								{/* 2. ABOUT US */}
								<SectionGroup title="About Us Section (EN)" icon={Info}>
									<FormInput
										id="about_us_title_en"
										label="About Title"
										register={form.register}
										error={errors.about_us_title_en}
									/>
									<FormInput
										id="about_us_desc_en"
										label="About Description"
										textarea
										register={form.register}
										error={errors.about_us_desc_en}
									/>
								</SectionGroup>

								{/* 3. SERVICES */}
								<SectionGroup title="Services Section (EN)" icon={Briefcase}>
									<FormInput
										id="services_title_en"
										label="Services Title"
										register={form.register}
										error={errors.services_title_en}
									/>
									<FormInput
										id="services_desc_en"
										label="Services Description"
										textarea
										register={form.register}
										error={errors.services_desc_en}
									/>
								</SectionGroup>

								{/* 4. NEWS */}
								<SectionGroup title="News Section (EN)" icon={Newspaper}>
									<FormInput
										id="news_title_en"
										label="News Title"
										register={form.register}
										error={errors.news_title_en}
									/>
									<FormInput
										id="news_desc_en"
										label="News Description"
										textarea
										register={form.register}
										error={errors.news_desc_en}
									/>
								</SectionGroup>

								{/* 5. PARTNERS */}
								<SectionGroup title="Partners Section (EN)" icon={Handshake}>
									<FormInput
										id="partners_title_en"
										label="Partners Title"
										register={form.register}
										error={errors.partners_title_en}
									/>
									<FormInput
										id="partners_desc_en"
										label="Partners Description"
										textarea
										register={form.register}
										error={errors.partners_desc_en}
									/>
								</SectionGroup>

								{/* 6. CONTACT FOOTER */}
								<SectionGroup title="Contact Footer Section (EN)" icon={Mail}>
									<FormInput
										id="contact_title_en"
										label="Contact Title"
										register={form.register}
										error={errors.contact_title_en}
									/>
									<FormInput
										id="contact_desc_en"
										label="Contact Description"
										textarea
										register={form.register}
										error={errors.contact_desc_en}
									/>
								</SectionGroup>
							</TabsContent>
						</Tabs>
					</div>
				</div>

				{/* SUBMIT */}
				<div className="flex justify-end pt-8 pb-10 border-t mt-8">
					<Button
						type="submit"
						size="lg"
						disabled={isLoading}
						className="w-full md:w-auto min-w-[200px]"
					>
						{isLoading ?
							<Loader2 className="animate-spin mr-2" />
						:	null}
						{isEditMode ? "Save Changes" : "Create Home Page"}
					</Button>
				</div>
			</form>

			{/* CROPPER */}
			<Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
				<DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
					<DialogHeader className="p-4 border-b bg-white">
						<DialogTitle>Crop Image (16:9)</DialogTitle>
					</DialogHeader>
					<div className="h-[400px] relative bg-slate-950">
						{cropImageSrc && (
							<Cropper
								image={cropImageSrc}
								crop={crop}
								zoom={zoom}
								aspect={16 / 9}
								onCropChange={setCrop}
								onCropComplete={(a, b) => setCroppedAreaPixels(b)}
								onZoomChange={setZoom}
							/>
						)}
					</div>
					<div className="p-4 bg-slate-50 flex items-center gap-4">
						<Label>Zoom</Label>
						<Slider
							value={[zoom]}
							min={1}
							max={3}
							step={0.1}
							onValueChange={(val) => setZoom(val[0])}
							className="flex-1"
						/>
					</div>
					<DialogFooter className="p-4 bg-white border-t">
						<Button variant="ghost" onClick={() => setIsCropOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSaveCrop}>Apply Crop</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
