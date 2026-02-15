"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/forms/FormComponents";

// --- SCHEMA ---
const formSchema = z.object({
  category: z.string().min(1, "Category is required"),
  value: z.string().min(1, "Value is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface SharesFormProps {
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

export default function SharesForm({
  initialData,
  isEditMode,
}: SharesFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      category: "",
      value: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue, // Kita butuh setValue untuk update state manual
  } = form;

  // --- HELPER FORMAT RUPIAH ---
  const formatCurrency = (value: string | number) => {
    if (!value) return "";
    // Pastikan input berupa string dan hanya ambil angkanya
    const numberString = value.toString().replace(/[^0-9]/g, "");
    
    // Format dengan pemisah ribuan (titik)
    const formatted = numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Kembalikan dengan prefix Rp
    return formatted ? `Rp ${formatted}` : "";
  };

  // --- PREFILL DATA ---
  useEffect(() => {
    if (initialData) {
      reset({
        category: initialData.category || "",
        // Format value awal dari database (misal: 1000000) menjadi tampilan Rupiah
        value: initialData.value ? formatCurrency(initialData.value) : "",
      });
    }
  }, [initialData, reset]);

  // --- HANDLER SAAT KETIK ---
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Format input user saat mengetik
    const formattedValue = formatCurrency(rawValue);
    // Set value ke react-hook-form dengan format tampilan
    setValue("value", formattedValue, { shouldValidate: true });
  };

  // --- SUBMIT ---
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    // BERSIHKAN FORMAT: Ambil hanya angkanya sebelum dikirim ke backend
    // Contoh: "Rp 1.000.000" -> "1000000"
    const cleanValue = data.value.replace(/[^0-9]/g, "");

    // Buat payload baru dengan value yang sudah bersih
    const payload = {
        ...data,
        value: cleanValue
    };

    const url =
      isEditMode
        ? `${process.env.NEXT_PUBLIC_API_URL}/shares/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/shares`;

    const method = isEditMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Kirim payload yang sudah bersih
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(isEditMode ? "Shares updated!" : "Shares added!");
      setTimeout(() => {
        router.push("/admin/content/shares");
      }, 500);
    } catch {
      toast.error("Error saving shares");
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
          {isEditMode ? "Edit Shares" : "Add New Shares"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        const msg = getErrorMessage(errors);
        if (msg) {
          toast.error(msg);
        } else {
          toast.error("Please check the form for errors");
        }
      })} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Shares Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormInput
              label="Category (e.g. Free Float Shares or Closely Held Shares)"
              register={register("category")}
              error={errors.category}
              placeholder="Category name..."
            />
            
            {/* INPUT VALUE DENGAN HANDLING KHUSUS */}
            <FormInput
              label="Value (e.g. Rp 1.445.000.000)"
              // Kita override onChange dalam objek register
              register={{
                ...register("value"),
                onChange: handleValueChange,
              }}
              error={errors.value}
              placeholder="Rp 0"
            />
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
            {isEditMode ? "Save Changes" : "Add Shares"}
          </Button>
        </div>
      </form>
    </div>
  );
}