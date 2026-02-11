import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, GripVertical, MapPin, Globe, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ServiceItemProps {
	item: any;
	onDelete: (id: string) => void;
	onToggle: (id: string, current: boolean) => void;
}

export function SortableServiceItem({
	item,
	onDelete,
	onToggle,
}: ServiceItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 50 : "auto",
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div ref={setNodeRef} style={style} className="relative group h-full">
			<Card
				className={cn(
					"overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col",
					!item.isActive && "opacity-75 bg-slate-50 grayscale-[0.5]",
				)}
			>
				{/* HEADER IMAGE */}
				<div className="relative h-40 bg-slate-100 border-b border-slate-100">
					{item.bg_image ?
						<Image
							src={item.bg_image}
							alt={item.serviceId?.title || "Service"}
							fill
							className="object-cover"
						/>
					:	<div className="flex items-center justify-center h-full text-slate-300 bg-slate-100">
							No Image
						</div>
					}

					{/* Drag Handle */}
					<div
						{...attributes}
						{...listeners}
						className="absolute top-2 left-2 z-20 p-1.5 bg-white/90 backdrop-blur rounded-md cursor-grab active:cursor-grabbing shadow-sm hover:bg-white text-slate-500 hover:text-slate-800"
					>
						<GripVertical size={16} />
					</div>

					{/* Status Badge */}
					<div className="absolute top-2 right-2 z-20">
						{item.isActive ?
							<Badge className="bg-green-500/90 hover:bg-green-600 backdrop-blur">
								Active
							</Badge>
						:	<Badge variant="secondary" className="bg-slate-200/90">
								Inactive
							</Badge>
						}
					</div>
				</div>

				{/* CONTENT */}
				<div className="p-4 flex-1 flex flex-col gap-3">
					<div>
						<h3 className="font-bold text-slate-900 line-clamp-1 text-base">
							{item.serviceId?.title || "(No Title)"}
						</h3>
						<p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
							{item.serviceId?.desc || "No description."}
						</p>
					</div>

					{/* Meta Info */}
					<div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-medium mt-auto">
						<span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
							<MapPin size={10} /> {item.serviceId?.location}
						</span>
						<span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
							<Globe size={10} /> ID/EN
						</span>
						{item.serviceId?.contact?.length > 0 && (
							<span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
								<Phone size={10} /> {item.serviceId.contact.length} Contact
							</span>
						)}
					</div>
				</div>

				{/* FOOTER ACTIONS */}
				<div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
					{/* Toggle Switch */}
					<div className="flex items-center gap-2">
						<Switch
							checked={item.isActive}
							onCheckedChange={() => onToggle(item.id, item.isActive)}
							className="scale-75 origin-left"
						/>
						<span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
							{item.isActive ? "On" : "Off"}
						</span>
					</div>

					<div className="flex gap-1">
						<Link href={`/admin/content/services-items/update/${item.id}`}>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
							>
								<Edit size={14} />
							</Button>
						</Link>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
							onClick={() => onDelete(item.id)}
						>
							<Trash2 size={14} />
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}
