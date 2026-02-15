"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Image from "next/image";
import {
	Loader2,
	ArrowLeft,
	Sparkles,
	User,
	Plus,
	X,
	ImagePlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getCroppedImg } from "@/utils/canvasUtils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadField, FormInput } from "@/components/forms/FormComponents";
import { CropImageDialog } from "@/components/ui/crop-image-dialog";
import { Label } from "@/components/ui/label";
import Tiptap from "@/components/ui/Tiptap";

// --- SCHEMA ---
const formSchema = z.object({
	title: z.string().min(1, "Title (ID) required"),
	title_en: z.string().min(1, "Title (EN) required"),
	description: z.string().optional(),
	description_en: z.string().optional(),
	author: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GalleryImage {
	id?: string; // existing image ID from server
	file?: File;
	preview: string;
	description_id: string;
	description_en: string;
}

interface NewsCSRFormProps {
	initialData?: any;
	isEditMode?: boolean;
}

export default function NewsCSRForm({
	initialData,
	isEditMode,
}: NewsCSRFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isTranslating, setIsTranslating] = useState(false);

	// Author Image
	const [authorImageFile, setAuthorImageFile] = useState<File | null>(null);
	const [authorImagePreview, setAuthorImagePreview] = useState<string | null>(
		initialData?.author_image || null,
	);

	// Gallery Images
	const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
	const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

	// Cropper
	const [cropOpen, setCropOpen] = useState(false);
	const [cropSrc, setCropSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedArea, setCroppedArea] = useState(null);
	const [cropTarget, setCropTarget] = useState<
		"author" | { type: "gallery"; index: number }
	>("author");

	// Tiptap content
	const [contentId, setContentId] = useState(
		initialData?.newsCSRId?.content || "",
	);
	const [contentEn, setContentEn] = useState(
		initialData?.newsCSREn?.content || "",
	);

	// Form
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		getValues,
		setValue,
		trigger,
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			title_en: "",
			description: "",
			description_en: "",
			author: "",
		},
	});

	// Prefill
	useEffect(() => {
		if (initialData) {
			reset({
				title: initialData.newsCSRId?.title || "",
				title_en: initialData.newsCSREn?.title || "",
				description: initialData.newsCSRId?.description || "",
				description_en: initialData.newsCSREn?.description || "",
				author: initialData.author || "",
			});
			setContentId(initialData.newsCSRId?.content || "");
			setContentEn(initialData.newsCSREn?.content || "");
			setAuthorImagePreview(initialData.author_image || null);

			// Load existing gallery images
			if (initialData.newsCSRImage?.length > 0) {
				setGalleryImages(
					initialData.newsCSRImage.map((img: any) => ({
						id: img.id,
						preview: img.image,
						description_id: img.description_id || "",
						description_en: img.description_en || "",
					})),
				);
			}
		}
	}, [initialData, reset]);

	// --- CROPPER ---
	const initiateCropAuthor = (file: File) => {
		setCropSrc(URL.createObjectURL(file));
		setCropTarget("author");
		setCropOpen(true);
		setZoom(1);
	};

	const initiateGalleryAdd = (file: File) => {
		setCropSrc(URL.createObjectURL(file));
		setCropTarget({ type: "gallery", index: galleryImages.length });
		setCropOpen(true);
		setZoom(1);
	};

	const handleSaveCrop = async () => {
		if (!cropSrc || !croppedArea) return;
		try {
			const croppedFile = await getCroppedImg(cropSrc, croppedArea);
			if (croppedFile) {
				if (cropTarget === "author") {
					setAuthorImageFile(croppedFile);
					setAuthorImagePreview(URL.createObjectURL(croppedFile));
				} else if (typeof cropTarget === "object") {
					const newImage: GalleryImage = {
						file: croppedFile,
						preview: URL.createObjectURL(croppedFile),
						description_id: "",
						description_en: "",
					};
					setGalleryImages((prev) => [...prev, newImage]);
				}
				setCropOpen(false);
				toast.success("Image cropped!");
			}
		} catch {
			toast.error("Crop failed");
		}
	};

	const removeGalleryImage = (index: number) => {
		const img = galleryImages[index];
		if (img.id) {
			setDeletedImageIds((prev) => [...prev, img.id!]);
		}
		setGalleryImages((prev) => prev.filter((_, i) => i !== index));
	};

	const updateGalleryDescription = (
		index: number,
		field: "description_id" | "description_en",
		value: string,
	) => {
		setGalleryImages((prev) =>
			prev.map((img, i) => (i === index ? { ...img, [field]: value } : img)),
		);
	};

	// --- AUTO TRANSLATE ---
	const handleAutoTranslate = async (lang: string) => {
		setIsTranslating(true);

		const fieldMapping =
			lang === "en" ?
				[
					{ src: "title", dest: "title_en" },
					{ src: "description", dest: "description_en" },
				]
			:	[
					{ src: "title_en", dest: "title" },
					{ src: "description_en", dest: "description" },
				];

		// Validate source fields
		const sourceKeys = fieldMapping.map((f) => f.src);
		const isValid = await trigger(sourceKeys as any);

		if (!isValid) {
			toast.error("Please fill in required fields first");
			setIsTranslating(false);
			return;
		}

		const textsToTranslate = fieldMapping.map(
			(f) => getValues(f.src as any) || "",
		);

		const contentToTranslate = lang === "en" ? contentId : contentEn;
		textsToTranslate.push(contentToTranslate);

		if (textsToTranslate.every((t) => t.trim() === "")) {
			setIsTranslating(false);
			return toast.error("Please fill content first.");
		}

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/translate`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						texts: textsToTranslate,
						target_lang: lang,
					}),
					cache: "no-store",
				},
			);

			const result = await response.json();
			if (!response.ok) throw new Error(result.message);

			const translated = result.data.translated_text || result.data;
			if (Array.isArray(translated)) {
				fieldMapping.forEach((field, index) => {
					if (translated[index]) {
						setValue(field.dest as any, translated[index], {
							shouldValidate: true,
						});
					}
				});
				const translatedContent = translated[fieldMapping.length];
				if (translatedContent) {
					if (lang === "en") setContentEn(translatedContent);
					else setContentId(translatedContent);
				}
			}
			toast.success("Translation complete!");
		} catch (error: any) {
			toast.error("Translation failed: " + error.message);
		} finally {
			setIsTranslating(false);
		}
	};

	// --- SUBMIT ---
	const onSubmit = async (data: FormValues) => {
		if (!contentId.trim() || contentId === "<p></p>")
			return toast.error("Content (ID) is required");

		setIsLoading(true);

		const formData = new FormData();

		if (authorImageFile) formData.append("author_image", authorImageFile);

		formData.append("title", data.title);
		formData.append("title_en", data.title_en);
		if (data.description) formData.append("description", data.description);
		if (data.description_en)
			formData.append("description_en", data.description_en);
		formData.append("content", contentId);
		formData.append("content_en", contentEn);
		if (data.author) formData.append("author", data.author);

		// Gallery: new images
		const newImages = galleryImages.filter((img) => img.file);
		newImages.forEach((img) => {
			formData.append("images", img.file!);
		});

		// Descriptions for new images (as JSON arrays)
		const descriptionsId = newImages.map((img) => img.description_id);
		const descriptionsEn = newImages.map((img) => img.description_en);
		formData.append("descriptions_id", JSON.stringify(descriptionsId));
		formData.append("descriptions_en", JSON.stringify(descriptionsEn));

		// Deleted image IDs
		if (deletedImageIds.length > 0) {
			formData.append("deleted_image_ids", JSON.stringify(deletedImageIds));
		}

		const url =
			isEditMode ?
				`${process.env.NEXT_PUBLIC_API_URL}/news-csr/${initialData.id}`
			:	`${process.env.NEXT_PUBLIC_API_URL}/news-csr`;

		const method = isEditMode ? "PUT" : "POST";

		try {
			const res = await fetch(url, {
				method,
				credentials: "include",
				body: formData,
			});
			if (!res.ok) throw new Error("Failed");
			toast.success(isEditMode ? "CSR News updated!" : "CSR News created!");
			setTimeout(() => {
				router.push("/admin/content/news/csr");
			}, 500);
		} catch {
			toast.error("Error saving CSR news");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-5xl mx-auto pb-20 space-y-8 p-6 md:p-10">
			{/* HEADER */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ArrowLeft size={20} />
					</Button>
					<h1 className="text-2xl font-bold">
						{isEditMode ? "Edit CSR News" : "Create New CSR News"}
					</h1>
				</div>
				<div className="flex gap-2">
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
					toast.error("Please check the form for errors");
					console.error("Form Errors:", errors);
				})}
				className="space-y-8"
			>
				{/* 1. AUTHOR */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm flex items-center gap-2">
							<User size={14} /> Author Information
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="md:col-span-2">
								<FormInput
									label="Author Name"
									register={register("author")}
									error={errors.author}
									placeholder="e.g. John Doe"
								/>
							</div>
							<div>
								<ImageUploadField
									label="Author Photo"
									preview={authorImagePreview}
									onFileSelect={initiateCropAuthor}
									isNew={!!authorImageFile}
									aspectClass="aspect-square"
									note="Square (1:1)"
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 2. GALLERY IMAGES */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm flex items-center gap-2">
							<ImagePlus size={14} /> Gallery Images
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Existing + New images */}
						{galleryImages.length > 0 && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{galleryImages.map((img, index) => (
									<div
										key={index}
										className="border rounded-lg p-3 space-y-3 bg-slate-50/50 relative group"
									>
										{/* Remove Button */}
										<button
											type="button"
											onClick={() => removeGalleryImage(index)}
											className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<X size={14} />
										</button>

										{/* Image Preview */}
										<div className="relative aspect-video rounded-md overflow-hidden bg-slate-200">
											<Image
												src={img.preview}
												alt={`Gallery ${index + 1}`}
												fill
												className="object-cover"
												sizes="(max-width: 768px) 100vw, 50vw"
											/>
										</div>

										{/* Descriptions */}
										<div className="space-y-2">
											<div>
												<Label className="text-[10px] text-slate-400 uppercase">
													Description (ID)
												</Label>
												<Input
													value={img.description_id}
													onChange={(e) =>
														updateGalleryDescription(
															index,
															"description_id",
															e.target.value,
														)
													}
													placeholder="Deskripsi gambar..."
													className="h-8 text-sm bg-white"
												/>
											</div>
											<div>
												<Label className="text-[10px] text-slate-400 uppercase">
													Description (EN)
												</Label>
												<Input
													value={img.description_en}
													onChange={(e) =>
														updateGalleryDescription(
															index,
															"description_en",
															e.target.value,
														)
													}
													placeholder="Image description..."
													className="h-8 text-sm bg-white"
												/>
											</div>
										</div>
									</div>
								))}
							</div>
						)}

						{/* Add Image Button */}
						<label className="cursor-pointer flex flex-col items-center p-6 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 transition-all">
							<Plus size={24} className="text-slate-400 mb-2" />
							<span className="text-sm text-slate-500 font-medium">
								Add Gallery Image
							</span>
							<span className="text-[10px] text-slate-400 mt-1">
								Max 10 images
							</span>
							<input
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) initiateGalleryAdd(file);
									e.target.value = "";
								}}
								disabled={galleryImages.length >= 10}
							/>
						</label>
					</CardContent>
				</Card>

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

					<TabsContent value="id" className="space-y-6 mt-0">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">Content (ID)</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormInput
									label="Title"
									register={register("title")}
									error={errors.title}
									placeholder="Judul CSR..."
								/>

								<FormInput
									label="Description"
									register={register("description")}
									error={errors.description}
									placeholder="Deskripsi singkat CSR..."
									textarea
								/>
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
										Content
									</Label>
									<Tiptap
										content={contentId}
										onChange={setContentId}
										placeholder="Tulis konten CSR..."
									/>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="en" className="space-y-6 mt-0">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">Content (EN)</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormInput
									label="Title"
									register={register("title_en")}
									error={errors.title_en}
									placeholder="CSR title..."
								/>

								<FormInput
									label="Description"
									register={register("description_en")}
									error={errors.description_en}
									placeholder="Short CSR description..."
									textarea
								/>
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
										Content
									</Label>
									<Tiptap
										content={contentEn}
										onChange={setContentEn}
										placeholder="Write CSR content..."
									/>
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
						{isEditMode ? "Save Changes" : "Create CSR News"}
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
				aspect={cropTarget === "author" ? 1 : 16 / 9}
				setCroppedAreaPixels={setCroppedArea}
			/>
		</div>
	);
}
