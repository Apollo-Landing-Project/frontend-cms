"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast, { Toaster } from "react-hot-toast";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCroppedImg } from "@/utils/canvasUtils"; 

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadField, FormInput } from "@/components/forms/FormComponents"; 
import { CropImageDialog } from "@/components/ui/crop-image-dialog";

const formSchema = z.object({
  title: z.string().min(1, "Required"),
  desc: z.string().min(1, "Required"),
  title_en: z.string().min(1, "Required"),
  desc_en: z.string().min(1, "Required"),
});

interface CarGalleryFormProps {
  initialData?: any;
  isEditMode?: boolean;
}

export default function CarGalleryForm({ initialData, isEditMode }: CarGalleryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialData?.car_image || null);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", desc: "", title_en: "", desc_en: "" }
  });

  const { register, handleSubmit, formState: { errors }, reset, getValues, setValue } = form;

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.carGalleryId?.title, desc: initialData.carGalleryId?.desc,
        title_en: initialData.carGalleryEn?.title, desc_en: initialData.carGalleryEn?.desc,
      });
    }
  }, [initialData, reset]);

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
    } catch(e) { toast.error("Crop failed"); }
  };

  const handleAutoTranslate = async () => {
    setIsTranslating(true);
    const fields = [{ src: "title", dest: "title_en" }, { src: "desc", dest: "desc_en" }];
    const texts = fields.map(f => getValues(f.src as any) || "");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/translate`, {
        method: "POST", headers: { "Content-Type": "application/json", },
        credentials: "include",
        body: JSON.stringify({ texts, target_lang: "en" })
      });
      const json = await res.json();
      const results = json.data.translated_text || json.data;
      fields.forEach((f, i) => { if(results[i]) setValue(f.dest as any, results[i]); });
      toast.success("Translated!");
    } catch(e) { toast.error("Translation failed"); }
    finally { setIsTranslating(false); }
  };

  const onSubmit = async (data: any) => {
    if (!isEditMode && !file) return toast.error("Image is required");
    setIsLoading(true);

    const formData = new FormData();
    if (file) formData.append("car_image", file);
    Object.entries(data).forEach(([k, v]: any) => formData.append(k, v));

    const url = isEditMode 
      ? `${process.env.NEXT_PUBLIC_API_URL}/car-gallery/${initialData.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/car-gallery`;
    
    try {
      const res = await fetch(url, { method: isEditMode ? "PUT" : "POST", body: formData });
      if (!res.ok) throw new Error("Failed");
      toast.success(isEditMode ? "Car saved!" : "Car added!");
      router.push("/admin/car-gallery");
    } catch(e) { toast.error("Error saving car"); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold">{isEditMode ? "Edit Car" : "Add New Car"}</h1>
         <Button variant="secondary" onClick={handleAutoTranslate} disabled={isTranslating} className="text-purple-700 bg-purple-50 border-purple-200">
            {isTranslating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />} Translate
         </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
            <CardHeader><CardTitle>Car Image (1:1)</CardTitle></CardHeader>
            <CardContent>
                <div className="max-w-xs">
                    <ImageUploadField label="Photo (Square)" preview={preview} onFileSelect={initiateCrop} isNew={!!file} aspectClass="aspect-square"/>
                </div>
            </CardContent>
        </Card>

        <Tabs defaultValue="id" className="w-full">
            <TabsList className="w-full justify-start bg-slate-100 p-1 rounded-lg mb-4">
                <TabsTrigger value="id" className="flex-1">🇮🇩 Indonesia</TabsTrigger>
                <TabsTrigger value="en" className="flex-1">🇺🇸 English</TabsTrigger>
            </TabsList>
            <TabsContent value="id" className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-sm">Content (ID)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormInput label="Car Name" register={register("title")} error={errors.title} />
                        <FormInput label="Description" textarea register={register("desc")} error={errors.desc} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="en" className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-sm">Content (EN)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormInput label="Car Name" register={register("title_en")} error={errors.title_en} />
                        <FormInput label="Description" textarea register={register("desc_en")} error={errors.desc_en} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6">
            <Button type="submit" size="lg" disabled={isLoading} className="min-w-[150px]">
                {isLoading ? <Loader2 className="animate-spin"/> : isEditMode ? "Save Changes" : "Add Car"}
            </Button>
        </div>
      </form>

      <CropImageDialog 
        isOpen={cropOpen} onClose={setCropOpen} onSave={handleSaveCrop}
        imageSrc={cropSrc} crop={crop} setCrop={setCrop} zoom={zoom} setZoom={setZoom}
        aspect={1} setCroppedAreaPixels={setCroppedArea}
      />
    </div>
  );
}