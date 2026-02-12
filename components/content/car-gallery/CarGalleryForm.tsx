"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Loader2, Sparkles, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCroppedImg } from "@/utils/canvasUtils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadField, FormInput } from "@/components/forms/FormComponents";
import { CropImageDialog } from "@/components/ui/crop-image-dialog";

// --- SCHEMA ---
const formSchema = z.object({
	title: z.string().min(1, "Title (ID) required"),
	desc: z.string().min(1, "Description (ID) required"),
	title_en: z.string().min(1, "Title (EN) required"),
	desc_en: z.string().min(1, "Description (EN) required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CarGalleryFormProps {
	initialData?: any;
	isEditMode?: boolean;
}

export default function CarGalleryForm({
	initialData,
	isEditMode,
}: CarGalleryFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isTranslating, setIsTranslating] = useState(false);

	// Image & Cropper
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(
		initialData?.car_image || null,
	);
	const [cropOpen, setCropOpen] = useState(false);
	const [cropSrc, setCropSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedArea, setCroppedArea] = useState(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { title: "", desc: "", title_en: "", desc_en: "" },
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		getValues,
		setValue,
	} = form;

	// PREFILL
	useEffect(() => {
		if (initialData) {
			reset({
				title: initialData.carGalleryId?.title || "",
				desc: initialData.carGalleryId?.desc || "",
				title_en: initialData.carGalleryEn?.title || "",
				desc_en: initialData.carGalleryEn?.desc || "",
			});
		}
	}, [initialData, reset]);

	// --- CROPPER HANDLERS ---
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

	// --- AUTO TRANSLATE (CHUNKED) ---
	const handleAutoTranslate = async (lang: string) => {
		setIsTranslating(true);
		let fieldMapping;
		if (lang == "en") {
			fieldMapping = [
				{ src: "title", dest: "title_en" },
				{ src: "desc", dest: "desc_en" },
			];
		} else {
			fieldMapping = [
				{ src: "title_en", dest: "title" },
				{ src: "desc_en", dest: "desc" },
			];
		}
		const texts = fieldMapping.map((f) => getValues(f.src as any) || "");

		if (texts.every((t) => t.trim() === "")) {
			setIsTranslating(false);
			return toast.error("Fill ID content first");
		}

		try {
			// Chunking logic (sama seperti form lain)
			const CHUNK_SIZE = 3;
			const totalChunks = Math.ceil(texts.length / CHUNK_SIZE);
			let finalTranslatedResults: string[] = [];

			for (let i = 0; i < totalChunks; i++) {
				const start = i * CHUNK_SIZE;
				const end = start + CHUNK_SIZE;
				const chunkTexts = texts.slice(start, end);
				if (chunkTexts.length === 0) continue;

				const res = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/translate`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ texts: chunkTexts, target_lang: lang }),
					},
				);
				const json = await res.json();
				const batch = json.data.translated_text || json.data;
				if (Array.isArray(batch))
					finalTranslatedResults = [...finalTranslatedResults, ...batch];
			}

			fieldMapping.forEach((f, i) => {
				if (finalTranslatedResults[i])
					setValue(f.dest as any, finalTranslatedResults[i], {
						shouldValidate: true,
					});
			});
			toast.success("Translated!");
		} catch {
			toast.error("Translation failed");
		} finally {
			setIsTranslating(false);
		}
	};

	// --- SUBMIT ---
	const onSubmit = async (data: FormValues) => {
		if (!isEditMode && !file) return toast.error("Car Image is required");
		setIsLoading(true);

		const formData = new FormData();
		if (file) formData.append("car_image", file);
		Object.entries(data).forEach(([k, v]) => formData.append(k, String(v)));

		const url =
			isEditMode ?
				`${process.env.NEXT_PUBLIC_API_URL}/car-gallery/${initialData.id}`
			:	`${process.env.NEXT_PUBLIC_API_URL}/car-gallery`;

		const method = isEditMode ? "PUT" : "POST";

		try {
			const res = await fetch(url, { method, body: formData });
			if (!res.ok) throw new Error("Failed");
			toast.success(isEditMode ? "Car updated!" : "Car added!");
			setTimeout(() => {
				router.push("/admin/content/car-gallery");
			}, 500);
		} catch {
			toast.error("Error saving car");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto pb-20 space-y-8">
			{/* HEADER */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ArrowLeft size={20} />
					</Button>
					<h1 className="text-2xl font-bold">
						{isEditMode ? "Edit Car Details" : "Add New Car"}
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

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
				{/* 1. IMAGE (16:9 Landscape) */}
				<Card>
					<CardHeader>
						<CardTitle className="flex gap-2">
							<ImageIcon className="w-5 h-5" /> Car Image (16:9)
						</CardTitle>
					</CardHeader>
					<CardContent>
						{/* Container lebih lebar untuk landscape */}
						<div className="max-w-md">
							<ImageUploadField
								label="Upload Photo"
								preview={preview}
								onFileSelect={initiateCrop}
								isNew={!!file}
								aspectClass="aspect-video" // <-- Change Here
							/>
						</div>
					</CardContent>
				</Card>

				{/* 2. TABS CONTENT */}
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
									label="Car Name / Title"
									register={register("title")}
									error={errors.title}
								/>
								<FormInput
									label="Description"
									textarea
									register={register("desc")}
									error={errors.desc}
								/>
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
									label="Car Name / Title"
									register={register("title_en")}
									error={errors.title_en}
								/>
								<FormInput
									label="Description"
									textarea
									register={register("desc_en")}
									error={errors.desc_en}
								/>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

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
						{isEditMode ? "Save Changes" : "Add Car"}
					</Button>
				</div>
			</form>

			{/* CROPPER DIALOG (ASPECT 16:9) */}
			<CropImageDialog
				isOpen={cropOpen}
				onClose={setCropOpen}
				onSave={handleSaveCrop}
				imageSrc={cropSrc}
				crop={crop}
				setCrop={setCrop}
				zoom={zoom}
				setZoom={setZoom}
				aspect={16 / 9} // <-- Change Here
				setCroppedAreaPixels={setCroppedArea}
			/>
		</div>
	);
}
