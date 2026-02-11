"use client";

import React, { useState, useEffect } from "react";
import { useForm, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
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
	Car,
	Crop as CropIcon,
	ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCroppedImg } from "@/utils/canvasUtils";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

// --- 1. SCHEMA VALIDATION ---
const formSchema = z.object({
	// ID
	hero_title: z.string().min(1, "Hero Title (ID) is required"),
	hero_desc: z.string().min(1, "Hero Desc (ID) is required"),
	used_car_gallery_title: z.string().min(1, "Gallery Title (ID) is required"),
	used_car_gallery_desc: z.string().min(1, "Gallery Desc (ID) is required"),

	// EN
	hero_title_en: z.string().min(1, "Hero Title (EN) is required"),
	hero_desc_en: z.string().min(1, "Hero Desc (EN) is required"),
	used_car_gallery_title_en: z
		.string()
		.min(1, "Gallery Title (EN) is required"),
	used_car_gallery_desc_en: z.string().min(1, "Gallery Desc (EN) is required"),
});

type FormValues = z.infer<typeof formSchema>;

// --- 2. HELPER COMPONENTS ---
interface FormInputProps {
	id: string;
	label: string;
	register: UseFormRegister<any>;
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

const SectionGroup = ({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon?: any;
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

// --- 3. MAIN COMPONENT ---
interface ServicePageFormProps {
	initialData?: any;
	isEditMode?: boolean;
}

export default function ServicePageForm({
	initialData,
	isEditMode = false,
}: ServicePageFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isTranslating, setIsTranslating] = useState(false);

	// --- IMAGE & CROPPER STATE ---
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const [isCropOpen, setIsCropOpen] = useState(false);
	const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

	// --- FORM INITIALIZATION ---
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			hero_title: "",
			hero_desc: "",
			used_car_gallery_title: "",
			used_car_gallery_desc: "",
			hero_title_en: "",
			hero_desc_en: "",
			used_car_gallery_title_en: "",
			used_car_gallery_desc_en: "",
		},
	});

	const {
		formState: { errors },
		setValue,
		getValues,
		reset,
	} = form;

	// --- PREFILL DATA ---
	useEffect(() => {
		if (isEditMode && initialData) {
			if (initialData.hero_bg) {
				setImagePreview(initialData.hero_bg);
			}

			reset({
				// ID Content
				hero_title: initialData.servicePageId?.hero_title || "",
				hero_desc: initialData.servicePageId?.hero_desc || "",
				used_car_gallery_title:
					initialData.servicePageId?.used_car_gallery_title || "",
				used_car_gallery_desc:
					initialData.servicePageId?.used_car_gallery_desc || "",

				// English Content
				hero_title_en: initialData.servicePageEn?.hero_title || "",
				hero_desc_en: initialData.servicePageEn?.hero_desc || "",
				used_car_gallery_title_en:
					initialData.servicePageEn?.used_car_gallery_title || "",
				used_car_gallery_desc_en:
					initialData.servicePageEn?.used_car_gallery_desc || "",
			});
		}
	}, [initialData, isEditMode, reset]);

	// --- IMAGE & CROP HANDLERS ---
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0];
			setCropImageSrc(URL.createObjectURL(file));
			setZoom(1);
			setIsCropOpen(true);
			e.target.value = "";
		}
	};

	const handleSaveCrop = async () => {
		if (!cropImageSrc || !croppedAreaPixels) return;
		try {
			const croppedFile = await getCroppedImg(cropImageSrc, croppedAreaPixels);
			if (croppedFile) {
				setImageFile(croppedFile);
				setImagePreview(URL.createObjectURL(croppedFile));
				setIsCropOpen(false);
				setCropImageSrc(null);
				toast.success("Image cropped successfully!");
			}
		} catch {
			toast.error("Failed to crop image");
		}
	};

	// --- AUTO TRANSLATE ---
	const handleAutoTranslate = async (lang: string) => {
		setIsTranslating(true);

		let fieldMapping;
		if (lang == "en") {
			fieldMapping = [
				{ src: "hero_title", dest: "hero_title_en" },
				{ src: "hero_desc", dest: "hero_desc_en" },
				{ src: "used_car_gallery_title", dest: "used_car_gallery_title_en" },
				{ src: "used_car_gallery_desc", dest: "used_car_gallery_desc_en" },
			];
		} else {
			fieldMapping = [
				{ src: "hero_title_en", dest: "hero_title" },
				{ src: "hero_desc_en", dest: "hero_desc" },
				{ src: "used_car_gallery_title_en", dest: "used_car_gallery_title" },
				{ src: "used_car_gallery_desc_en", dest: "used_car_gallery_desc" },
			];
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
						headers: {
							"Content-Type": "application/json",
						},
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
		// 1. Validasi Create: Wajib ada gambar
		if (!isEditMode && !imageFile) {
			return toast.error("Hero Image is required");
		}

		setIsLoading(true);
		const formData = new FormData();

		// 2. Handle Image Status
		if (imageFile) {
			formData.append("hero_bg", imageFile);
			formData.append("image_status", "change");
		} else {
			formData.append("image_status", "keep");
		}

		// 3. Append Text Data
		Object.entries(data).forEach(([key, value]) => {
			formData.append(key, String(value));
		});

		// 4. Determine URL & Method
		// Jika Edit Mode: PUT ke /page/service/:id
		// Jika Create Mode: POST ke /page/service
		const url =
			isEditMode && initialData?.id ?
				`${process.env.NEXT_PUBLIC_API_URL}/page/service/${initialData.id}`
			:	`${process.env.NEXT_PUBLIC_API_URL}/page/service`;

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
				isEditMode ? "Service Page Updated!" : "Service Page Created!",
			);

			// Optional: Redirect or Refresh
			if (!isEditMode) {
				router.refresh();
			}
		} catch (e: any) {
			toast.error(e.message || "Failed to submit");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-8 max-w-5xl mx-auto pb-20">
			{/* HEADER + BACK BUTTON (Opsional) */}
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-4">
					<h1 className="text-2xl font-bold tracking-tight">
						{isEditMode ? "Edit Service Page Settings" : "Create Service Page"}
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

			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				{/* === SECTION 1: HERO IMAGE === */}
				<Card>
					<CardHeader className="bg-slate-50/50 border-b pb-4">
						<CardTitle className="flex items-center gap-2 text-base text-slate-800">
							<ImageIcon className="h-5 w-5 text-blue-600" /> Hero Background
						</CardTitle>
						<CardDescription>
							Upload landscape image (16:9). Click image to crop/change.
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="flex flex-col items-center gap-4">
							<div className="relative w-full max-w-2xl aspect-video bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 overflow-hidden group hover:border-blue-400 transition-all flex items-center justify-center">
								{imagePreview ?
									<>
										<Image
											src={imagePreview}
											alt="Preview"
											fill
											className="object-cover"
										/>
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
											<label
												className="cursor-pointer bg-white text-slate-900 p-2 rounded-full hover:bg-blue-50 shadow-lg"
												title="Change Image"
											>
												<RefreshCw size={20} className="text-blue-600" />
												<input
													type="file"
													className="hidden"
													accept="image/*"
													onChange={handleFileSelect}
												/>
											</label>
										</div>
									</>
								:	<label className="cursor-pointer flex flex-col items-center p-8 w-full h-full justify-center">
										<UploadCloud className="text-slate-400 h-10 w-10 mb-2" />
										<span className="text-sm text-slate-600 font-medium">
											Click to Upload Image
										</span>
										<input
											type="file"
											className="hidden"
											accept="image/*"
											onChange={handleFileSelect}
										/>
									</label>
								}
							</div>
							{imageFile ?
								<Badge className="bg-blue-100 text-blue-700">
									New Image Selected
								</Badge>
							: imagePreview ?
								<Badge variant="outline">Existing Image</Badge>
							:	null}
						</div>
					</CardContent>
				</Card>

				{/* === SECTION 2: TABS CONTENT === */}
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

					{/* INDONESIA */}
					<TabsContent value="id" className="space-y-6">
						<SectionGroup title="Hero Section (ID)" icon={LayoutTemplate}>
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

						<SectionGroup title="Car Gallery Section (ID)" icon={Car}>
							<FormInput
								id="used_car_gallery_title"
								label="Gallery Title"
								register={form.register}
								error={errors.used_car_gallery_title}
							/>
							<FormInput
								id="used_car_gallery_desc"
								label="Gallery Description"
								textarea
								register={form.register}
								error={errors.used_car_gallery_desc}
							/>
						</SectionGroup>
					</TabsContent>

					{/* ENGLISH */}
					<TabsContent value="en" className="space-y-6">
						<SectionGroup title="Hero Section (EN)" icon={LayoutTemplate}>
							<FormInput
								id="hero_title_en"
								label="Hero Title (EN)"
								register={form.register}
								error={errors.hero_title_en}
							/>
							<FormInput
								id="hero_desc_en"
								label="Hero Description (EN)"
								textarea
								register={form.register}
								error={errors.hero_desc_en}
							/>
						</SectionGroup>

						<SectionGroup title="Car Gallery Section (EN)" icon={Car}>
							<FormInput
								id="used_car_gallery_title_en"
								label="Gallery Title (EN)"
								register={form.register}
								error={errors.used_car_gallery_title_en}
							/>
							<FormInput
								id="used_car_gallery_desc_en"
								label="Gallery Description (EN)"
								textarea
								register={form.register}
								error={errors.used_car_gallery_desc_en}
							/>
						</SectionGroup>
					</TabsContent>
				</Tabs>

				{/* SUBMIT */}
				<div className="flex justify-end pt-4 border-t">
					<Button
						type="submit"
						size="lg"
						disabled={isLoading}
						className="min-w-[200px]"
					>
						{isLoading ?
							<Loader2 className="animate-spin mr-2" />
						:	null}
						{isEditMode ? "Save Changes" : "Create Page"}
					</Button>
				</div>
			</form>

			{/* --- CROPPER MODAL --- */}
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
