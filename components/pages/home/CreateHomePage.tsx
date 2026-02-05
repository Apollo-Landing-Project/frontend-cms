"use client";

import React, { useState, useCallback } from "react";
import { useForm, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast, { Toaster } from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop"; // Install: npm install react-easy-crop
import {
	Loader2,
	UploadCloud,
	X,
	Sparkles,
	Trash2,
	Image as ImageIcon,
	Crop as CropIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- COMPONENTS ---
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

// --- UTILS ---
import { getCroppedImg } from "@/utils/canvasUtils";
import Image from "next/image";

// --- 1. SCHEMA VALIDATION ---
const formSchema = z.object({
	hero_bg: z
		.custom<File[]>()
		.refine(
			(files) => Array.isArray(files) && files.length === 3,
			"Wajib mengupload tepat 3 gambar.",
		),

	about_us_years_exp: z.coerce.number().min(0),
	about_us_products: z.coerce.number().min(0),
	about_us_countries: z.coerce.number().min(0),
	about_us_brands: z.coerce.number().min(0),

	contact_email: z.string().min(1, "Email wajib diisi"),
	contact_phone: z.string().min(1, "No HP wajib diisi"),
	contact_link_map: z.string().url("URL Maps tidak valid"),
	contact_address: z.string().min(1, "Alamat wajib diisi"),

	// Bahasa Indonesia
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

	// English
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

type FormValues = z.infer<typeof formSchema>;

// --- 2. INPUT COMPONENT ---
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
	<div className="space-y-1.5">
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
					"resize-none min-h-[100px] bg-slate-50 focus:bg-white transition-colors",
					error && "border-red-500 focus-visible:ring-red-500",
				)}
			/>
		:	<Input
				id={id}
				type={type}
				{...register(id)}
				placeholder={placeholder}
				className={cn(
					"bg-slate-50 focus:bg-white transition-colors h-10",
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
const CreateHomePage = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [isTranslating, setIsTranslating] = useState(false);

	// Image State
	const [previewImages, setPreviewImages] = useState<File[]>([]);

	// Cropper State
	const [isCropOpen, setIsCropOpen] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(
		null,
	);
	const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		defaultValues: {
			hero_bg: [],
			about_us_years_exp: 0,
		},
	});

	// --- DRAG & DROP HANDLER ---
	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			setPreviewImages((prev) => {
				const combined = [...prev, ...acceptedFiles].slice(0, 3);
				form.setValue("hero_bg", combined, { shouldValidate: true });
				return combined;
			});
		},
		[form],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
		maxFiles: 3,
	});

	const removeImage = (index: number) => {
		const newFiles = previewImages.filter((_, i) => i !== index);
		setPreviewImages(newFiles);
		form.setValue("hero_bg", newFiles, { shouldValidate: true });
	};

	// --- CROP HANDLERS ---
	const startCrop = (index: number) => {
		const file = previewImages[index];
		if (file) {
			setCurrentImageIndex(index);
			setCropImageSrc(URL.createObjectURL(file));
			setZoom(1);
			setCrop({ x: 0, y: 0 });
			setIsCropOpen(true);
		}
	};

	const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
		setCroppedAreaPixels(croppedAreaPixels);
	}, []);

	const handleSaveCrop = async () => {
		if (!cropImageSrc || !croppedAreaPixels || currentImageIndex === null)
			return;

		try {
			const croppedFile = await getCroppedImg(cropImageSrc, croppedAreaPixels);

			if (croppedFile) {
				// Replace file at specific index
				setPreviewImages((prev) => {
					const newArr = [...prev];
					newArr[currentImageIndex] = croppedFile;
					form.setValue("hero_bg", newArr, { shouldValidate: true });
					return newArr;
				});

				toast.success("Gambar berhasil dipotong!");
				setIsCropOpen(false);
				setCropImageSrc(null);
				setCurrentImageIndex(null);
			}
		} catch (e) {
			console.error(e);
			toast.error("Gagal memotong gambar");
		}
	};

	// --- TRANSLATE HANDLER (BATCHING) ---
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
			toast.error("Isi konten Bahasa Indonesia terlebih dahulu!");
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
							target_lang: "en",
						}),
					},
				);

				const textResponse = await response.text();
				let result;
				try {
					result = JSON.parse(textResponse);
				} catch (e) {
					throw new Error(`Batch ${i + 1} Error: ${textResponse}`);
				}

				if (!response.ok) {
					throw new Error(result.message || "Gagal mentranslate");
				}

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

			toast.success("Semua field berhasil ditranslate!");
		} catch (error: any) {
			console.error("Translate Batch Error:", error);
			toast.error(error.message || "Terjadi kesalahan saat translasi.");
		} finally {
			setIsTranslating(false);
		}
	};

	// --- SUBMIT HANDLER ---
	const onSubmit = async (data: FormValues) => {
		setIsLoading(true);
		const formData = new FormData();

		data.hero_bg.forEach((file) => formData.append("hero_bg", file));

		Object.entries(data).forEach(([key, value]) => {
			if (key !== "hero_bg") {
				if (
					(key === "contact_email" || key === "contact_phone") &&
					typeof value === "string"
				) {
					const arr = value.split(",").map((s) => s.trim());
					arr.forEach((val) => formData.append(key, val));
				} else {
					formData.append(key, String(value));
				}
			}
		});

		formData.append("prefix", "homepage");

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/page/home`,
				{
					credentials: "include",
					method: "POST",
					body: formData,
				},
			);

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || "Terjadi kesalahan server");
			}

			toast.success("Home Page berhasil dibuat!");
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Gagal mengirim data");
		} finally {
			setIsLoading(false);
		}
	};

	const { errors } = form.formState;

	return (
		<div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
			<Toaster position="top-center" reverseOrder={false} />

			<div className="max-w-5xl mx-auto space-y-8">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight text-slate-900">
							Create Home Page
						</h1>
						<p className="text-slate-500 mt-1">
							Manage content, upload banners, and localize text.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleAutoTranslate}
							disabled={isTranslating}
							className="bg-white hover:bg-slate-50 border-purple-200 text-purple-700 shadow-sm"
						>
							{isTranslating ?
								<Loader2 className="animate-spin mr-2 h-4 w-4" />
							:	<Sparkles className="mr-2 h-4 w-4" />}
							Auto Translate (ID → EN)
						</Button>
					</div>
				</div>

				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					{/* SECTION 1: MEDIA (DRAG & DROP + CROP) */}
					<Card className="border-none shadow-md ring-1 ring-slate-900/5">
						<CardHeader className="bg-white border-b pb-4">
							<CardTitle className="text-lg flex items-center gap-2">
								<ImageIcon className="h-5 w-5 text-blue-500" /> Hero Banners
							</CardTitle>
							<CardDescription>
								Upload tepat 3 gambar. Klik ikon{" "}
								<CropIcon className="w-3 h-3 inline mx-1" /> untuk memotong
								rasio 16:9.
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-6">
							<div
								{...getRootProps()}
								className={cn(
									"border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200",
									isDragActive ?
										"border-blue-500 bg-blue-50"
									:	"border-slate-200 hover:border-blue-400 hover:bg-slate-50",
									errors.hero_bg ? "border-red-500 bg-red-50/10" : "",
								)}
							>
								<input {...getInputProps()} />
								<div className="bg-white p-3 rounded-full shadow-sm ring-1 ring-slate-200 mb-4">
									<UploadCloud className="h-8 w-8 text-slate-400" />
								</div>
								{isDragActive ?
									<p className="text-blue-600 font-medium">
										Drop the files here ...
									</p>
								:	<div className="space-y-1">
										<p className="text-sm font-medium text-slate-700">
											Click to upload or drag and drop
										</p>
										<p className="text-xs text-slate-500">
											SVG, PNG, JPG or WEBP (Max 3 images)
										</p>
									</div>
								}
							</div>

							{/* Preview Grid */}
							{previewImages.length > 0 && (
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
									{previewImages.map((file, idx) => (
										<div
											key={idx}
											className="relative group rounded-lg overflow-hidden border bg-slate-100 aspect-video shadow-sm"
										>
											<Image
												src={URL.createObjectURL(file)}
												width={400}
												height={225}
												alt="preview"
												className="w-full h-full object-cover"
											/>

											{/* Overlay Actions */}
											<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
												{/* Tombol Crop */}
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														startCrop(idx);
													}}
													className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
													title="Crop Image"
												>
													<CropIcon size={16} />
												</button>

												{/* Tombol Hapus */}
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														removeImage(idx);
													}}
													className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
													title="Delete Image"
												>
													<Trash2 size={16} />
												</button>
											</div>

											<Badge className="absolute top-2 left-2 bg-white/90 text-slate-900 pointer-events-none">
												Image {idx + 1}
											</Badge>
										</div>
									))}
								</div>
							)}
							{errors.hero_bg && (
								<p className="text-sm text-red-500 mt-2 font-medium flex items-center gap-1">
									<X size={14} /> {String(errors.hero_bg.message)}
								</p>
							)}
						</CardContent>
					</Card>

					{/* SECTION 2: CONTENT & DATA (INPUTS) */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Left Column: Stats & Contact */}
						<div className="space-y-6 lg:col-span-1">
							<Card className="border-none shadow-md ring-1 ring-slate-900/5 h-full">
								<CardHeader className="border-b pb-4">
									<CardTitle className="text-base">
										Global Configurations
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-6 pt-6">
									<div className="space-y-4">
										<h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
											<span className="w-1 h-4 bg-blue-500 rounded-full"></span>{" "}
											Statistics
										</h4>
										<div className="grid grid-cols-2 gap-3">
											<FormInput
												id="about_us_years_exp"
												label="Years Exp"
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
									</div>

									<div className="space-y-4">
										<h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
											<span className="w-1 h-4 bg-green-500 rounded-full"></span>{" "}
											Contact Info
										</h4>
										<FormInput
											id="contact_email"
											label="Emails (Comma separated)"
											placeholder="admin@web.com, support@web.com"
											register={form.register}
											error={errors.contact_email}
										/>
										<FormInput
											id="contact_phone"
											label="Phones (Comma separated)"
											placeholder="+6281..., 021..."
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
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Right Column: Tabbed Languages */}
						<div className="lg:col-span-2">
							<Tabs defaultValue="id" className="w-full">
								<div className="flex items-center justify-between mb-4">
									<TabsList className="bg-white border shadow-sm p-1">
										<TabsTrigger
											value="id"
											className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
										>
											🇮🇩 Indonesia
										</TabsTrigger>
										<TabsTrigger
											value="en"
											className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
										>
											🇺🇸 English
										</TabsTrigger>
									</TabsList>
								</div>

								{/* --- TAB CONTENT ID --- */}
								<TabsContent value="id" className="mt-0">
									<Card className="border-none shadow-md ring-1 ring-slate-900/5">
										<CardHeader className="bg-red-50/30 border-b">
											<CardTitle className="text-base text-red-700">
												Konten Bahasa Indonesia
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-6 pt-6">
											<SectionGroup title="Hero Section">
												<FormInput
													id="hero_title"
													label="Judul Hero"
													register={form.register}
													error={errors.hero_title}
												/>
												<FormInput
													id="hero_desc"
													label="Deskripsi Hero"
													textarea
													register={form.register}
													error={errors.hero_desc}
												/>
											</SectionGroup>

											<SectionGroup title="About Us">
												<FormInput
													id="about_us_title"
													label="Judul Tentang Kami"
													register={form.register}
													error={errors.about_us_title}
												/>
												<FormInput
													id="about_us_desc"
													label="Deskripsi Tentang Kami"
													textarea
													register={form.register}
													error={errors.about_us_desc}
												/>
											</SectionGroup>

											<SectionGroup title="Services">
												<FormInput
													id="services_title"
													label="Judul Layanan"
													register={form.register}
													error={errors.services_title}
												/>
												<FormInput
													id="services_desc"
													label="Deskripsi Layanan"
													textarea
													register={form.register}
													error={errors.services_desc}
												/>
											</SectionGroup>

											<SectionGroup title="News & Partners">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<FormInput
														id="news_title"
														label="Judul Berita"
														register={form.register}
														error={errors.news_title}
													/>
													<FormInput
														id="partners_title"
														label="Judul Partner"
														register={form.register}
														error={errors.partners_title}
													/>
												</div>
												<FormInput
													id="news_desc"
													label="Deskripsi Berita"
													textarea
													register={form.register}
													error={errors.news_desc}
												/>
												<FormInput
													id="partners_desc"
													label="Deskripsi Partner"
													textarea
													register={form.register}
													error={errors.partners_desc}
												/>
											</SectionGroup>

											<SectionGroup title="Contact Footer">
												<FormInput
													id="contact_title"
													label="Judul Kontak"
													register={form.register}
													error={errors.contact_title}
												/>
												<FormInput
													id="contact_desc"
													label="Deskripsi Kontak"
													textarea
													register={form.register}
													error={errors.contact_desc}
												/>
											</SectionGroup>
										</CardContent>
									</Card>
								</TabsContent>

								{/* --- TAB CONTENT EN --- */}
								<TabsContent value="en" className="mt-0">
									<Card className="border-none shadow-md ring-1 ring-slate-900/5">
										<CardHeader className="bg-blue-50/30 border-b">
											<CardTitle className="text-base text-blue-700">
												English Content
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-6 pt-6">
											<SectionGroup title="Hero Section">
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

											<SectionGroup title="About Us">
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

											<SectionGroup title="Services">
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

											<SectionGroup title="News & Partners">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<FormInput
														id="news_title_en"
														label="News Title"
														register={form.register}
														error={errors.news_title_en}
													/>
													<FormInput
														id="partners_title_en"
														label="Partners Title"
														register={form.register}
														error={errors.partners_title_en}
													/>
												</div>
												<FormInput
													id="news_desc_en"
													label="News Description"
													textarea
													register={form.register}
													error={errors.news_desc_en}
												/>
												<FormInput
													id="partners_desc_en"
													label="Partners Description"
													textarea
													register={form.register}
													error={errors.partners_desc_en}
												/>
											</SectionGroup>

											<SectionGroup title="Contact Footer">
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
										</CardContent>
									</Card>
								</TabsContent>
							</Tabs>
						</div>
					</div>

					<div className="flex justify-end pt-4 pb-10">
						<Button
							type="submit"
							size="lg"
							disabled={isLoading}
							className="w-full md:w-auto min-w-[200px] shadow-lg shadow-blue-500/20"
						>
							{isLoading ?
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
									Publishing...
								</>
							:	"Publish Home Page"}
						</Button>
					</div>
				</form>
			</div>

			{/* --- MODAL CROPPER --- */}
			<Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
				<DialogContent className="max-w-xl bg-white p-0 overflow-hidden gap-0">
					<DialogHeader className="p-4 border-b">
						<DialogTitle>Edit Image (16:9)</DialogTitle>
					</DialogHeader>

					<div className="relative w-full h-[400px] bg-slate-900">
						{cropImageSrc && (
							<Cropper
								image={cropImageSrc}
								crop={crop}
								zoom={zoom}
								aspect={16 / 9}
								onCropChange={setCrop}
								onCropComplete={onCropComplete}
								onZoomChange={setZoom}
							/>
						)}
					</div>

					<div className="p-4 bg-slate-50 border-t space-y-4">
						<div className="flex items-center gap-4">
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
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCropOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleSaveCrop}>Save Crop</Button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

const SectionGroup = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => (
	<div className="p-4 rounded-lg border border-slate-100 bg-white shadow-sm space-y-4">
		<h5 className="font-semibold text-sm text-slate-800 border-b pb-2">
			{title}
		</h5>
		{children}
	</div>
);

export default CreateHomePage;
