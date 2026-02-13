"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, FileText, Download, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ReportList() {
    const [data, setData] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const router = useRouter();

    const fetchCategories = async () => {
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

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL}/report`;
            if (selectedCategory !== "all") {
                url += `?categoryId=${selectedCategory}`;
            }
            const res = await fetch(url, { credentials: "include" });
            const json = await res.json();
            if (res.ok) {
                setData(json.data || []);
            } else {
                toast.error("Failed to load reports");
            }
        } catch {
            toast.error("Error loading reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedCategory]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this report permanently?")) return;
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/report/${id}`,
                { method: "DELETE", credentials: "include" },
            );
            if (res.ok) {
                toast.success("Report deleted");
                fetchData();
            } else {
                toast.error("Failed to delete");
            }
        } catch {
            toast.error("Error deleting report");
        }
    };

    return (
        <div className="space-y-6">
            {/* FILTERS & ACTIONS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                    >
                        <SelectTrigger className="w-[200px] bg-white">
                            <SelectValue placeholder="Filter by Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Link href="/admin/content/report/create">
                    <Button className="gap-2">
                        <Plus size={16} /> Add Report
                    </Button>
                </Link>
            </div>

            {/* GRID LIST */}
            {loading ?
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-48 bg-slate-100 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
                : data.length === 0 ?
                    <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No reports found.</p>
                    </div>
                    : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.map((item) => (
                            <Card key={item.id} className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <Badge variant="outline" className="mb-2">
                                            {item.reportCategory?.name || "Uncategorized"}
                                        </Badge>
                                        {item.is_publish ?
                                            <Badge className="bg-green-500 hover:bg-green-600">
                                                Published
                                            </Badge>
                                            : <Badge variant="secondary">Draft</Badge>}
                                    </div>
                                    <CardTitle className="text-lg line-clamp-2" title={item.title_id}>
                                        {item.title_id || item.title_en || "Untitled Report"}
                                    </CardTitle>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <Calendar size={12} />
                                        {format(new Date(item.publish_at), "dd MMM yyyy")}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 pb-3">
                                    <p className="text-sm text-slate-600 line-clamp-3">
                                        {item.description_id || item.description_en || "No description."}
                                    </p>
                                    {item.file_url && (
                                        <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100 flex items-center gap-3">
                                            <FileText className="text-blue-500 h-8 w-8" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">
                                                    {item.file_url.split("/").pop()}
                                                </p>
                                                <a
                                                    href={item.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    <Download size={10} /> Download File
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-3 border-t bg-slate-50/50 flex justify-end gap-2">
                                    <Link href={`/admin/content/report/update/${item.id}`}>
                                        <Button variant="ghost" size="icon">
                                            <Edit size={16} className="text-slate-500" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        <Trash2 size={16} className="text-red-500" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
            }
        </div>
    );
}
