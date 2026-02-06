"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, ImageIcon, Globe } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function HomePageList() {
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	const fetchData = async () => {
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/page/home`, {
				credentials: "include",
			});
			const json = await res.json();
			if (res.ok) setData(json.data || json);
		} catch {
			toast.error("Gagal mengambil data");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleToggleActive = async (id: string, currentState: boolean) => {
		if (currentState) return; // Sudah aktif, tidak perlu action

		// Optimistic UI Update (Ubah UI dulu biar cepet)
		const oldData = [...data];
		setData((prev) =>
			prev.map((item) => ({
				...item,
				isActive: item.id === id, // Set true yg dipilih, false sisanya
			})),
		);

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/page/home/${id}/active`,
				{ method: "PATCH", credentials: "include" },
			);
			if (!res.ok) throw new Error();
			toast.success("Home Page diaktifkan!");
			fetchData(); // Refresh untuk memastikan sinkronisasi data
		} catch {
			setData(oldData); // Rollback jika gagal
			toast.error("Gagal mengubah status");
		}
	};

	const handleDelete = async (id: string) => {
		if (
			!confirm("Yakin ingin menghapus? Data dan gambar akan hilang permanen.")
		)
			return;
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/page/home/${id}`,
				{ method: "DELETE", credentials: "include" },
			);
			if (!res.ok) throw new Error();
			toast.success("Berhasil dihapus");
			fetchData();
		} catch {
			toast.error("Gagal menghapus");
		}
	};

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
			{/* HEADER */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">
						Home Pages
					</h1>
					<p className="text-slate-500 mt-1">
						Kelola versi tampilan halaman utama website Anda.
					</p>
				</div>
				<Link href="/admin/pages/home/create">
					<Button className="gap-2 shadow-lg shadow-blue-500/20">
						<Plus size={18} /> Create Version
					</Button>
				</Link>
			</div>

			{/* CONTENT GRID */}
			{loading ?
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-80 bg-slate-100 rounded-xl animate-pulse"
						/>
					))}
				</div>
			: data.length === 0 ?
				<div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
					<div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
						<ImageIcon className="h-8 w-8 text-slate-400" />
					</div>
					<h3 className="text-lg font-semibold text-slate-900">
						Belum ada Home Page
					</h3>
					<p className="text-slate-500 mb-6 max-w-sm mx-auto">
						Buat halaman home pertama Anda untuk mulai menampilkan konten kepada
						pengunjung.
					</p>
					<Link href="/admin/pages/home/create">
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
							{/* IMAGE PREVIEW SECTION */}
							<div className="relative aspect-video bg-slate-100 overflow-hidden border-b">
								{item.hero_bg?.[0] ?
									<Image
										src={item.hero_bg[0]}
										alt="Hero Preview"
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-500"
									/>
								:	<div className="flex items-center justify-center h-full text-slate-400">
										<ImageIcon size={32} />
									</div>
								}

								{/* Status Badge Overlay */}
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
											Draft / Inactive
										</Badge>
									}
								</div>
							</div>

							{/* CARD CONTENT */}
							<CardContent className="p-5 flex-1">
								<div className="space-y-3">
									<div>
										<h3 className="font-bold text-lg text-slate-900 line-clamp-1">
											{item.homePageId?.hero_title || "Untitled Page"}
										</h3>
										<p className="text-sm text-slate-500 line-clamp-2 mt-1">
											{item.homePageId?.hero_desc || "No description provided."}
										</p>
									</div>

									{/* Meta Info (Optional) */}
									<div className="flex items-center gap-3 text-xs text-slate-400 pt-2">
										<div className="flex items-center gap-1">
											<Globe size={12} /> ID & EN
										</div>
										{/* Jika ada created_at */}
										{/* <div className="flex items-center gap-1">
                        <Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString()}
                    </div> */}
									</div>
								</div>
							</CardContent>

							{/* ACTIONS FOOTER */}
							<CardFooter className="p-4 bg-slate-50/50 border-t flex justify-between items-center">
								<div className="flex items-center gap-2">
									<Switch
										checked={item.isActive}
										onCheckedChange={() =>
											handleToggleActive(item.id, item.isActive)
										}
										disabled={item.isActive} // Disable jika sudah aktif
										id={`active-${item.id}`}
									/>
									<label
										htmlFor={`active-${item.id}`}
										className={cn(
											"text-xs font-medium cursor-pointer",
											item.isActive ? "text-green-600" : "text-slate-500",
										)}
									>
										{item.isActive ? "Published" : "Activate"}
									</label>
								</div>

								<div className="flex gap-1">
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
										onClick={() =>
											router.push(`/admin/pages/home/update/${item.id}`)
										}
										title="Edit"
									>
										<Edit size={16} />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
										onClick={() => handleDelete(item.id)}
										title="Delete"
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
