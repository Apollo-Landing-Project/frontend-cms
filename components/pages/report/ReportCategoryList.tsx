"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Schema
const categorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function ReportCategoryList() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = form;

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/report-category`,
                {
                    credentials: "include",
                },
            );
            const json = await res.json();
            if (res.ok) {
                setData(json.data || json);
            } else {
                toast.error(json.message);
            }
        } catch {
            toast.error("Failed to fetch categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- HANDLERS ---
    const handleOpenCreate = () => {
        setIsEditMode(false);
        setCurrentId(null);
        reset({ name: "", description: "" });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (item: any) => {
        setIsEditMode(true);
        setCurrentId(item.id);
        setValue("name", item.name);
        setValue("description", item.description || "");
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? Related reports will be deleted.")) return;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/report-category/${id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                },
            );

            if (res.ok) {
                toast.success("Category deleted");
                fetchData();
            } else {
                toast.error("Failed to delete");
            }
        } catch {
            toast.error("Error deleting category");
        }
    };

    const onSubmit = async (values: CategoryFormValues) => {
        try {
            const url =
                isEditMode ?
                    `${process.env.NEXT_PUBLIC_API_URL}/report-category/${currentId}`
                    : `${process.env.NEXT_PUBLIC_API_URL}/report-category`;
            const method = isEditMode ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
                credentials: "include",
            });

            const json = await res.json();

            if (res.ok) {
                toast.success(
                    isEditMode ? "Category updated" : "Category created",
                );
                setIsDialogOpen(false);
                fetchData();
            } else {
                toast.error(json.message || "Failed to save category");
            }
        } catch {
            toast.error("Error saving category");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Report Categories</h2>
                <Button onClick={handleOpenCreate} className="gap-2">
                    <Plus size={16} /> Add Category
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Reports Count</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ?
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                </TableCell>
                            </TableRow>
                            : data.length === 0 ?
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center h-24 text-slate-500"
                                    >
                                        No categories found.
                                    </TableCell>
                                </TableRow>
                                : data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            {item.name}
                                        </TableCell>
                                        <TableCell>{item.description || "-"}</TableCell>
                                        <TableCell>
                                            {item._count?.reports || 0} Reports
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenEdit(item)}
                                                >
                                                    <Edit size={16} className="text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 size={16} className="text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                        }
                    </TableBody>
                </Table>
            </div>

            {/* DIALOG FORM */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? "Edit Category" : "Add Category"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Annual Report"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Description</Label>
                            <Textarea
                                id="desc"
                                placeholder="Optional description..."
                                {...register("description")}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
