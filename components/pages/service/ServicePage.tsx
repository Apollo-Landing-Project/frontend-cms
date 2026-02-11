"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, ImageIcon, Globe, Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Interface sesuai response backend
interface ServicePageData {
	id: string;
	isActive: boolean;
	hero_bg: string | null;
	servicePageId?: {
		hero_title: string;
		hero_desc: string;
	};
	// Optional: Jika backend mengirim count relation
	_count?: {
		servicesId?: number;
		servicesEn?: number;
	};
}

export default function ServicePageList() {
	const [data, setData] = useState<ServicePageData[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	// --- FETCH DATA ---
	const fetchData = async () => {
		setLoading(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/page/service`,
				{
					credentials: "include",
				},
			);
			const json = await res.json();

			// Handle jika data array atau single object dibungkus array
			const resultData =
				Array.isArray(json.data) ? json.data : [json.data].filter(Boolean);
			setData(resultData);
		} catch {
			toast.error("Gagal mengambil data service page");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// --- TOGGLE ACTIVE ---
	const handleToggleActive = async (id: string, currentState: boolean) => {
		if (currentState) return; // Sudah aktif, tidak perlu aksi

		// Optimistic Update UI
		const previousData = [...data];
		setData((prev) =>
			prev.map((item) => ({
				...item,
				isActive: item.id === id,
			})),
		);

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/page/service/${id}/active`,
				{ method: "PATCH", credentials: "include" },
			);

			if (!res.ok) throw new Error();
			toast.success("Halaman berhasil diaktifkan!");
			fetchData(); // Refresh untuk memastikan konsistensi server
		} catch {
			setData(previousData); // Rollback jika gagal
			toast.error("Gagal mengubah status");
		}
	};

	// --- DELETE ---
	const handleDelete = async (id: string) => {
		if (
			!confirm(
				"Yakin ingin menghapus? Data dan Item Service terkait mungkin akan hilang.",
			)
		)
			return;

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/page/service/${id}`,
				{ method: "DELETE", credentials: "include" },
			);

			if (!res.ok) throw new Error();

			toast.success("Halaman berhasil dihapus");
			fetchData();
		} catch {
			toast.error("Gagal menghapus halaman");
		}
	};

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-20">
			{/* HEADER */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">
						Service Pages
					</h1>
					<p className="text-slate-500 mt-1">
						Kelola versi halaman Layanan (Hero, Gallery Title).
					</p>
				</div>
				<Link href="/admin/pages/service/create">
					<Button className="gap-2 shadow-lg shadow-blue-500/20">
						<Plus size={18} /> Create New Version
					</Button>
				</Link>
			</div>

			{/* CONTENT GRID */}
			{loading ?
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-[350px] bg-slate-100 rounded-xl animate-pulse"
						/>
					))}
				</div>
			: data.length === 0 ?
				<div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
					<div className="bg-white p-4 rounded-full shadow-sm mb-4">
						<Briefcase className="h-8 w-8 text-slate-400" />
					</div>
					<h3 className="text-lg font-semibold text-slate-900">
						Belum ada Halaman Service
					</h3>
					<p className="text-slate-500 mb-6 max-w-sm">
						Buat halaman pertama untuk menampilkan layanan perusahaan.
					</p>
					<Link href="/admin/pages/service/create">
						<Button variant="outline">Buat Sekarang</Button>
					</Link>
				</div>
			:	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{data.map((item) => (
						<Card
							key={item.id}
							className={cn(
								"overflow-hidden group hover:shadow-xl transition-all duration-300 border-slate-200 flex flex-col",
								item.isActive ?
									"ring-2 ring-blue-500/20 border-blue-500/50"
								:	"",
							)}
						>
							{/* IMAGE PREVIEW */}
							<div className="relative aspect-video bg-slate-100 overflow-hidden border-b">
								{item.hero_bg ?
									<Image
										src={item.hero_bg}
										alt="Hero Preview"
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-500"
									/>
								:	<div className="flex items-center justify-center h-full text-slate-400 bg-slate-200">
										<ImageIcon size={32} />
									</div>
								}

								{/* Active Badge */}
								<div className="absolute top-3 right-3">
									{item.isActive ?
										<Badge className="bg-green-500 hover:bg-green-600 shadow-sm gap-1 pl-1 pr-2">
											<span className="w-2 h-2 rounded-full bg-white animate-pulse" />{" "}
											Active
										</Badge>
									:	<Badge
											variant="secondary"
											className="bg-white/90 backdrop-blur text-slate-600 shadow-sm"
										>
											Draft
										</Badge>
									}
								</div>
							</div>

							{/* CARD CONTENT */}
							<CardContent className="p-5 flex-1">
								<div className="space-y-4">
									<div>
										<h3
											className="font-bold text-lg text-slate-900 line-clamp-1"
											title={item.servicePageId?.hero_title}
										>
											{item.servicePageId?.hero_title || "(No Title ID)"}
										</h3>
										<p className="text-sm text-slate-500 line-clamp-2 mt-1 min-h-[40px]">
											{item.servicePageId?.hero_desc ||
												"No description provided."}
										</p>
									</div>

									{/* Info Meta */}
									<div className="flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
										<div
											className="flex items-center gap-1"
											title="Multilingual Support"
										>
											<Globe size={12} /> ID & EN
										</div>
									</div>
								</div>
							</CardContent>

							{/* FOOTER ACTIONS */}
							<CardFooter className="p-4 bg-slate-50/50 border-t flex justify-between items-center">
								{/* Toggle Active Switch */}
								<div className="flex items-center gap-2">
									<Switch
										checked={item.isActive}
										onCheckedChange={() =>
											handleToggleActive(item.id, item.isActive)
										}
										disabled={item.isActive}
										id={`active-${item.id}`}
									/>
									<label
										htmlFor={`active-${item.id}`}
										className={cn(
											"text-xs font-medium cursor-pointer select-none",
											item.isActive ? "text-green-600" : "text-slate-500",
										)}
									>
										{item.isActive ? "Published" : "Activate"}
									</label>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-1">
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
										onClick={() =>
											router.push(`/admin/pages/service/update/${item.id}`)
										}
										title="Edit Page"
									>
										<Edit size={16} />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
										onClick={() => handleDelete(item.id)}
										title="Delete Page"
									>
										<Trash2 size={16} />
									</Button>
								</div>
							</CardFooter>
						</Card>
					))}
				</div>
			}
		</div>
	);
}
