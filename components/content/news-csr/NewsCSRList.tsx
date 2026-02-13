"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
    Plus,
    Loader2,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    Heart,
    Images,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NewsCSRList() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/news-csr`,
                { credentials: "include" },
            );
            const json = await res.json();
            setItems(json.data || []);
        } catch {
            toast.error("Failed to load CSR news");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this CSR news permanently?")) return;

        const prevItems = [...items];
        setItems((prev) => prev.filter((item) => item.id !== id));

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/news-csr/${id}`,
                { method: "DELETE", credentials: "include" },
            );
            if (!res.ok) throw new Error();
            toast.success("CSR news deleted");
        } catch {
            setItems(prevItems);
            toast.error("Failed to delete");
        }
    };

    const handleTogglePublish = async (
        id: string,
        currentStatus: boolean,
    ) => {
        const prevItems = [...items];
        setItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, isPublished: !currentStatus }
                    : item,
            ),
        );

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/news-csr/${id}/publish`,
                { method: "PATCH", credentials: "include" },
            );
            if (!res.ok) throw new Error();
            toast.success(
                currentStatus ? "CSR unpublished" : "CSR published",
            );
        } catch {
            setItems(prevItems);
            toast.error("Failed to toggle status");
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        CSR Activities
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage CSR news and activities.
                    </p>
                </div>
                <Link href="/admin/content/news/csr/create">
                    <Button className="gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">
                        <Plus size={18} /> Add CSR News
                    </Button>
                </Link>
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-72 bg-slate-100 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <Heart
                        size={48}
                        className="mx-auto text-slate-300 mb-4"
                    />
                    <p className="text-slate-500 mb-4">
                        No CSR activities found.
                    </p>
                    <Link href="/admin/content/news/csr/create">
                        <Button variant="outline">
                            Create First CSR News
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => {
                        const firstImage =
                            item.newsCSRImage?.[0]?.image;
                        return (
                            <div
                                key={item.id}
                                className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-slate-300"
                            >
                                {/* IMAGE */}
                                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                    {firstImage ? (
                                        <Image
                                            src={firstImage}
                                            alt={
                                                item.newsCSRId?.title ||
                                                "CSR"
                                            }
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Heart
                                                size={32}
                                                className="text-slate-300"
                                            />
                                        </div>
                                    )}

                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <Badge
                                            className={
                                                item.isPublished
                                                    ? "bg-emerald-500/90 text-white backdrop-blur-sm"
                                                    : "bg-slate-500/90 text-white backdrop-blur-sm"
                                            }
                                        >
                                            {item.isPublished
                                                ? "Published"
                                                : "Draft"}
                                        </Badge>
                                        {item.newsCSRImage?.length >
                                            0 && (
                                                <Badge className="bg-white/80 text-slate-700 backdrop-blur-sm">
                                                    <Images
                                                        size={12}
                                                        className="mr-1"
                                                    />
                                                    {
                                                        item.newsCSRImage
                                                            .length
                                                    }
                                                </Badge>
                                            )}
                                    </div>
                                </div>

                                {/* CONTENT */}
                                <div className="p-4 space-y-3">
                                    <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm leading-snug">
                                        {item.newsCSRId?.title ||
                                            "Untitled"}
                                    </h3>

                                    {item.author && (
                                        <div className="flex items-center gap-2">
                                            {item.author_image ? (
                                                <Image
                                                    src={
                                                        item.author_image
                                                    }
                                                    alt={item.author}
                                                    width={20}
                                                    height={20}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-slate-200" />
                                            )}
                                            <span className="text-xs text-slate-500">
                                                {item.author}
                                            </span>
                                        </div>
                                    )}

                                    <p className="text-[11px] text-slate-400">
                                        {new Date(
                                            item.publishedAt,
                                        ).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>

                                    {/* ACTIONS */}
                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleTogglePublish(
                                                    item.id,
                                                    item.isPublished,
                                                )
                                            }
                                            className="flex-1 h-8 text-xs"
                                        >
                                            {item.isPublished ? (
                                                <>
                                                    <EyeOff
                                                        size={14}
                                                        className="mr-1"
                                                    />{" "}
                                                    Unpublish
                                                </>
                                            ) : (
                                                <>
                                                    <Eye
                                                        size={14}
                                                        className="mr-1"
                                                    />{" "}
                                                    Publish
                                                </>
                                            )}
                                        </Button>
                                        <Link
                                            href={`/admin/content/news/csr/update/${item.id}`}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs"
                                            >
                                                <Pencil size={14} />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() =>
                                                handleDelete(item.id)
                                            }
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
