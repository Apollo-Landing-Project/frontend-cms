"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	rectSortingStrategy,
} from "@dnd-kit/sortable";
import toast from "react-hot-toast";
import { Plus, Loader2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SortableServiceItem } from "./SortServiceItem";

export default function ServiceItemList() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [isSavingOrder, setIsSavingOrder] = useState(false);

	// Sensor untuk Drag & Drop (Mouse & Touch friendly)
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	// --- 1. FETCH DATA ---
	const fetchData = async () => {
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/service/items`,
				{
					credentials: "include",
				},
			);
			const json = await res.json();

			// Sorting manual berdasarkan order, just in case backend belum sort
			const sortedData = (json.data || []).sort(
				(a: any, b: any) => (a.order || 0) - (b.order || 0),
			);

			setItems(sortedData);
		} catch {
			toast.error("Gagal mengambil data services");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// --- 2. DELETE HANDLER ---
	const handleDelete = async (id: string) => {
		if (!confirm("Hapus layanan ini secara permanen?")) return;

		// Optimistic UI Update
		const prevItems = [...items];
		setItems((prev) => prev.filter((item) => item.id !== id));

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/service/items/${id}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);
			if (!res.ok) throw new Error();
			toast.success("Service deleted");
		} catch (e) {
			setItems(prevItems); // Rollback
			toast.error("Gagal menghapus");
		}
	};

	// --- 3. TOGGLE ACTIVE HANDLER ---
	const handleToggle = async (id: string, currentStatus: boolean) => {
		// Optimistic UI
		const prevItems = [...items];
		setItems((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, isActive: !currentStatus } : item,
			),
		);

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/service/items/${id}/toggle`,
				{
					method: "PATCH",
					credentials: "include",
				},
			);
			if (!res.ok) throw new Error();
			toast.success(
				currentStatus ? "Service Deactivated" : "Service Activated",
			);
		} catch (e) {
			setItems(prevItems); // Rollback
			toast.error("Gagal mengubah status");
		}
	};

	// --- 4. REORDER HANDLER (Drag End) ---
	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (active.id !== over?.id) {
			setIsSavingOrder(true);

			// Calculate new order logic
			const oldIndex = items.findIndex((i) => i.id === active.id);
			const newIndex = items.findIndex((i) => i.id === over?.id);

			const newOrderedItems = arrayMove(items, oldIndex, newIndex);
			setItems(newOrderedItems); // Visual Update First

			// Prepare Payload: [{id: "uuid", order: 1}, ...]
			const payload = newOrderedItems.map((item, index) => ({
				id: item.id,
				order: index + 1,
			}));

			try {
				await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/service/items/reorder`,
					{
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ items: payload }),
					},
				);
				// Silent success / small toast
			} catch (e) {
				toast.error("Gagal menyimpan urutan");
				fetchData(); // Revert to server state
			} finally {
				setIsSavingOrder(false);
			}
		}
	};

	return (
		<div className="p-6 md:p-10 max-w-7xl mx-auto pb-20">
			{/* HEADER */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 mb-8">
				<div>
					<div className="flex items-center gap-2 mb-1">
						{/* <Link href="/admin/pages/services">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 -ml-2 text-slate-400 hover:text-slate-900"
							>
								<ArrowLeft size={18} />
							</Button>
						</Link> */}
						<h1 className="text-3xl font-bold tracking-tight text-slate-900">
							Service Items
						</h1>
					</div>
					<p className="text-slate-500 flex items-center gap-2 text-sm">
						Manage list of services displayed on the page.
						<span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200 font-medium">
							Drag & Drop to reorder
						</span>
					</p>
				</div>

				<div className="flex items-center gap-3">
					{isSavingOrder && (
						<span className="text-xs text-slate-400 flex items-center gap-1 animate-pulse">
							<Loader2 size={12} className="animate-spin" /> Saving Order...
						</span>
					)}
					<Link href="/admin/content/services-items/create">
						<Button className="gap-2 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
							<Plus size={18} /> Add Service
						</Button>
					</Link>
				</div>
			</div>

			{/* LOADING STATE */}
			{loading ?
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="h-72 bg-slate-100 rounded-xl animate-pulse"
						/>
					))}
				</div>
			: items.length === 0 ?
				<div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
					<p className="text-slate-500 mb-4">No services found.</p>
					<Link href="/admin/content/services-items/create">
						<Button variant="outline">Create First Service</Button>
					</Link>
				</div>
			:	/* DRAG & DROP CONTEXT */
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={items.map((i) => i.id)}
						strategy={rectSortingStrategy}
					>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{items.map((item) => (
								<SortableServiceItem
									key={item.id}
									item={item}
									onDelete={handleDelete}
									onToggle={handleToggle}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			}
		</div>
	);
}
