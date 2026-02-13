"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCroppedImg } from "@/utils/canvasUtils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadField, FormInput } from "@/components/forms/FormComponents";
import { CropImageDialog } from "@/components/ui/crop-image-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// --- SCHEMA ---
const formSchema = z.object({
    name: z.string().min(1, "Partner name is required"),
    category: z.enum(["INSURANCE", "FUNDING"]).default("INSURANCE"),
});

type FormValues = z.infer<typeof formSchema>;

interface PartnerFormProps {
    initialData?: any;
    isEditMode?: boolean;
}

export default function PartnerForm({
    initialData,
    isEditMode,
}: PartnerFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Image & Cropper
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(
        initialData?.logo_image || null,
    );
    const [cropOpen, setCropOpen] = useState(false);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            category: "INSURANCE",
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = form;

    const selectedCategory = watch("category");

    // PREFILL
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name || "",
                category: initialData.category || "INSURANCE",
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

    // --- SUBMIT ---
    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);

        const formData = new FormData();
        if (file) formData.append("logo_image", file);
        formData.append("name", data.name);
        formData.append("category", data.category);

        const url =
            isEditMode
                ? `${process.env.NEXT_PUBLIC_API_URL}/partner/${initialData.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/partner`;

        const method = isEditMode ? "PUT" : "POST";

        try {
            const res = await fetch(url, { method, body: formData, credentials: "include" });
            if (!res.ok) throw new Error("Failed");
            toast.success(isEditMode ? "Partner updated!" : "Partner added!");
            setTimeout(() => {
                router.push("/admin/content/partner");
            }, 500);
        } catch {
            toast.error("Error saving partner");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8">
            {/* HEADER */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1 className="text-2xl font-bold">
                    {isEditMode ? "Edit Partner" : "Add New Partner"}
                </h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* 1. LOGO IMAGE (SQUARE) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex gap-2">
                            <ImageIcon className="w-5 h-5" /> Partner Logo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-xs">
                            <ImageUploadField
                                label="Upload Logo"
                                preview={preview}
                                onFileSelect={initiateCrop}
                                isNew={!!file}
                                aspectClass="aspect-video"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. PARTNER DETAILS */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Partner Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormInput
                            label="Partner Name"
                            register={register("name")}
                            error={errors.name}
                            placeholder="Nama partner..."
                        />

                        {/* CATEGORY SELECT */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Category
                            </Label>
                            <Select
                                value={selectedCategory}
                                onValueChange={(val) =>
                                    setValue("category", val as "INSURANCE" | "FUNDING", {
                                        shouldValidate: true,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INSURANCE">Insurance</SelectItem>
                                    <SelectItem value="FUNDING">Funding</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-6 border-t">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={isLoading}
                        className="min-w-[150px]"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                        {isEditMode ? "Save Changes" : "Add Partner"}
                    </Button>
                </div>
            </form>

            {/* CROPPER DIALOG */}
            <CropImageDialog
                isOpen={cropOpen}
                onClose={setCropOpen}
                onSave={handleSaveCrop}
                imageSrc={cropSrc}
                crop={crop}
                setCrop={setCrop}
                zoom={zoom}
                setZoom={setZoom}
                aspect={16 / 9}
                setCroppedAreaPixels={setCroppedArea}
            />
        </div>
    );
}
