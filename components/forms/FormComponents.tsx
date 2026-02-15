import React from "react";
import Image from "next/image";
import { UploadCloud, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ImageUploadFieldProps {
	label: string;
	preview: string | null;
	onFileSelect: (file: File) => void;
	isNew?: boolean;
	aspectClass?: string;
	note?: string;
    disabled?: boolean;
}

export const ImageUploadField = ({
	label,
	preview,
	onFileSelect,
	isNew,
	aspectClass = "aspect-video",
	note,
    disabled = false,
}: ImageUploadFieldProps) => {
	return (
		<div className={cn("space-y-2", disabled && "opacity-60 pointer-events-none")}>
			<div className="flex justify-between items-center">
				<Label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
					{label}
				</Label>
				{isNew && (
					<Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 h-5 border-blue-200">
						New
					</Badge>
				)}
			</div>

			<div
				className={cn(
					"relative bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 overflow-hidden group hover:border-blue-400 transition-all flex items-center justify-center",
					aspectClass,
				)}
			>
				{preview ?
					<>
						{/* Preview Image */}
						<Image
							src={preview}
							alt="Preview"
							fill
							className="object-cover"
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						/>

						{/* Hover Overlay */}
						<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
							<label
								className="cursor-pointer bg-white text-slate-900 p-2 rounded-full hover:bg-blue-50 shadow-lg transition-transform hover:scale-105 active:scale-95"
								title="Change Image"
							>
								<RefreshCw size={18} className="text-blue-600" />
								<input
									type="file"
									className="hidden"
									accept="image/*"
                                    disabled={disabled}
									onChange={(e) =>
										e.target.files?.[0] && onFileSelect(e.target.files[0])
									}
								/>
							</label>
						</div>
					</>
				:	/* Upload Placeholder */
					<label className="cursor-pointer flex flex-col items-center p-4 w-full h-full justify-center text-slate-400 hover:bg-slate-100/50 transition-colors">
						<UploadCloud className="h-8 w-8 mb-2 text-slate-300 group-hover:text-blue-400 transition-colors" />
						<span className="text-xs font-medium text-slate-500 group-hover:text-blue-600">
							Click to Upload
						</span>
						{note && (
							<span className="text-[10px] text-slate-400 mt-1">{note}</span>
						)}
						<input
							type="file"
							className="hidden"
							accept="image/*"
                            disabled={disabled}
							onChange={(e) =>
								e.target.files?.[0] && onFileSelect(e.target.files[0])
							}
						/>
					</label>
				}
			</div>
		</div>
	);
};

interface FormInputProps {
	id?: string;
	label: string;
	register: any;
	error?: any;
	textarea?: boolean;
	placeholder?: string;
	className?: string;
	type?: string;
}

export const FormInput = ({
	id,
	label,
	register,
	error,
	textarea,
	placeholder,
	className,
	type = "text",
}: FormInputProps) => {
	return (
		<div className={cn("space-y-1.5 w-full", className)}>
			<Label
				htmlFor={id || register.name}
				className="text-xs font-semibold text-slate-500 uppercase tracking-wide"
			>
				{label}
			</Label>

			{textarea ?
				<Textarea
					id={id || register.name}
					{...register}
					placeholder={placeholder}
					className={cn(
						"bg-slate-50 focus:bg-white resize-none min-h-25 transition-colors",
						error && "border-red-500 focus-visible:ring-red-500",
					)}
				/>
			:	<Input
					id={id || register.name}
					type={type}
					{...register}
					placeholder={placeholder}
					className={cn(
						"bg-slate-50 focus:bg-white h-9 transition-colors",
						error && "border-red-500 focus-visible:ring-red-500",
					)}
				/>
			}

			{error && (
				<p className="text-[10px] font-medium text-red-500 animate-in slide-in-from-left-1">
					{error.message}
				</p>
			)}
		</div>
	);
};
