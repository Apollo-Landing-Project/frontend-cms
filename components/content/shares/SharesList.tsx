"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit, Trash2, Plus, PieChart } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function SharesList() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/shares`,
                { credentials: "include" },
            );
            const json = await res.json();
            setItems(json.data || []);
        } catch {
            toast.error("Gagal mengambil data shares");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus shares ini?")) return;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/shares/${id}`,
                { method: "DELETE", credentials: "include" },
            );
            if (!res.ok) throw new Error();
            toast.success("Shares berhasil dihapus");
            setItems((prev) => prev.filter((item) => item.id !== id));
        } catch {
            toast.error("Gagal menghapus shares");
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-20 space-y-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Shares (Saham)
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        Kelola data pemegang saham.
                    </p>
                </div>
                <Link href="/admin/content/shares/create">
                    <Button className="gap-2 shadow-lg shadow-blue-500/20">
                        <Plus size={18} /> Add New Shares
                    </Button>
                </Link>
            </div>

            {/* CONTENT GRID */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-32 bg-slate-100 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <PieChart className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                        Belum Ada Data Saham
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-sm">
                        Belum ada data saham yang ditambahkan.
                    </p>
                    <Link href="/admin/content/shares/create">
                        <Button variant="outline">Tambah Data Pertama</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <Card
                            key={item.id}
                            className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200 flex flex-col"
                        >
                            <CardContent className="p-6 flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    {item.category}
                                </h3>
                                <p className="text-2xl font-mono text-blue-600 font-semibold">
                                    {item.value}
                                </p>
                            </CardContent>

                            <CardFooter className="p-3 bg-slate-50/50 border-t flex gap-2">
                                <Link href={`/admin/content/shares/update/${item.id}`} className="flex-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs h-8 gap-1"
                                    >
                                        <Edit size={12} /> Edit
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
