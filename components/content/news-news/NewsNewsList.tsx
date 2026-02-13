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
    Newspaper,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NewsNewsList() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/news-news`,
                { credentials: "include" },
            );
            const json = await res.json();
            setItems(json.data || []);
        } catch {
            toast.error("Failed to load news");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this news permanently?")) return;

        const prevItems = [...items];
        setItems((prev) => prev.filter((item) => item.id !== id));

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/news-news/${id}`,
                { method: "DELETE", credentials: "include" },
            );
            if (!res.ok) throw new Error();
            toast.success("News deleted");
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
                `${process.env.NEXT_PUBLIC_API_URL}/news-news/${id}/publish`,
                { method: "PATCH", credentials: "include" },
            );
            if (!res.ok) throw new Error();
            toast.success(
                currentStatus ? "News unpublished" : "News published",
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
                        News Articles
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage news articles displayed on the website.
                    </p>
                </div>
                <Link href="/admin/content/news/create">
                    <Button className="gap-2 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
                        <Plus size={18} /> Add News
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
                    <Newspaper
                        size={48}
                        className="mx-auto text-slate-300 mb-4"
                    />
                    <p className="text-slate-500 mb-4">No news found.</p>
                    <Link href="/admin/content/news/create">
                        <Button variant="outline">Create First News</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-slate-300"
                        >
                            {/* IMAGE */}
                            <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                {item.image ? (
                                    <Image
                                        src={item.image}
                                        alt={
                                            item.newsNewsId?.title || "News"
                                        }
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Newspaper
                                            size={32}
                                            className="text-slate-300"
                                        />
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div className="absolute top-3 left-3">
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
                                </div>
                            </div>

                            {/* CONTENT */}
                            <div className="p-4 space-y-3">
                                <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm leading-snug">
                                    {item.newsNewsId?.title || "Untitled"}
                                </h3>

                                {item.author && (
                                    <div className="flex items-center gap-2">
                                        {item.author_image ? (
                                            <Image
                                                src={item.author_image}
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
                                        href={`/admin/content/news/update/${item.id}`}
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
                    ))}
                </div>
            )}
        </div>
    );
}
