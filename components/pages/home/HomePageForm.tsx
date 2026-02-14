"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
	Loader2,
	Plus,
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
	ArrowLeft,
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
import { useRouter } from "next/navigation";

// --- 1. TYPES & INTERFACES ---

interface HomePageContent {
	about_us_title?: string;
	about_us_desc?: string;
	about_us_badge?: string;
	services_title?: string;
	services_desc?: string;
	services_badge?: string;
	news_title?: string;
	news_desc?: string;
	news_badge?: string;
	partners_title?: string;
	partners_desc?: string;
	partners_badge?: string;
	contact_title?: string;
	contact_desc?: string;
}

interface HeroSlide {
	id: string;
	order: number;
	bg_image: string | null;
	title_id: string | null;
	desc_id: string | null;
	title_en: string | null;
	desc_en: string | null;	
}

interface HomePageData {
	id: string;
	heroSlides: HeroSlide[];
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
	contact_email: z.array(z.object({ value: z.string().email("Invalid email") })),
	contact_phone: z.array(z.object({ value: z.string().min(1, "Required") })),
	contact_link_map: z.string().url().or(z.literal("")),
	contact_address: z.string().min(1, "Address is required"),

	// Per-slide hero fields (ID)
	hero_title_0: z.string().optional(),
	hero_desc_0: z.string().optional(),
	hero_title_1: z.string().optional(),
	hero_desc_1: z.string().optional(),
	hero_title_2: z.string().optional(),
	hero_desc_2: z.string().optional(),

	// Per-slide hero fields (EN)
	hero_title_en_0: z.string().optional(),
	hero_desc_en_0: z.string().optional(),
	hero_title_en_1: z.string().optional(),
	hero_desc_en_1: z.string().optional(),
	hero_title_en_2: z.string().optional(),
	hero_desc_en_2: z.string().optional(),

	// ID - other sections
	about_us_title: z.string().min(1, "Required"),
	about_us_desc: z.string().min(1, "Required"),
	about_us_badge: z.string().min(1, "Required"),
	services_title: z.string().min(1, "Required"),
	services_desc: z.string().min(1, "Required"),
	services_badge: z.string().min(1, "Required"),
	news_title: z.string().min(1, "Required"),
	news_desc: z.string().min(1, "Required"),
	news_badge: z.string().min(1, "Required"),
	partners_title: z.string().min(1, "Required"),
	partners_desc: z.string().min(1, "Required"),
	partners_badge: z.string().min(1, "Required"),
	contact_title: z.string().min(1, "Required"),
	contact_desc: z.string().min(1, "Required"),

	// EN - other sections
	about_us_title_en: z.string().min(1, "Required"),
	about_us_desc_en: z.string().min(1, "Required"),
	about_us_badge_en: z.string().min(1, "Required"),
	services_title_en: z.string().min(1, "Required"),
	services_desc_en: z.string().min(1, "Required"),
	services_badge_en: z.string().min(1, "Required"),
	news_title_en: z.string().min(1, "Required"),
	news_desc_en: z.string().min(1, "Required"),
	news_badge_en: z.string().min(1, "Required"),
	partners_title_en: z.string().min(1, "Required"),
	partners_desc_en: z.string().min(1, "Required"),
	partners_badge_en: z.string().min(1, "Required"),
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
					"resize-none min-h-20 bg-slate-50 focus:bg-white transition-colors text-sm",
					error && "border-red-500 focus-visible:ring-red-500",
				)}
			/>
			: <Input
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
	icon?: React.ElementType;
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
	initialData?: HomePageData;
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
			contact_email: [{ value: "" }],
			contact_phone: [{ value: "" }],
			contact_link_map: "",
			contact_address: "",
			// Per-slide hero fields (ID)
			hero_title_0: "",
			hero_desc_0: "",
			hero_title_1: "",
			hero_desc_1: "",
			hero_title_2: "",
			hero_desc_2: "",
			// Per-slide hero fields (EN)
			hero_title_en_0: "",
			hero_desc_en_0: "",
			hero_title_en_1: "",
			hero_desc_en_1: "",
			hero_title_en_2: "",
			hero_desc_en_2: "",
			// Other sections (ID)
			about_us_title: "",
			about_us_desc: "",
			about_us_badge: "",
			services_title: "",
			services_desc: "",
			services_badge: "",
			news_title: "",
			news_desc: "",
			news_badge: "",
			partners_title: "",
			partners_desc: "",
			partners_badge: "",
			contact_title: "",
			contact_desc: "",
			// Other sections (EN)
			about_us_title_en: "",
			about_us_desc_en: "",
			about_us_badge_en: "",
			services_title_en: "",
			services_desc_en: "",
			services_badge_en: "",
			news_title_en: "",
			news_desc_en: "",
			news_badge_en: "",
			partners_title_en: "",
			partners_desc_en: "",
			partners_badge_en: "",
			contact_title_en: "",
			contact_desc_en: "",
		},
	});
	const router = useRouter();

	// Field Arrays (Dynamic Inputs)
	const {
		fields: phoneFields,
		append: appendPhone,
		remove: removePhone,
	} = useFieldArray({ control: form.control, name: "contact_phone" });
	const {
		fields: emailFields,
		append: appendEmail,
		remove: removeEmail,
	} = useFieldArray({ control: form.control, name: "contact_email" });

	// --- PREFILL DATA ---
	useEffect(() => {
		if (isEditMode && initialData) {
			// Images from heroSlides
			const loadedSlots: ImageSlot[] = [null, null, null];
			if (initialData.heroSlides && Array.isArray(initialData.heroSlides)) {
				initialData.heroSlides.forEach((slide: HeroSlide, idx: number) => {
					if (idx < 3 && slide.bg_image) {
						loadedSlots[idx] = { type: "url", url: slide.bg_image };
					}
				});
			}
			setSlots(loadedSlots);

			// Build per-slide hero fields from heroSlides
			const heroFields: Record<string, string> = {};
			if (initialData.heroSlides) {
				initialData.heroSlides.forEach((slide: HeroSlide, idx: number) => {
					if (idx < 3) {
						heroFields[`hero_title_${idx}`] = slide.title_id || "";
						heroFields[`hero_desc_${idx}`] = slide.desc_id || "";
						heroFields[`hero_title_en_${idx}`] = slide.title_en || "";
						heroFields[`hero_desc_en_${idx}`] = slide.desc_en || "";
					}
				});
			}

			// Fields Mapping
			const flatData = {
				// Base
				about_us_years_exp: initialData.about_us_years_exp,
				about_us_products: initialData.about_us_products,
				about_us_countries: initialData.about_us_countries,
				about_us_brands: initialData.about_us_brands,
				contact_link_map: initialData.contact_link_map || "",
				contact_address: initialData.contact_address || "",

				// Arrays to Object Arrays for useFieldArray
				contact_email:
					Array.isArray(initialData.contact_email) && initialData.contact_email.length ?
						initialData.contact_email.map((s: string) => ({ value: s }))
						: [{ value: "" }],
				contact_phone:
					Array.isArray(initialData.contact_phone) && initialData.contact_phone.length ?
						initialData.contact_phone.map((s: string) => ({ value: s }))
						: [{ value: "" }],

				// Per-slide hero fields
				...heroFields,

				// ID Content
				about_us_title: initialData.homePageId?.about_us_title || "",
				about_us_desc: initialData.homePageId?.about_us_desc || "",
				about_us_badge: initialData.homePageId?.about_us_badge || "",
				services_title: initialData.homePageId?.services_title || "",
				services_desc: initialData.homePageId?.services_desc || "",
				services_badge: initialData.homePageId?.services_badge || "",
				news_title: initialData.homePageId?.news_title || "",
				news_desc: initialData.homePageId?.news_desc || "",
				news_badge: initialData.homePageId?.news_badge || "",
				partners_title: initialData.homePageId?.partners_title || "",
				partners_desc: initialData.homePageId?.partners_desc || "",
				partners_badge: initialData.homePageId?.partners_badge || "",
				contact_title: initialData.homePageId?.contact_title || "",
				contact_desc: initialData.homePageId?.contact_desc || "",

				// EN Content
				about_us_title_en: initialData.homePageEn?.about_us_title || "",
				about_us_desc_en: initialData.homePageEn?.about_us_desc || "",
				about_us_badge_en: initialData.homePageEn?.about_us_badge || "",
				services_title_en: initialData.homePageEn?.services_title || "",
				services_desc_en: initialData.homePageEn?.services_desc || "",
				services_badge_en: initialData.homePageEn?.services_badge || "",
				news_title_en: initialData.homePageEn?.news_title || "",
				news_desc_en: initialData.homePageEn?.news_desc || "",
				news_badge_en: initialData.homePageEn?.news_badge || "",
				partners_title_en: initialData.homePageEn?.partners_title || "",
				partners_desc_en: initialData.homePageEn?.partners_desc || "",
				partners_badge_en: initialData.homePageEn?.partners_badge || "",
				contact_title_en: initialData.homePageEn?.contact_title || "",
				contact_desc_en: initialData.homePageEn?.contact_desc || "",
			};

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
	const handleAutoTranslate = async (lang: string) => {
		setIsTranslating(true);
		let fieldMapping;
		if (lang == "en") {
			fieldMapping = [
				// Per-slide hero fields
				{ src: "hero_title_0", dest: "hero_title_en_0" },
				{ src: "hero_desc_0", dest: "hero_desc_en_0" },
				{ src: "hero_title_1", dest: "hero_title_en_1" },
				{ src: "hero_desc_1", dest: "hero_desc_en_1" },
				{ src: "hero_title_2", dest: "hero_title_en_2" },
				{ src: "hero_desc_2", dest: "hero_desc_en_2" },
				// Other sections
				{ src: "about_us_title", dest: "about_us_title_en" },
				{ src: "about_us_desc", dest: "about_us_desc_en" },
				{ src: "about_us_badge", dest: "about_us_badge_en" },
				{ src: "services_title", dest: "services_title_en" },
				{ src: "services_desc", dest: "services_desc_en" },
				{ src: "services_badge", dest: "services_badge_en" },
				{ src: "news_title", dest: "news_title_en" },
				{ src: "news_desc", dest: "news_desc_en" },
				{ src: "news_badge", dest: "news_badge_en" },
				{ src: "partners_title", dest: "partners_title_en" },
				{ src: "partners_desc", dest: "partners_desc_en" },
				{ src: "partners_badge", dest: "partners_badge_en" },
				{ src: "contact_title", dest: "contact_title_en" },
				{ src: "contact_desc", dest: "contact_desc_en" },
			];
		} else {
			fieldMapping = [
				// Per-slide hero fields
				{ src: "hero_title_en_0", dest: "hero_title_0" },
				{ src: "hero_desc_en_0", dest: "hero_desc_0" },
				{ src: "hero_title_en_1", dest: "hero_title_1" },
				{ src: "hero_desc_en_1", dest: "hero_desc_1" },
				{ src: "hero_title_en_2", dest: "hero_title_2" },
				{ src: "hero_desc_en_2", dest: "hero_desc_2" },
				// Other sections
				{ src: "about_us_title_en", dest: "about_us_title" },
				{ src: "about_us_desc_en", dest: "about_us_desc" },
				{ src: "about_us_badge_en", dest: "about_us_badge" },
				{ src: "services_title_en", dest: "services_title" },
				{ src: "services_desc_en", dest: "services_desc" },
				{ src: "services_badge_en", dest: "services_badge" },
				{ src: "news_title_en", dest: "news_title" },
				{ src: "news_desc_en", dest: "news_desc" },
				{ src: "news_badge_en", dest: "news_badge" },
				{ src: "partners_title_en", dest: "partners_title" },
				{ src: "partners_desc_en", dest: "partners_desc" },
				{ src: "partners_badge_en", dest: "partners_badge" },
				{ src: "contact_title_en", dest: "contact_title" },
				{ src: "contact_desc_en", dest: "contact_desc" },
			];
		}

		const textsToTranslate = fieldMapping.map(
			(f) => form.getValues(f.src as any) || "",
		);

        // Validate source fields
        const sourceKeys = fieldMapping.map((f) => f.src);
        const isValid = await form.trigger(sourceKeys as any);

        if (!isValid) {
            toast.error("Please fill in required fields first");
            setIsTranslating(false);
            return;
        }

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
						body: JSON.stringify({
							texts: chunkTexts,
							target_lang: lang || "en",
						}),
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

		// Transform contact arrays: [{value: "a"}] -> ["a"]
		const emailArr = data.contact_email.map((e) => e.value).filter((v) => v !== "");
		const phoneArr = data.contact_phone.map((p) => p.value).filter((v) => v !== "");
		emailArr.forEach((val) => formData.append("contact_email", val));
		phoneArr.forEach((val) => formData.append("contact_phone", val));

		Object.entries(data).forEach(([key, value]) => {
			if (key === "contact_email" || key === "contact_phone") return; // already handled
			formData.append(key, String(value));
		});

		// Handle URL based on mode
		const url =
			isEditMode && initialData?.id ?
				`${process.env.NEXT_PUBLIC_API_URL}/page/home/${initialData.id}`
				: `${process.env.NEXT_PUBLIC_API_URL}/page/home`;
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
			setTimeout(() => {
				router.push("/admin/pages/home");
			}, 500);
		} catch (e: any) {
			toast.error(e.message || "Failed to submit");
		} finally {
			setIsLoading(false);
		}
	};

	const { errors } = form.formState;

	return (
		<div className="space-y-8">
			{/* HEADER CONTROLS */}
			<div className="flex justify-between items-center mb-2">
				<Button
					type="button"
					variant="default"
					size="sm"
					onClick={() => router.push("/admin/pages/home")}
					disabled={isTranslating}
					className="cursor-pointer"
				>
					<ArrowLeft /> Back to home
				</Button>

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
							: <Sparkles className="mr-2 h-4 w-4" />}
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
							: <Sparkles className="mr-2 h-4 w-4" />}
						Auto Translate (ID → EN)
					</Button>
				</div>
			</div>

			<form onSubmit={form.handleSubmit(onSubmit, () => {
                toast.error(`Please fill all field`);
            })} className="space-y-8">
				{/* === HERO SLIDES (Carousel) === */}
				<Card className="mb-8 border-slate-200 shadow-sm">
					<CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
						<CardTitle className="flex items-center gap-2 text-base text-slate-800">
							<ImageIcon className="h-5 w-5 text-blue-600" /> Hero Banners (3
							Slots)
						</CardTitle>
						<CardDescription>
							Upload 3 landscape images (16:9). Each slide has its own title & description.
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{[0, 1, 2].map((idx) => (
								<div key={idx} className="space-y-3">
									{/* Image Upload */}
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
															: (slots[idx] as any).url
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
											: <label className="cursor-pointer flex flex-col items-center p-4 w-full h-full justify-center hover:bg-slate-50/50 transition-colors">
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

									{/* Per-slide Title & Desc (ID) */}
									<div className="space-y-2 border-t pt-3">
										<Label className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">🇮🇩 ID</Label>
										<FormInput
											id={`hero_title_${idx}`}
											label="Title"
											register={form.register}
											placeholder={`Slide ${idx + 1} title (ID)`}
										/>
										<FormInput
											id={`hero_desc_${idx}`}
											label="Description"
											textarea
											register={form.register}
											placeholder={`Slide ${idx + 1} description (ID)`}
										/>
									</div>

									{/* Per-slide Title & Desc (EN) */}
									<div className="space-y-2 border-t pt-3">
										<Label className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">🇺🇸 EN</Label>
										<FormInput
											id={`hero_title_en_${idx}`}
											label="Title"
											register={form.register}
											placeholder={`Slide ${idx + 1} title (EN)`}
										/>
										<FormInput
											id={`hero_desc_en_${idx}`}
											label="Description"
											textarea
											register={form.register}
											placeholder={`Slide ${idx + 1} description (EN)`}
                    />
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

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
								{/* Dynamic Phone Inputs */}
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
										<Phone className="w-3 h-3" /> Phone Numbers
									</Label>
									<div className="space-y-2">
										{phoneFields.map((f, i) => (
											<div key={f.id} className="flex gap-2">
												<div className="w-full">
													<Input
														{...form.register(`contact_phone.${i}.value`)}
														placeholder="+62..."
														className={cn(
															"bg-slate-50 focus:bg-white transition-colors h-9 text-sm",
															errors.contact_phone?.[i]?.value && "border-red-500",
														)}
													/>
													{errors.contact_phone?.[i]?.value && (
														<p className="text-[10px] text-red-500 mt-1">Required</p>
													)}
												</div>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => removePhone(i)}
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
											onClick={() => appendPhone({ value: "" })}
											className="w-full h-8 text-xs border-dashed border-slate-300 hover:border-slate-400 text-slate-500"
										>
											<Plus size={14} className="mr-1" /> Add Phone
										</Button>
									</div>
								</div>

								{/* Dynamic Email Inputs */}
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
										<Mail className="w-3 h-3" /> Emails
									</Label>
									<div className="space-y-2">
										{emailFields.map((f, i) => (
											<div key={f.id} className="flex gap-2">
												<div className="w-full">
													<Input
														{...form.register(`contact_email.${i}.value`)}
														placeholder="sales@example.com"
														className={cn(
															"bg-slate-50 focus:bg-white transition-colors h-9 text-sm",
															errors.contact_email?.[i]?.value && "border-red-500",
														)}
													/>
													{errors.contact_email?.[i]?.value && (
														<p className="text-[10px] text-red-500 mt-1">Invalid Email</p>
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
									</div>
								</div>

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
								{/* 1. ABOUT US */}
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
									<FormInput
										id="about_us_badge"
										label="About Badge"
										register={form.register}
										error={errors.about_us_badge}
									/>
								</SectionGroup>

								{/* 2. SERVICES */}
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
									<FormInput
										id="services_badge"
										label="Services Badge"
										register={form.register}
										error={errors.services_badge}
									/>
								</SectionGroup>

								{/* 3. NEWS */}
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
									<FormInput
										id="news_badge"
										label="News Badge"
										register={form.register}
										error={errors.news_badge}
									/>
								</SectionGroup>

								{/* 4. PARTNERS */}
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
									<FormInput
										id="partners_badge"
										label="Partners Badge"
										register={form.register}
										error={errors.partners_badge}
									/>
								</SectionGroup>

								{/* 5. CONTACT FOOTER */}
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
								{/* 1. ABOUT US */}
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
									<FormInput
										id="about_us_badge_en"
										label="About Badge"
										register={form.register}
										error={errors.about_us_badge_en}
									/>
								</SectionGroup>

								{/* 2. SERVICES */}
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
									<FormInput
										id="services_badge_en"
										label="Services Badge"
										register={form.register}
										error={errors.services_badge_en}
									/>
								</SectionGroup>

								{/* 3. NEWS */}
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
									<FormInput
										id="news_badge_en"
										label="News Badge"
										register={form.register}
										error={errors.news_badge_en}
									/>
								</SectionGroup>

								{/* 4. PARTNERS */}
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
									<FormInput
										id="partners_badge_en"
										label="Partners Badge"
										register={form.register}
										error={errors.partners_badge_en}
									/>
								</SectionGroup>

								{/* 5. CONTACT FOOTER */}
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
				<div className="flex justify-end gap-2 fixed bottom-6 right-6 z-50">
					<Button
						type="button"
						variant="secondary"
						onClick={() => router.back()}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isLoading}>
						{isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
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
					<div className="h-100 relative bg-slate-950">
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
