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
    TrendingUp,
    FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCroppedImg } from "@/utils/canvasUtils";
import Image from "next/image";

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
import { useRouter } from "next/navigation";

// --- 1. SCHEMA VALIDATION ---
const formSchema = z.object({
    // ID
    hero_title: z.string().min(1, "Hero Title (ID) is required"),
    hero_desc: z.string().min(1, "Hero Desc (ID) is required"),
    hero_badge: z.string().min(1, "Hero Badge (ID) is required"),
    stakeholders_title: z.string().min(1, "Stakeholders Title (ID) is required"),
    stakeholders_desc: z.string().min(1, "Stakeholders Desc (ID) is required"),
    stakeholders_badge: z.string().min(1, "Stakeholders Badge (ID) is required"),
    report_title: z.string().min(1, "Report Title (ID) is required"),
    report_desc: z.string().min(1, "Report Desc (ID) is required"),
    report_badge: z.string().min(1, "Report Badge (ID) is required"),

    // EN
    hero_title_en: z.string().min(1, "Hero Title (EN) is required"),
    hero_desc_en: z.string().min(1, "Hero Desc (EN) is required"),
    hero_badge_en: z.string().min(1, "Hero Badge (EN) is required"),
    stakeholders_title_en: z.string().min(1, "Stakeholders Title (EN) is required"),
    stakeholders_desc_en: z.string().min(1, "Stakeholders Desc (EN) is required"),
    stakeholders_badge_en: z.string().min(1, "Stakeholders Badge (EN) is required"),
    report_title_en: z.string().min(1, "Report Title (EN) is required"),
    report_desc_en: z.string().min(1, "Report Desc (EN) is required"),
    report_badge_en: z.string().min(1, "Report Badge (EN) is required"),
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
                    "resize-none min-h-25 bg-slate-50 focus:bg-white transition-colors text-sm",
                    error && "border-red-500 focus-visible:ring-red-500",
                )}
            />
            : <Input
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

// --- 3. MAIN COMPONENT ---
interface InvestorPageFormProps {
    initialData?: any;
    isEditMode?: boolean;
}

export default function InvestorPageForm({
    initialData,
    isEditMode = false,
}: InvestorPageFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const router = useRouter();

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
            hero_badge: "",
            stakeholders_title: "",
            stakeholders_desc: "",
            stakeholders_badge: "",
            report_title: "",
            report_desc: "",
            report_badge: "",
            hero_title_en: "",
            hero_desc_en: "",
            hero_badge_en: "",
            stakeholders_title_en: "",
            stakeholders_desc_en: "",
            stakeholders_badge_en: "",
            report_title_en: "",
            report_desc_en: "",
            report_badge_en: "",
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
                hero_title: initialData.inverstorPageId?.hero_title || "",
                hero_desc: initialData.inverstorPageId?.hero_desc || "",
                hero_badge: initialData.inverstorPageId?.hero_badge || "",
                stakeholders_title: initialData.inverstorPageId?.stakeholders_title || "",
                stakeholders_desc: initialData.inverstorPageId?.stakeholders_desc || "",
                stakeholders_badge: initialData.inverstorPageId?.stakeholders_badge || "",
                report_title: initialData.inverstorPageId?.report_title || "",
                report_desc: initialData.inverstorPageId?.report_desc || "",
                report_badge: initialData.inverstorPageId?.report_badge || "",

                hero_title_en: initialData.inverstorPageEn?.hero_title || "",
                hero_desc_en: initialData.inverstorPageEn?.hero_desc || "",
                hero_badge_en: initialData.inverstorPageEn?.hero_badge || "",
                stakeholders_title_en: initialData.inverstorPageEn?.stakeholders_title || "",
                stakeholders_desc_en: initialData.inverstorPageEn?.stakeholders_desc || "",
                stakeholders_badge_en: initialData.inverstorPageEn?.stakeholders_badge || "",
                report_title_en: initialData.inverstorPageEn?.report_title || "",
                report_desc_en: initialData.inverstorPageEn?.report_desc || "",
                report_badge_en: initialData.inverstorPageEn?.report_badge || "",
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
                { src: "hero_badge", dest: "hero_badge_en" },
                { src: "stakeholders_title", dest: "stakeholders_title_en" },
                { src: "stakeholders_desc", dest: "stakeholders_desc_en" },
                { src: "stakeholders_badge", dest: "stakeholders_badge_en" },
                { src: "report_title", dest: "report_title_en" },
                { src: "report_desc", dest: "report_desc_en" },
                { src: "report_badge", dest: "report_badge_en" },
            ];
        } else {
            fieldMapping = [
                { src: "hero_title_en", dest: "hero_title" },
                { src: "hero_desc_en", dest: "hero_desc" },
                { src: "hero_badge_en", dest: "hero_badge" },
                { src: "stakeholders_title_en", dest: "stakeholders_title" },
                { src: "stakeholders_desc_en", dest: "stakeholders_desc" },
                { src: "stakeholders_badge_en", dest: "stakeholders_badge" },
                { src: "report_title_en", dest: "report_title" },
                { src: "report_desc_en", dest: "report_desc" },
                { src: "report_badge_en", dest: "report_badge" },
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
            return toast.error("Please fill content first.");
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
        if (!isEditMode && !imageFile) {
            return toast.error("Hero Image is required");
        }

        setIsLoading(true);
        const formData = new FormData();

        if (imageFile) {
            formData.append("hero_bg", imageFile);
            formData.append("image_status", "change");
        } else {
            formData.append("image_status", "keep");
        }

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const url =
            isEditMode ?
                `${process.env.NEXT_PUBLIC_API_URL}/page/investor/${initialData.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/page/investor`;
        const method = isEditMode ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                credentials: "include",
                body: formData,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            toast.success(isEditMode ? "Investor Page Updated!" : "Investor Page Created!");
            setTimeout(() => {
                router.push("/admin/pages/investor");
            }, 500);
        } catch (e: any) {
            toast.error(e.message || "Failed to submit");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">
                    {isEditMode ? "Edit Investor Page" : "Create Investor Page"}
                </h1>
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

            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                const msg = getErrorMessage(errors);
                if (msg) {
                    toast.error(msg);
                } else {
                    toast.error("Please check the form for errors");
                }
                console.error("Form Errors:", errors);
            })} className="space-y-8">
                {/* === SECTION 1: HERO IMAGE (Global) === */}
                <Card>
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                            <ImageIcon className="h-5 w-5 text-blue-600" /> Hero Background
                            (Single Image)
                        </CardTitle>
                        <CardDescription>
                            Upload landscape image. Click image to crop/change.
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
                                    : <label className="cursor-pointer flex flex-col items-center p-8 w-full h-full justify-center">
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
                                    : null}
                        </div>
                    </CardContent>
                </Card>

                {/* === SECTION 2: TABS (CONTENT PER LANGUAGE) === */}
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
                            <FormInput
                                id="hero_badge"
                                label="Hero Badge"
                                register={form.register}
                                error={errors.hero_badge}
                            />
                        </SectionGroup>

                        <SectionGroup title="Stakeholders Section (ID)" icon={TrendingUp}>
                            <FormInput
                                id="stakeholders_title"
                                label="Stakeholders Title"
                                register={form.register}
                                error={errors.stakeholders_title}
                            />
                            <FormInput
                                id="stakeholders_desc"
                                label="Stakeholders Description"
                                textarea
                                register={form.register}
                                error={errors.stakeholders_desc}
                            />
                            <FormInput
                                id="stakeholders_badge"
                                label="Stakeholders Badge"
                                register={form.register}
                                error={errors.stakeholders_badge}
                            />
                        </SectionGroup>

                        <SectionGroup title="Report Section (ID)" icon={FileText}>
                            <FormInput
                                id="report_title"
                                label="Report Title"
                                register={form.register}
                                error={errors.report_title}
                            />
                            <FormInput
                                id="report_desc"
                                label="Report Description"
                                textarea
                                register={form.register}
                                error={errors.report_desc}
                            />
                            <FormInput
                                id="report_badge"
                                label="Report Badge"
                                register={form.register}
                                error={errors.report_badge}
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
                            <FormInput
                                id="hero_badge_en"
                                label="Hero Badge (EN)"
                                register={form.register}
                                error={errors.hero_badge_en}
                            />
                        </SectionGroup>

                        <SectionGroup title="Stakeholders Section (EN)" icon={TrendingUp}>
                            <FormInput
                                id="stakeholders_title_en"
                                label="Stakeholders Title (EN)"
                                register={form.register}
                                error={errors.stakeholders_title_en}
                            />
                            <FormInput
                                id="stakeholders_desc_en"
                                label="Stakeholders Description (EN)"
                                textarea
                                register={form.register}
                                error={errors.stakeholders_desc_en}
                            />
                            <FormInput
                                id="stakeholders_badge_en"
                                label="Stakeholders Badge (EN)"
                                register={form.register}
                                error={errors.stakeholders_badge_en}
                            />
                        </SectionGroup>

                        <SectionGroup title="Report Section (EN)" icon={FileText}>
                            <FormInput
                                id="report_title_en"
                                label="Report Title (EN)"
                                register={form.register}
                                error={errors.report_title_en}
                            />
                            <FormInput
                                id="report_desc_en"
                                label="Report Description (EN)"
                                textarea
                                register={form.register}
                                error={errors.report_desc_en}
                            />
                            <FormInput
                                id="report_badge_en"
                                label="Report Badge (EN)"
                                register={form.register}
                                error={errors.report_badge_en}
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
                        className="min-w-50"
                    >
                        {isLoading ?
                            <Loader2 className="animate-spin mr-2" />
                            : null}
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
