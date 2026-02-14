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
    } = form;

    // PREFILL
    useEffect(() => {
        if (initialData) {
            reset({
                category: initialData.category || "",
                value: initialData.value || "",
            });
        }
    }, [initialData, reset]);

    // --- SUBMIT ---
    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);

        const url =
            isEditMode
                ? `${process.env.NEXT_PUBLIC_API_URL}/shares/${initialData.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/shares`;

        const method = isEditMode ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include"
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Shares Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormInput
                            label="Category (e.g. Public)"
                            register={register("category")}
                            error={errors.category}
                            placeholder="Category name..."
                        />
                        <FormInput
                            label="Value (e.g. 1445000000)"
                            register={register("value")}
                            error={errors.value}
                            placeholder="Share value..."
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
