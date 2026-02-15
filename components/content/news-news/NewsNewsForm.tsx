"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, Sparkles, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCroppedImg } from "@/utils/canvasUtils";

import { Button } from "@/components/ui/button";
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

interface NewsNewsFormProps {
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

export default function NewsNewsForm({
	initialData,
	isEditMode,
}: NewsNewsFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isTranslating, setIsTranslating] = useState(false);

	// Image State (Main image)
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(
		initialData?.image || null,
	);

	// Author Image State
	const [authorImageFile, setAuthorImageFile] = useState<File | null>(null);
	const [authorImagePreview, setAuthorImagePreview] = useState<string | null>(
		initialData?.author_image || null,
	);

	// Cropper State
	const [cropOpen, setCropOpen] = useState(false);
	const [cropSrc, setCropSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedArea, setCroppedArea] = useState(null);
	const [cropTarget, setCropTarget] = useState<"image" | "author">("image");

	// Tiptap content (outside react-hook-form since it's not a standard input)
	const [contentId, setContentId] = useState(
		initialData?.newsNewsId?.content || "",
	);
	const [contentEn, setContentEn] = useState(
		initialData?.newsNewsEn?.content || "",
	);

	// Form Init
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
				title: initialData.newsNewsId?.title || "",
				title_en: initialData.newsNewsEn?.title || "",
				description: initialData.newsNewsId?.description || "",
				description_en: initialData.newsNewsEn?.description || "",
				author: initialData.author || "",
			});
			setContentId(initialData.newsNewsId?.content || "");
			setContentEn(initialData.newsNewsEn?.content || "");
			setImagePreview(initialData.image || null);
			setAuthorImagePreview(initialData.author_image || null);
		}
	}, [initialData, reset]);

	// --- CROPPER ---
	const initiateCrop = (file: File, target: "image" | "author") => {
		setCropSrc(URL.createObjectURL(file));
		setCropTarget(target);
		setCropOpen(true);
		setZoom(1);
	};

	const handleSaveCrop = async () => {
		if (!cropSrc || !croppedArea) return;
		try {
			const croppedFile = await getCroppedImg(cropSrc, croppedArea);
			if (croppedFile) {
				if (cropTarget === "image") {
					setImageFile(croppedFile);
					setImagePreview(URL.createObjectURL(croppedFile));
				} else {
					setAuthorImageFile(croppedFile);
					setAuthorImagePreview(URL.createObjectURL(croppedFile));
				}
				setCropOpen(false);
				toast.success("Image cropped!");
			}
		} catch {
			toast.error("Crop failed");
		}
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

		// Also translate Tiptap content
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
				// Set translated content
				const translatedContent = translated[fieldMapping.length];
				if (translatedContent) {
					if (lang === "en") {
						setContentEn(translatedContent);
					} else {
						setContentId(translatedContent);
					}
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
		if (!isEditMode && !imageFile) return toast.error("Main image is required");

		if (!contentId.trim() || contentId === "<p></p>")
			return toast.error("Content (ID) is required");

		setIsLoading(true);

		const formData = new FormData();
		if (imageFile) {
            formData.append("image", imageFile);
            formData.append("image_status", "change");
        } else {
            formData.append("image_status", "keep");
        }

		if (authorImageFile) {
            formData.append("author_image", authorImageFile);
            formData.append("author_image_status", "change");
        } else {
            formData.append("author_image_status", "keep");
        }

		formData.append("title", data.title);
		formData.append("title_en", data.title_en);
		if (data.description) formData.append("description", data.description);
		if (data.description_en)
			formData.append("description_en", data.description_en);
		formData.append("content", contentId);
		formData.append("content_en", contentEn);
		if (data.author) formData.append("author", data.author);

		const url =
			isEditMode ?
				`${process.env.NEXT_PUBLIC_API_URL}/news-news/${initialData.id}`
			:	`${process.env.NEXT_PUBLIC_API_URL}/news-news`;

		const method = isEditMode ? "PUT" : "POST";

		try {
			const res = await fetch(url, {
				method,
				credentials: "include",
				body: formData,
			});
			if (!res.ok) throw new Error("Failed");
			toast.success(isEditMode ? "News updated!" : "News created!");
			setTimeout(() => {
				router.push("/admin/content/news");
			}, 500);
		} catch {
			toast.error("Error saving news");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-5xl mx-auto pb-20 space-y-8 p-6 md:p-10">
			{/* HEADER */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        disabled={isLoading || isTranslating}
                    >
						<ArrowLeft size={20} />
					</Button>
					<h1 className="text-2xl font-bold">
						{isEditMode ? "Edit News" : "Create New News"}
					</h1>
				</div>
				<div className="flex gap-2">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => handleAutoTranslate("id")}
						disabled={isTranslating || isLoading}
						className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
					>
						{isTranslating ?
							<Loader2 className="animate-spin mr-2 h-4 w-4" />
						:	<Sparkles className="mr-2 h-4 w-4" />}
						EN → ID
					</Button>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => handleAutoTranslate("en")}
						disabled={isTranslating || isLoading}
						className="text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
					>
						{isTranslating ?
							<Loader2 className="animate-spin mr-2 h-4 w-4" />
						:	<Sparkles className="mr-2 h-4 w-4" />}
						ID → EN
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
				})}
				className="space-y-8"
			>
				{/* 1. IMAGES */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Card className="md:col-span-2">
						<CardHeader>
							<CardTitle className="text-sm">Main Image (16:9)</CardTitle>
						</CardHeader>
						<CardContent>
							<ImageUploadField
								label="News Image"
								preview={imagePreview}
								onFileSelect={(f) => initiateCrop(f, "image")}
								isNew={!!imageFile}
								aspectClass="aspect-video"
                                disabled={isLoading || isTranslating}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-sm flex items-center gap-2">
								<User size={14} /> Author
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormInput
								label="Author Name"
								register={register("author")}
								error={errors.author}
								placeholder="e.g. John Doe"
                                disabled={isLoading || isTranslating}
							/>
							<ImageUploadField
								label="Author Photo"
								preview={authorImagePreview}
								onFileSelect={(f) => initiateCrop(f, "author")}
								isNew={!!authorImageFile}
								aspectClass="aspect-square"
								note="Square (1:1)"
                                disabled={isLoading || isTranslating}
							/>
						</CardContent>
					</Card>
				</div>

				{/* 2. MULTILINGUAL TABS */}
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
									label="Title"
									register={register("title")}
									error={errors.title}
									placeholder="Judul berita..."
                                    disabled={isLoading || isTranslating}
								/>
								<FormInput
									label="Description"
									register={register("description")}
									error={errors.description}
									placeholder="Deskripsi singkat berita..."
									textarea
                                    disabled={isLoading || isTranslating}
								/>
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
										Content
									</Label>
									<Tiptap
										content={contentId}
										onChange={setContentId}
										placeholder="Tulis konten berita..."
										enableImageUpload={true}
                                        disabled={isLoading || isTranslating}
									/>
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
									label="Title"
									register={register("title_en")}
									error={errors.title_en}
									placeholder="News title..."
                                    disabled={isLoading || isTranslating}
								/>
								<FormInput
									label="Description"
									register={register("description_en")}
									error={errors.description_en}
									placeholder="Short news description..."
									textarea
                                    disabled={isLoading || isTranslating}
								/>
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
										Content
									</Label>
									<Tiptap
										content={contentEn}
										onChange={setContentEn}
										placeholder="Write news content..."
										enableImageUpload={true}
                                        disabled={isLoading || isTranslating}
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
						disabled={isLoading || isTranslating}
						className="min-w-[150px]"
					>
						{isLoading ?
							<Loader2 className="animate-spin mr-2" />
						:	null}
						{isEditMode ? "Save Changes" : "Create News"}
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
				aspect={cropTarget === "image" ? 16 / 9 : 1}
				setCroppedAreaPixels={setCroppedArea}
			/>
		</div>
	);
}
