"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import {
	Loader2,
	Save,
	FileText,
	UploadCloud,
	X,
	Calendar as CalendarIcon,
	Trash2,
	Plus,
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Tiptap from "@/components/ui/Tiptap";
import { getCroppedImg } from "@/utils/canvasUtils";
import { ImageUploadField } from "@/components/forms/FormComponents";
import { CropImageDialog } from "@/components/ui/crop-image-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// --- VALIDATION SCHEMA ---
const formSchema = z.object({
	title_id: z.string().min(1, "Title (ID) is required"),
	title_en: z.string().min(1, "Title (EN) is required"),
	description_id: z.string().min(1, "Description (ID) is required"),
	description_en: z.string().min(1, "Description (EN) is required"),
	publish_at: z.date({ message: "Publish date is required" }),
	is_publish: z.boolean().default(true),
	reportCategoryId: z.string().min(1, "Category is required"),
	news_author: z.string().optional(),
	news_image: z.any().optional(),
	news_author_image: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ReportFormProps {
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

export default function ReportForm({
	initialData,
	isEditMode = false,
}: ReportFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [categories, setCategories] = useState<any[]>([]);
	const [file, setFile] = useState<File | null>(null);
    
    // News State
    const [showNews, setShowNews] = useState(false);
	const [newsImageFile, setNewsImageFile] = useState<File | null>(null);
    const [newsImagePreview, setNewsImagePreview] = useState<string | null>(null);
	const [newsAuthorImageFile, setNewsAuthorImageFile] = useState<File | null>(null);
    const [newsAuthorImagePreview, setNewsAuthorImagePreview] = useState<string | null>(null);
	const [newsContentId, setNewsContentId] = useState("");
	const [newsContentEn, setNewsContentEn] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);

	const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
    
    // Cropper State
	const [cropOpen, setCropOpen] = useState(false);
	const [cropSrc, setCropSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedArea, setCroppedArea] = useState(null);
	const [cropTarget, setCropTarget] = useState<"news" | "author">("news");

	const router = useRouter();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema) as any,
		defaultValues: {
			title_id: "",
			title_en: "",
			description_id: "",
			description_en: "",
			publish_at: new Date(),
			is_publish: true,
			reportCategoryId: "",
		},
	});

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = form;

	// --- FETCH CATEGORIES ---
	useEffect(() => {
		const fetchCats = async () => {
			try {
				const res = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/report-category`,
					{ credentials: "include" },
				);
				const json = await res.json();
				if (res.ok) setCategories(json.data || []);
			} catch (e) {
				console.error(e);
			}
		};
		fetchCats();
	}, []);

	// --- PREFILL DATA ---
	useEffect(() => {
		if (isEditMode && initialData) {
			console.log(initialData)
			setValue("title_id", initialData.title_id || "");
			setValue("title_en", initialData.title_en || "");
			setValue("description_id", initialData.description_id || "");
			setValue("description_en", initialData.description_en || "");
			setValue("publish_at", new Date(initialData.publish_at));
			setValue("is_publish", initialData.is_publish);
			setValue("reportCategoryId", initialData.reportCategoryId);
			if (initialData.file_url) {
				setExistingFileUrl(initialData.file_url);
			}
			// News Content Prefill (if exists)
			if (initialData.news && initialData.news.length > 0) {
                setShowNews(true);
                const news = initialData.news[0];
                setValue("news_author", news.author || "");
                setNewsImagePreview(news.image || null);
                setNewsAuthorImagePreview(news.author_image || null);

                if (news.newsNewsId?.content) {
                    setNewsContentId(news.newsNewsId.content);
                }
                if (news.newsNewsEn?.content) {
                    setNewsContentEn(news.newsNewsEn.content);
                }
			}
		}
	}, [initialData, isEditMode, setValue]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFile(e.target.files[0]);
		}
	};

    // --- CROPPER ---
	const initiateCrop = (file: File, target: "news" | "author") => {
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
				if (cropTarget === "news") {
					setNewsImageFile(croppedFile);
					setNewsImagePreview(URL.createObjectURL(croppedFile));
				} else {
					setNewsAuthorImageFile(croppedFile);
					setNewsAuthorImagePreview(URL.createObjectURL(croppedFile));
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
        // Note: For report news, we are translating News Content only usually, 
        // but here the news title uses the Report title. 
        // We can just translate the Tiptap content.
        
        const contentToTranslate = lang === "en" ? newsContentId : newsContentEn;

        if (!contentToTranslate || contentToTranslate.trim() === "") {
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
                        texts: [contentToTranslate],
                        target_lang: lang,
                    }),
                    cache: "no-store",
                },
            );

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            const translated = result.data.translated_text || result.data;
            if (Array.isArray(translated) && translated[0]) {
                if (lang === "en") {
                    setNewsContentEn(translated[0]);
                } else {
                    setNewsContentId(translated[0]);
                }
            }
            toast.success("Translation complete!");
        } catch (error: any) {
            toast.error("Translation failed: " + error.message);
        } finally {
            setIsTranslating(false);
        }
    };

	const onSubmit = async (data: FormValues) => {
		if (!isEditMode && !file) {
			toast.error("Please upload a report file.");
			return;
		}

		setIsLoading(true);
		const formData = new FormData();

		formData.append("title_id", data.title_id || "");
		formData.append("title_en", data.title_en || "");
		formData.append("description_id", data.description_id || "");
		formData.append("description_en", data.description_en || "");
		formData.append("publish_at", data.publish_at.toISOString());
		formData.append("is_publish", String(data.is_publish));
		formData.append("reportCategoryId", data.reportCategoryId);


		if (file) {
			formData.append("file_url", file);
			formData.append("file_status", "change");
		} else {
			formData.append("file_status", "keep");
		}

        if (showNews) {
            if (newsImageFile) {
                formData.append("news_image", newsImageFile);
            }
            if (newsAuthorImageFile) {
                formData.append("news_author_image", newsAuthorImageFile);
            }
            formData.append("news_author", data.news_author || "");
            formData.append("news_content_id", newsContentId);
            formData.append("news_content_en", newsContentEn);
        }

		try {
			const url =
				isEditMode ?
					`${process.env.NEXT_PUBLIC_API_URL}/report/${initialData.id}`
				:	`${process.env.NEXT_PUBLIC_API_URL}/report`;
			const method = isEditMode ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				body: formData, // FormData automatically sets Content-Type
				credentials: "include",
			});

			const json = await res.json();

			if (res.ok) {
				toast.success(isEditMode ? "Report updated" : "Report created");
				router.push("/admin/content/report");
			} else {
				toast.error(json.message || "Failed to save report");
			}
		} catch {
			toast.error("Error submitting form");
		} finally {
			setIsLoading(false);
		}
	};

	return (
        <>
		<form
			onSubmit={handleSubmit(onSubmit as any, (errors) => {
				const msg = getErrorMessage(errors);
				if (msg) {
					toast.error(msg);
				} else {
					toast.error("Please check the form for errors");
				}
			})}
			className="space-y-8 max-w-4xl"
		>
			<Card>
				<CardContent className="p-6 space-y-6">
					{/* ROW 1: Category & Date */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-2">
							<Label>Category</Label>
							<Select
								onValueChange={(val) => setValue("reportCategoryId", val)}
								value={watch("reportCategoryId")}
                                disabled={isLoading || isTranslating}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select Category" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.reportCategoryId && (
								<p className="text-xs text-red-500">
									{errors.reportCategoryId.message}
								</p>
							)}
						</div>

						<div className="space-y-2 flex flex-col">
							<Label>Publish Date</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={"outline"}
                                        disabled={isLoading || isTranslating}
										className={cn(
											"w-full pl-3 text-left font-normal",
											!watch("publish_at") && "text-muted-foreground",
										)}
									>
										{watch("publish_at") ?
											format(watch("publish_at"), "PPP")
										:	<span>Pick a date</span>}
										<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={watch("publish_at")}
										onSelect={(date: Date | undefined) => {
											if (date) setValue("publish_at", date);
										}}
										disabled={(date: Date) =>
											date > new Date() || date < new Date("1900-01-01") || isLoading || isTranslating
										}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					{/* File Upload */}
					<div className="space-y-2">
						<Label>Report File (PDF, Word, Excel)</Label>
						<div className={`border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors relative ${isLoading || isTranslating ? 'opacity-50 pointer-events-none' : ''}`}>
							<Input
								type="file"
								className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
								accept=".pdf,.doc,.docx,.xls,.xlsx"
								onChange={handleFileChange}
                                disabled={isLoading || isTranslating}
							/>
							<div className="space-y-2 pointer-events-none">
								<div className="bg-blue-50 text-blue-500 p-3 rounded-full inline-block">
									<UploadCloud size={24} />
								</div>
								<div className="text-sm font-medium">
									{file ?
										<span className="text-blue-600">{file.name}</span>
									:	"Click or drag file to upload"}
								</div>
								<div className="text-xs text-slate-400">
									Max size 50MB. Supported: PDF, DOCX, XLSX.
								</div>
							</div>
						</div>
						{existingFileUrl && !file && (
							<div className="flex items-center gap-2 mt-2 p-2 bg-slate-100 rounded text-sm text-slate-600">
								<FileText size={14} />
								Current file:
								<a
									href={existingFileUrl}
									target="_blank"
									className="text-blue-600 hover:underline truncate max-w-[300px]"
								>
									{existingFileUrl.split("/").pop()}
								</a>
							</div>
						)}
					</div>

					{/* Title & Desc (ID) */}
					<div className="space-y-4 pt-4 border-t">
						<h3 className="font-semibold text-slate-900">Bahasa Indonesia</h3>
						<div className="space-y-2">
							<Label htmlFor="title_id">Judul Report</Label>
							<Input
								id="title_id"
								placeholder="Laporan Tahunan 2024"
								{...register("title_id")}
                                disabled={isLoading || isTranslating}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="desc_id">Deskripsi Singkat</Label>
							<Textarea
								id="desc_id"
								placeholder="Deskripsi laporan..."
								{...register("description_id")}
                                disabled={isLoading || isTranslating}
							/>
						</div>
					</div>

					{/* Title & Desc (EN) */}
					<div className="space-y-4 pt-4 border-t">
						<h3 className="font-semibold text-slate-900">English</h3>
						<div className="space-y-2">
							<Label htmlFor="title_en">Report Title</Label>
							<Input
								id="title_en"
								placeholder="Annual Report 2024"
								{...register("title_en")}
                                disabled={isLoading || isTranslating}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="desc_en">Short Description</Label>
							<Textarea
								id="desc_en"
								placeholder="Report description..."
								{...register("description_en")}
                                disabled={isLoading || isTranslating}
							/>
						</div>
					</div>

					{/* News Configuration */}
					<div className="space-y-4 pt-4 border-t">
						<div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900">
                                News Configuration (Linked News)
                            </h3>
                            {showNews ? (
                                <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => setShowNews(false)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Remove News
                                </Button>
                            ) : (
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => setShowNews(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add News
                                </Button>
                            )}
                        </div>

                        {showNews && (
                            <>
                                {/* Row 1: Author & Author Image */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="news_author">News Author</Label>
                                        <Input
                                            id="news_author"
                                            placeholder="Author Name"
                                            {...register("news_author")}
                                            disabled={isLoading || isTranslating}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                         <ImageUploadField
                                            label="News Author Image"
                                            preview={newsAuthorImagePreview}
                                            onFileSelect={(f) => initiateCrop(f, "author")}
                                            isNew={!!newsAuthorImageFile}
                                            aspectClass="aspect-square"
                                            note="Square (1:1)"
                                            disabled={isLoading || isTranslating}
                                        />
                                    </div>
                                </div>
                                
                                {/* Row 2: News Image (Full Width) */}
                                <div className="space-y-2 mt-6">
                                    <ImageUploadField
                                        label="News Image"
                                        preview={newsImagePreview}
                                        onFileSelect={(f) => initiateCrop(f, "news")}
                                        isNew={!!newsImageFile}
                                        aspectClass="aspect-video"
                                        disabled={isLoading || isTranslating}
                                    />
                                </div>
                                
                                <div className="flex justify-end gap-2 mt-4">
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
                                        EN → ID (Content)
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
                                        ID → EN (Content)
                                    </Button>
                                </div>

                                {/* News Content ID */}
                                <div className="space-y-2 mt-4">
                                    <Label>News Content (ID)</Label>
                                    <Tiptap
                                        content={newsContentId}
                                        onChange={setNewsContentId}
                                        placeholder="News content (Bahasa Indonesia)..."
                                        enableImageUpload={true}
                                        disabled={isLoading || isTranslating}
                                    />
                                </div>

                                {/* News Content EN */}
                                <div className="space-y-2 mt-4">
                                    <Label>News Content (EN)</Label>
                                    <Tiptap
                                        content={newsContentEn}
                                        onChange={setNewsContentEn}
                                        placeholder="News content (English)..."
                                        enableImageUpload={true}
                                        disabled={isLoading || isTranslating}
                                    />
                                </div>
                            </>
                        )}
					</div>

					{/* Publish Switch */}
					<div className="flex items-center gap-4 pt-4 border-t">
						<Switch
							checked={!!watch("is_publish")}
							onCheckedChange={(val) => setValue("is_publish", val)}
                            disabled={isLoading || isTranslating}
						/>
						<Label>Publish this report immediately</Label>
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="ghost"
					onClick={() => router.back()}
					disabled={isLoading || isTranslating}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isLoading || isTranslating} className="min-w-[120px]">
					{isLoading ?
						<Loader2 className="animate-spin mr-2 h-4 w-4" />
					:	<Save className="mr-2 h-4 w-4" />}
					{isEditMode ? "Save Changes" : "Create Report"}
				</Button>
			</div>
		</form>

        <CropImageDialog
            isOpen={cropOpen}
            onClose={setCropOpen}
            onSave={handleSaveCrop}
            imageSrc={cropSrc}
            crop={crop}
            setCrop={setCrop}
            zoom={zoom}
            setZoom={setZoom}
            aspect={cropTarget === "news" ? 16 / 9 : 1}
            setCroppedAreaPixels={setCroppedArea}
        />
    </>
	);
}
