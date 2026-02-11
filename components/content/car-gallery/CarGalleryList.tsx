"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, Plus, Car } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CarGalleryList() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	// --- FETCH DATA ---
	const fetchData = async () => {
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/car-gallery`,
				{
					credentials: "include",
				},
			);
			const json = await res.json();
			setItems(json.data || []);
		} catch {
			toast.error("Gagal mengambil data gallery");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// --- DELETE HANDLER ---
	const handleDelete = async (id: string) => {
		if (!confirm("Hapus mobil ini dari galeri?")) return;

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/car-gallery/${id}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!res.ok) throw new Error();

			toast.success("Mobil berhasil dihapus");
			setItems((prev) => prev.filter((item) => item.id !== id));
		} catch {
			toast.error("Gagal menghapus mobil");
		}
	};

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto pb-20 space-y-8">
			{/* HEADER */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">
						Car Gallery
					</h1>
					<p className="text-slate-500 mt-1 flex items-center gap-2">
						Kelola koleksi foto dan deskripsi mobil.
					</p>
				</div>
				<Link href="/admin/car-gallery/create">
					<Button className="gap-2 shadow-lg shadow-blue-500/20">
						<Plus size={18} /> Add New Car
					</Button>
				</Link>
			</div>

			{/* CONTENT GRID */}
			{loading ?
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="h-64 bg-slate-100 rounded-xl animate-pulse"
						/>
					))}
				</div>
			: items.length === 0 ?
				<div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
					<div className="bg-white p-4 rounded-full shadow-sm mb-4">
						<Car className="h-8 w-8 text-slate-400" />
					</div>
					<h3 className="text-lg font-semibold text-slate-900">
						Galeri Kosong
					</h3>
					<p className="text-slate-500 mb-6 max-w-sm">
						Belum ada mobil yang ditambahkan.
					</p>
					<Link href="/admin/car-gallery/create">
						<Button variant="outline">Tambah Mobil Pertama</Button>
					</Link>
				</div>
			:	<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{items.map((item) => (
						<Card
							key={item.id}
							className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200 flex flex-col"
						>
							{/* IMAGE (SQUARE) */}
							<div className="relative aspect-square bg-slate-100 overflow-hidden border-b">
								{item.car_image ?
									<Image
										src={item.car_image}
										alt={item.carGalleryId?.title || "Car"}
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-500"
									/>
								:	<div className="flex items-center justify-center h-full text-slate-400">
										<Car size={32} />
									</div>
								}

								{/* Language Badge */}
								<div className="absolute top-2 right-2">
									<Badge
										variant="secondary"
										className="bg-white/90 backdrop-blur text-xs"
									>
										ID & EN
									</Badge>
								</div>
							</div>

							{/* CONTENT */}
							<CardContent className="p-4 flex-1">
								<h3
									className="font-bold text-slate-900 line-clamp-1"
									title={item.carGalleryId?.title}
								>
									{item.carGalleryId?.title || "(No Title)"}
								</h3>
								<p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
									{item.carGalleryId?.desc || "No description."}
								</p>
							</CardContent>

							{/* ACTIONS */}
							<CardFooter className="p-3 bg-slate-50/50 border-t flex gap-2">
								<Link href={`/admin/car-gallery/${item.id}`} className="flex-1">
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
			}
		</div>
	);
}
