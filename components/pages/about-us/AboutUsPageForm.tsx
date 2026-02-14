"use client";

import React, { useState, useEffect } from "react";
import {
	useForm,
	useFieldArray,
	UseFormRegister,
	Control,
	Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Image from "next/image";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { getCroppedImg } from "@/utils/canvasUtils";

import {
	Loader2,
	UploadCloud,
	X,
	Sparkles,
	RefreshCw,
	Plus,
	Trash2,
	ImageIcon,
	LayoutTemplate,
	Target,
	History,
	Users,
	Building2,
	Crop as CropIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

const governanceItemSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Name required"),
	position: z.enum(["BOD", "BOC"]),
	position_desc: z.string().min(1, "Position desc required"),
	photo_image: z.string().optional().nullable(),

	photo_index: z.number().optional(),
});

const structureItemSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Name required"),
	icon_image: z.string().optional().nullable(),
	icon_index: z.number().optional(),
});

const stringListSchema = z.array(
	z.object({ text: z.string().min(1, "Point cannot be empty") }),
);

const formSchema = z.object({
	hero_title: z.string().min(1, "Required"),
	hero_desc: z.string().min(1, "Required"),
    hero_badge: z.string().min(1, "Required"),

	vision_title: z.string().min(1, "Required"),
	vision_desc: z.string().min(1, "Required"),
    vision_badge: z.string().min(1, "Required"),
	vision_quote: z.string().optional(),
	vision_list: stringListSchema,

	mission_title: z.string().min(1, "Required"),
	mission_desc: z.string().min(1, "Required"),
    mission_badge: z.string().min(1, "Required"),
	mission_quote: z.string().optional(),
	mission_list: stringListSchema,

	history_title: z.string().min(1, "Required"),
	history_desc: z.string().min(1, "Required"),
    history_badge: z.string().min(1, "Required"),

	company_structure_title: z.string().min(1, "Required"),
	company_structure_desc: z.string().min(1, "Required"),
    company_structure_badge: z.string().min(1, "Required"),
	boc_title: z.string().min(1, "Required"),
	boc_desc: z.string().min(1, "Required"),
    boc_badge: z.string().min(1, "Required"),
	bod_title: z.string().min(1, "Required"),
	bod_desc: z.string().min(1, "Required"),
    bod_badge: z.string().min(1, "Required"),

	hero_title_en: z.string().min(1, "Required"),
	hero_desc_en: z.string().min(1, "Required"),
    hero_badge_en: z.string().min(1, "Required"),

	vision_title_en: z.string().min(1, "Required"),
	vision_desc_en: z.string().min(1, "Required"),
    vision_badge_en: z.string().min(1, "Required"),
	vision_quote_en: z.string().optional(),
	vision_list_en: stringListSchema,

	mission_title_en: z.string().min(1, "Required"),
	mission_desc_en: z.string().min(1, "Required"),
    mission_badge_en: z.string().min(1, "Required"),
	mission_quote_en: z.string().optional(),
	mission_list_en: stringListSchema,

	history_title_en: z.string().min(1, "Required"),
	history_desc_en: z.string().min(1, "Required"),
    history_badge_en: z.string().min(1, "Required"),

	company_structure_title_en: z.string().min(1, "Required"),
	company_structure_desc_en: z.string().min(1, "Required"),
    company_structure_badge_en: z.string().min(1, "Required"),
	boc_title_en: z.string().min(1, "Required"),
	boc_desc_en: z.string().min(1, "Required"),
    boc_badge_en: z.string().min(1, "Required"),
	bod_title_en: z.string().min(1, "Required"),
	bod_desc_en: z.string().min(1, "Required"),
    bod_badge_en: z.string().min(1, "Required"),

	governance_list: z.array(governanceItemSchema),
	company_structure_list: z.array(structureItemSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface ImageUploadFieldProps {
	label: string;
	preview: string | null;
	onFileSelect: (file: File) => void;
	isNew?: boolean;
	aspectClass?: string;
	note?: string;
}

const ImageUploadField = ({
	label,
	preview,
	onFileSelect,
	isNew,
	aspectClass = "aspect-video",
	note,
}: ImageUploadFieldProps) => {
	return (
		<div className="space-y-2">
			<div className="flex justify-between items-center">
				<Label className="text-xs font-semibold text-slate-500 uppercase">
					{label}
				</Label>
				{isNew && (
					<Badge className="bg-blue-100 text-blue-700 text-[10px] px-1 py-0 h-5">
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
						<Image src={preview} alt="Preview" fill className="object-cover" />
						<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
							<label
								className="cursor-pointer bg-white text-slate-900 p-2 rounded-full hover:bg-blue-50 shadow-lg"
								title="Change Image"
							>
								<RefreshCw size={18} className="text-blue-600" />
								<input
									type="file"
									className="hidden"
									accept="image/*"
									onChange={(e) =>
										e.target.files?.[0] && onFileSelect(e.target.files[0])
									}
								/>
							</label>
						</div>
					</>
				:	<label className="cursor-pointer flex flex-col items-center p-4 w-full h-full justify-center text-slate-400 hover:bg-slate-100/50">
						<UploadCloud className="h-8 w-8 mb-2" />
						<span className="text-xs font-medium text-slate-500 text-center">
							Upload {note}
						</span>
						<input
							type="file"
							className="hidden"
							accept="image/*"
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

const DynamicListField = ({
	control,
	name,
	label,
	error,
}: {
	control: any;
	name: string;
	label: string;
	error?: any;
}) => {
	const { fields, append, remove } = useFieldArray({ control, name });

	return (
		<div className="space-y-3">
			<div className="flex justify-between items-end">
				<Label className="text-xs font-semibold text-slate-500 uppercase">
					{label}
				</Label>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => append({ text: "" })}
					className="h-7 text-xs gap-1"
				>
					<Plus size={12} /> Add Point
				</Button>
			</div>
			<div className="space-y-2">
				{fields.map((field, index) => (
					<div key={field.id} className="flex gap-2">
						<div className="w-full">
							<Input
								{...control.register(`${name}.${index}.text`)}
								placeholder={`Point ${index + 1}`}
								className={cn(
									"bg-white h-9",
									error?.[index]?.text && "border-red-500",
								)}
							/>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-9 w-9 text-red-500 hover:bg-red-50 shrink-0"
							onClick={() => remove(index)}
						>
							<X size={16} />
						</Button>
					</div>
				))}
				{fields.length === 0 && (
					<p className="text-xs text-slate-400 italic">No points added.</p>
				)}
			</div>
		</div>
	);
};

const FormInput = ({
	id,
	label,
	register,
	error,
	textarea,
	placeholder,
	className,
}: any) => (
	<div className={cn("space-y-1.5 w-full", className)}>
		<Label
			htmlFor={id}
			className="text-xs font-semibold text-slate-500 uppercase tracking-wide"
		>
			{label}
		</Label>
		{textarea ?
			<Textarea
				id={id}
				{...register(id)}
				placeholder={placeholder}
				className={cn(
					"bg-slate-50 focus:bg-white resize-none min-h-[80px]",
					error && "border-red-500",
				)}
			/>
		:	<Input
				id={id}
				{...register(id)}
				placeholder={placeholder}
				className={cn(
					"bg-slate-50 focus:bg-white h-9",
					error && "border-red-500",
				)}
			/>
		}
		{error && (
			<p className="text-[10px] font-medium text-red-500">{error.message}</p>
		)}
	</div>
);

interface AboutUsFormProps {
	initialData?: any;
	isEditMode?: boolean;
}

export default function AboutUsForm({
	initialData,
	isEditMode,
}: AboutUsFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isTranslating, setIsTranslating] = useState(false);
	const router = useRouter();

	const [globalFiles, setGlobalFiles] = useState<{
		[key: string]: File | null;
	}>({});
	const [globalPreviews, setGlobalPreviews] = useState<{
		[key: string]: string | null;
	}>({});

	const [listFiles, setListFiles] = useState<{ [key: string]: File | null }>(
		{},
	);
	const [listPreviews, setListPreviews] = useState<{
		[key: string]: string | null;
	}>({});

	const [cropState, setCropState] = useState<{
		isOpen: boolean;
		imageSrc: string | null;
		targetKey: string;
		targetType: "global" | "list";
		aspectRatio: number;
	}>({
		isOpen: false,
		imageSrc: null,
		targetKey: "",
		targetType: "global",
		aspectRatio: 16 / 9,
	});
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			vision_list: [{ text: "" }],
			mission_list: [{ text: "" }],
			vision_list_en: [{ text: "" }],
			mission_list_en: [{ text: "" }],
			governance_list: [],
			company_structure_list: [],
		},
	});

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
		setValue,
		reset,
		getValues,
	} = form;

	const {
		fields: govFields,
		append: appendGov,
		remove: removeGov,
	} = useFieldArray({ control, name: "governance_list" });
	const {
		fields: structFields,
		append: appendStruct,
		remove: removeStruct,
	} = useFieldArray({ control, name: "company_structure_list" });

	useEffect(() => {
		if (initialData && isEditMode) {
			setGlobalPreviews({
				hero_bg: initialData.hero_bg,
				vision_image_parent: initialData.vision_image_parent,
				vision_image_child: initialData.vision_image_child,
				mission_image_parent: initialData.mission_image_parent,
				mission_image_child: initialData.mission_image_child,
				history_image_parent: initialData.history_image_parent,
				history_image_child: initialData.history_image_child,
			});

			const toObjArr = (arr?: string[]) =>
				arr?.map((s) => ({ text: s })) || [{ text: "" }];

			reset({
				hero_title: initialData.aboutUsPageId?.hero_title || "",
				hero_desc: initialData.aboutUsPageId?.hero_desc || "",
                hero_badge: initialData.aboutUsPageId?.hero_badge || "",
				vision_title: initialData.aboutUsPageId?.vision_title || "",
				vision_desc: initialData.aboutUsPageId?.vision_desc || "",
                vision_badge: initialData.aboutUsPageId?.vision_badge || "",
				vision_quote: initialData.aboutUsPageId?.vision_quote || "",
				vision_list: toObjArr(initialData.aboutUsPageId?.vision_list),

				mission_title: initialData.aboutUsPageId?.mission_title || "",
				mission_desc: initialData.aboutUsPageId?.mission_desc || "",
                mission_badge: initialData.aboutUsPageId?.mission_badge || "",
				mission_quote: initialData.aboutUsPageId?.mission_quote || "",
				mission_list: toObjArr(initialData.aboutUsPageId?.mission_list),

				history_title: initialData.aboutUsPageId?.history_title || "",
				history_desc: initialData.aboutUsPageId?.history_desc || "",
                history_badge: initialData.aboutUsPageId?.history_badge || "",
				company_structure_title:
					initialData.aboutUsPageId?.company_structure_title || "",
				company_structure_desc:
					initialData.aboutUsPageId?.company_structure_desc || "",
                company_structure_badge:
					initialData.aboutUsPageId?.company_structure_badge || "",
				boc_title: initialData.aboutUsPageId?.boc_title || "",
				boc_desc: initialData.aboutUsPageId?.boc_desc || "",
                boc_badge: initialData.aboutUsPageId?.boc_badge || "",
				bod_title: initialData.aboutUsPageId?.bod_title || "",
				bod_desc: initialData.aboutUsPageId?.bod_desc || "",
                bod_badge: initialData.aboutUsPageId?.bod_badge || "",

				hero_title_en: initialData.aboutUsPageEn?.hero_title || "",
				hero_desc_en: initialData.aboutUsPageEn?.hero_desc || "",
                hero_badge_en: initialData.aboutUsPageEn?.hero_badge || "",
				vision_title_en: initialData.aboutUsPageEn?.vision_title || "",
				vision_desc_en: initialData.aboutUsPageEn?.vision_desc || "",
                vision_badge_en: initialData.aboutUsPageEn?.vision_badge || "",
				vision_quote_en: initialData.aboutUsPageEn?.vision_quote || "",
				vision_list_en: toObjArr(initialData.aboutUsPageEn?.vision_list),

				mission_title_en: initialData.aboutUsPageEn?.mission_title || "",
				mission_desc_en: initialData.aboutUsPageEn?.mission_desc || "",
                mission_badge_en: initialData.aboutUsPageEn?.mission_badge || "",
				mission_quote_en: initialData.aboutUsPageEn?.mission_quote || "",
				mission_list_en: toObjArr(initialData.aboutUsPageEn?.mission_list),

				history_title_en: initialData.aboutUsPageEn?.history_title || "",
				history_desc_en: initialData.aboutUsPageEn?.history_desc || "",
                history_badge_en: initialData.aboutUsPageEn?.history_badge || "",
				company_structure_title_en:
					initialData.aboutUsPageEn?.company_structure_title || "",
				company_structure_desc_en:
					initialData.aboutUsPageEn?.company_structure_desc || "",
                company_structure_badge_en:
					initialData.aboutUsPageEn?.company_structure_badge || "",
				boc_title_en: initialData.aboutUsPageEn?.boc_title || "",
				boc_desc_en: initialData.aboutUsPageEn?.boc_desc || "",
                boc_badge_en: initialData.aboutUsPageEn?.boc_badge || "",
				bod_title_en: initialData.aboutUsPageEn?.bod_title || "",
				bod_desc_en: initialData.aboutUsPageEn?.bod_desc || "",
                bod_badge_en: initialData.aboutUsPageEn?.bod_badge || "",

				governance_list: initialData.governances || [],
				company_structure_list: initialData.companyStructures || [],
			});
		}
	}, [initialData, isEditMode, reset]);

	const initiateCrop = (
		file: File,
		key: string,
		type: "global" | "list",
		ratio: number,
	) => {
		setCropState({
			isOpen: true,
			imageSrc: URL.createObjectURL(file),
			targetKey: key,
			targetType: type,
			aspectRatio: ratio,
		});
		setZoom(1);
	};

	const handleSaveCrop = async () => {
		if (!cropState.imageSrc || !croppedAreaPixels) return;
		try {
			const croppedFile = await getCroppedImg(
				cropState.imageSrc,
				croppedAreaPixels,
			);
			if (croppedFile) {
				const previewUrl = URL.createObjectURL(croppedFile);

				if (cropState.targetType === "global") {
					setGlobalFiles((prev) => ({
						...prev,
						[cropState.targetKey]: croppedFile,
					}));
					setGlobalPreviews((prev) => ({
						...prev,
						[cropState.targetKey]: previewUrl,
					}));
				} else {
					setListFiles((prev) => ({
						...prev,
						[cropState.targetKey]: croppedFile,
					}));
					setListPreviews((prev) => ({
						...prev,
						[cropState.targetKey]: previewUrl,
					}));
				}

				setCropState((prev) => ({ ...prev, isOpen: false, imageSrc: null }));
				toast.success("Image cropped!");
			}
		} catch (e) {
			toast.error("Failed to crop image");
		}
	};

	const handleAutoTranslate = async (lang: string) => {
		setIsTranslating(true);
		let simpleFields;
		if (lang == "en") {
			simpleFields = [
				{ src: "hero_title", dest: "hero_title_en" },
				{ src: "hero_desc", dest: "hero_desc_en" },
                { src: "hero_badge", dest: "hero_badge_en" },
				{ src: "vision_title", dest: "vision_title_en" },
				{ src: "vision_desc", dest: "vision_desc_en" },
                { src: "vision_badge", dest: "vision_badge_en" },
				{ src: "vision_quote", dest: "vision_quote_en" },
				{ src: "mission_title", dest: "mission_title_en" },
				{ src: "mission_desc", dest: "mission_desc_en" },
                { src: "mission_badge", dest: "mission_badge_en" },
				{ src: "mission_quote", dest: "mission_quote_en" },
				{ src: "history_title", dest: "history_title_en" },
				{ src: "history_desc", dest: "history_desc_en" },
                { src: "history_badge", dest: "history_badge_en" },
				{ src: "company_structure_title", dest: "company_structure_title_en" },
				{ src: "company_structure_desc", dest: "company_structure_desc_en" },
                { src: "company_structure_badge", dest: "company_structure_badge_en" },
				{ src: "boc_title", dest: "boc_title_en" },
				{ src: "boc_desc", dest: "boc_desc_en" },
                { src: "boc_badge", dest: "boc_badge_en" },
				{ src: "bod_title", dest: "bod_title_en" },
				{ src: "bod_desc", dest: "bod_desc_en" },
                { src: "bod_badge", dest: "bod_badge_en" },
			];
		} else {
			simpleFields = [
				{ src: "hero_title_en", dest: "hero_title" },
				{ src: "hero_desc_en", dest: "hero_desc" },
                { src: "hero_badge_en", dest: "hero_badge" },
				{ src: "vision_title_en", dest: "vision_title" },
				{ src: "vision_desc_en", dest: "vision_desc" },
                { src: "vision_badge_en", dest: "vision_badge" },
				{ src: "vision_quote_en", dest: "vision_quote" },
				{ src: "mission_title_en", dest: "mission_title" },
				{ src: "mission_desc_en", dest: "mission_desc" },
                { src: "mission_badge_en", dest: "mission_badge" },
				{ src: "mission_quote_en", dest: "mission_quote" },
				{ src: "history_title_en", dest: "history_title" },
				{ src: "history_desc_en", dest: "history_desc" },
                { src: "history_badge_en", dest: "history_badge" },
				{ src: "company_structure_title_en", dest: "company_structure_title" },
				{ src: "company_structure_desc_en", dest: "company_structure_desc" },
                { src: "company_structure_badge_en", dest: "company_structure_badge" },
				{ src: "boc_title_en", dest: "boc_title" },
				{ src: "boc_desc_en", dest: "boc_desc" },
                { src: "boc_badge_en", dest: "boc_badge" },
				{ src: "bod_title_en", dest: "bod_title" },
				{ src: "bod_desc_en", dest: "bod_desc" },
                { src: "bod_badge_en", dest: "bod_badge" },
			];
		}

        // Validate source fields
        const sourceKeys = simpleFields.map((f) => f.src);
        const isValid = await form.trigger(sourceKeys as any);

        if (!isValid) {
            toast.error("Please fill in required fields first");
            setIsTranslating(false);
            return;
        }

		const getListText = (key: string) => {
			const arr = getValues(key as any);
			return Array.isArray(arr) ? arr.map((i: any) => i.text).join("\n") : "";
		};

		const texts = simpleFields.map((f) => getValues(f.src as any) || "");

		const visionListSrc = getListText("vision_list");
		const missionListSrc = getListText("mission_list");

		const allTexts = [...texts, visionListSrc, missionListSrc];

		try {
			const CHUNK_SIZE = 3;
			const totalChunks = Math.ceil(allTexts.length / CHUNK_SIZE);
			let results: string[] = [];

			for (let i = 0; i < totalChunks; i++) {
				const chunk = allTexts.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
				if (!chunk.length) continue;
				const res = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/translate`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ texts: chunk, target_lang: lang }),
					},
				);
				const json = await res.json();
				const batch =
					Array.isArray(json.data) ? json.data : json.data.translated_text;
				if (Array.isArray(batch)) results = [...results, ...batch];
			}

			simpleFields.forEach((field, i) => {
				if (results[i])
					setValue(field.dest as any, results[i], { shouldValidate: true });
			});

			const visionListRes = results[texts.length];
			if (visionListRes)
				setValue(
					"vision_list_en",
					visionListRes.split("\n").map((s) => ({ text: s.trim() })),
				);

			const missionListRes = results[texts.length + 1];
			if (missionListRes)
				setValue(
					"mission_list_en",
					missionListRes.split("\n").map((s) => ({ text: s.trim() })),
				);

			toast.success("Translation complete!");
		} catch {
			toast.error("Translation failed");
		} finally {
			setIsTranslating(false);
		}
	};

	const onSubmit = async (data: FormValues) => {
		setIsLoading(true);
		const formData = new FormData();

		Object.entries(data).forEach(([key, value]) => {
			if (!Array.isArray(value) && typeof value !== "object") {
				formData.append(key, String(value));
			}
		});

		const mapList = (arr: any[]) =>
			JSON.stringify(arr.map((i) => i.text).filter((t) => t));
		formData.append("vision_list", mapList(data.vision_list));
		formData.append("mission_list", mapList(data.mission_list));
		formData.append("vision_list_en", mapList(data.vision_list_en));
		formData.append("mission_list_en", mapList(data.mission_list_en));

		Object.entries(globalFiles).forEach(([key, file]) => {
			if (file) formData.append(key, file);
		});

		const governancePayload = data.governance_list.map((item, index) => {
			const fileKey = `governance_list-${index}`;
			const file = listFiles[fileKey];
			let photoIndex = undefined;

			if (file) {
				formData.append("governance_photos", file);
				photoIndex = formData.getAll("governance_photos").length - 1;
			}

			return { ...item, photo_index: photoIndex };
		});
		formData.append("governance_list", JSON.stringify(governancePayload));

		const structurePayload = data.company_structure_list.map((item, index) => {
			const fileKey = `company_structure_list-${index}`;
			const file = listFiles[fileKey];
			let iconIndex = undefined;

			if (file) {
				formData.append("company_structure_icons", file);
				iconIndex = formData.getAll("company_structure_icons").length - 1;
			}

			return { ...item, icon_index: iconIndex };
		});
		formData.append("company_structure_list", JSON.stringify(structurePayload));

		const url =
			isEditMode && initialData?.id ?
				`${process.env.NEXT_PUBLIC_API_URL}/page/about-us/${initialData.id}`
			:	`${process.env.NEXT_PUBLIC_API_URL}/page/about-us`;
		const method = isEditMode && initialData?.id ? "PUT" : "POST";

		try {
			const res = await fetch(url, {
				method,
				credentials: "include",
				body: formData,
			});
			const result = await res.json();
			if (!res.ok) {
				throw new Error(result.message);
			}
			toast.success("Saved successfully!");
			setTimeout(() => {
				router.push("/admin/pages/about-us");
			}, 500);
		} catch (e: any) {
			toast.error(e.message || "Failed to save");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-6xl mx-auto space-y-8 pb-20">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold tracking-tight text-slate-900">
					{isEditMode ? "Edit About Us Page" : "Setup About Us Page"}
				</h1>
				<div>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => handleAutoTranslate("id")}
						disabled={isTranslating}
						className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
					>
						{isTranslating ?
							<Loader2 className="animate-spin mr-2 h-4 w-4" />
						:	<Sparkles className="mr-2 h-4 w-4" />}
						Auto Translate (EN → ID)
					</Button>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => handleAutoTranslate("en")}
						disabled={isTranslating}
						className="text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
					>
						{isTranslating ?
							<Loader2 className="animate-spin mr-2 h-4 w-4" />
						:	<Sparkles className="mr-2 h-4 w-4" />}
						Auto Translate (ID → EN)
					</Button>
				</div>
			</div>

			<form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                toast.error("Please check the form for errors");
                console.error("Form Errors:", errors);
            })} className="space-y-8">
				{/* === GLOBAL IMAGES === */}
				<Card>
					<CardHeader className="bg-slate-50/50 border-b pb-4">
						<CardTitle className="flex gap-2 text-base">
							<ImageIcon className="w-5 h-5 text-blue-600" /> Global Images
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
							<div className="md:col-span-3">
								<ImageUploadField
									label="Hero Background (Landscape)"
									preview={globalPreviews.hero_bg || null}
									onFileSelect={(f) =>
										initiateCrop(f, "hero_bg", "global", 16 / 9)
									}
									isNew={!!globalFiles.hero_bg}
									aspectClass="aspect-video"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
							{/* Vision, Mission, History -> SQUARE (1:1) */}
							<ImageUploadField
								label="Vision Parent (1:1)"
								preview={globalPreviews.vision_image_parent || null}
								onFileSelect={(f) =>
									initiateCrop(f, "vision_image_parent", "global", 1)
								}
								isNew={!!globalFiles.vision_image_parent}
								aspectClass="aspect-square"
							/>
							<ImageUploadField
								label="Vision Child (1:1)"
								preview={globalPreviews.vision_image_child || null}
								onFileSelect={(f) =>
									initiateCrop(f, "vision_image_child", "global", 1)
								}
								isNew={!!globalFiles.vision_image_child}
								aspectClass="aspect-square"
							/>

							<ImageUploadField
								label="Mission Parent (1:1)"
								preview={globalPreviews.mission_image_parent || null}
								onFileSelect={(f) =>
									initiateCrop(f, "mission_image_parent", "global", 1)
								}
								isNew={!!globalFiles.mission_image_parent}
								aspectClass="aspect-square"
							/>
							<ImageUploadField
								label="Mission Child (1:1)"
								preview={globalPreviews.mission_image_child || null}
								onFileSelect={(f) =>
									initiateCrop(f, "mission_image_child", "global", 1)
								}
								isNew={!!globalFiles.mission_image_child}
								aspectClass="aspect-square"
							/>

							<ImageUploadField
								label="History Parent (1:1)"
								preview={globalPreviews.history_image_parent || null}
								onFileSelect={(f) =>
									initiateCrop(f, "history_image_parent", "global", 1)
								}
								isNew={!!globalFiles.history_image_parent}
								aspectClass="aspect-square"
							/>
							<ImageUploadField
								label="History Child (1:1)"
								preview={globalPreviews.history_image_child || null}
								onFileSelect={(f) =>
									initiateCrop(f, "history_image_child", "global", 1)
								}
								isNew={!!globalFiles.history_image_child}
								aspectClass="aspect-square"
							/>
						</div>
					</CardContent>
				</Card>

				{/* === TABS CONTENT (TEXT) === */}
				<Tabs defaultValue="id" className="w-full">
					<TabsList className="w-full justify-start bg-slate-100 p-1 mb-4 border border-slate-200 rounded-lg">
						<TabsTrigger
							value="id"
							className="flex-1 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
						>
							🇮🇩 Indonesia
						</TabsTrigger>
						<TabsTrigger
							value="en"
							className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
						>
							🇺🇸 English
						</TabsTrigger>
					</TabsList>

					{/* INDONESIA CONTENT */}
					<TabsContent value="id" className="space-y-6">
						<Card>
							<CardHeader className="bg-slate-50/50 border-b pb-4">
								<CardTitle className="text-sm">Hero Section (ID)</CardTitle>
							</CardHeader>
							<CardContent className="pt-6 space-y-4">
								<FormInput
									id="hero_title"
									label="Title"
									register={register}
									error={errors.hero_title}
								/>
								<FormInput
									id="hero_desc"
									label="Description"
									textarea
									register={register}
									error={errors.hero_desc}
								/>
                                <FormInput
									id="hero_badge"
									label="Badge"
									register={register}
									error={errors.hero_badge}
								/>
							</CardContent>
						</Card>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card>
								<CardHeader className="bg-slate-50/50 border-b pb-4">
									<CardTitle className="text-sm flex gap-2">
										<Target className="w-4 h-4" /> Vision (ID)
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-6 space-y-4">
									<FormInput
										id="vision_title"
										label="Title"
										register={register}
										error={errors.vision_title}
									/>
									<FormInput
										id="vision_desc"
										label="Description"
										textarea
										register={register}
										error={errors.vision_desc}
									/>
                                    <FormInput
										id="vision_badge"
										label="Badge"
										register={register}
										error={errors.vision_badge}
									/>
									<FormInput
										id="vision_quote"
										label="Quote (Optional)"
										textarea
										register={register}
										error={errors.vision_quote}
									/>

									<DynamicListField
										control={control}
										name="vision_list"
										label="Vision Points"
										error={errors.vision_list}
									/>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="bg-slate-50/50 border-b pb-4">
									<CardTitle className="text-sm flex gap-2">
										<Target className="w-4 h-4" /> Mission (ID)
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-6 space-y-4">
									<FormInput
										id="mission_title"
										label="Title"
										register={register}
										error={errors.mission_title}
									/>
									<FormInput
										id="mission_desc"
										label="Description"
										textarea
										register={register}
										error={errors.mission_desc}
									/>
                                    <FormInput
										id="mission_badge"
										label="Badge"
										register={register}
										error={errors.mission_badge}
									/>
									<FormInput
										id="mission_quote"
										label="Quote (Optional)"
										textarea
										register={register}
										error={errors.mission_quote}
									/>

									<DynamicListField
										control={control}
										name="mission_list"
										label="Mission Points"
										error={errors.mission_list}
									/>
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader className="bg-slate-50/50 border-b pb-4">
								<CardTitle className="text-sm flex gap-2">
									<History className="w-4 h-4" /> History & Titles (ID)
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
									<Badge variant="outline">History Section</Badge>
									<FormInput
										id="history_title"
										label="History Title"
										register={register}
										error={errors.history_title}
									/>
									<FormInput
										id="history_desc"
										label="History Description"
										textarea
										register={register}
										error={errors.history_desc}
									/>
                                    <FormInput
										id="history_badge"
										label="Badge"
										register={register}
										error={errors.history_badge}
									/>
								</div>
								<div className="space-y-4">
									<Badge variant="outline">Structure Section Titles</Badge>
									<FormInput
										id="company_structure_title"
										label="Structure Title"
										register={register}
										error={errors.company_structure_title}
									/>
									<FormInput
										id="company_structure_desc"
										label="Structure Desc"
										textarea
										register={register}
										error={errors.company_structure_desc}
									/>
                                    <FormInput
										id="company_structure_badge"
										label="Badge"
										register={register}
										error={errors.company_structure_badge}
									/>
								</div>
								<div className="space-y-4">
									<Badge variant="outline">BOC Section</Badge>
									<FormInput
										id="boc_title"
										label="BOC Title"
										register={register}
										error={errors.boc_title}
									/>
									<FormInput
										id="boc_desc"
										label="BOC Desc"
										textarea
										register={register}
										error={errors.boc_desc}
									/>
                                    <FormInput
										id="boc_badge"
										label="Badge"
										register={register}
										error={errors.boc_badge}
									/>
								</div>
								<div className="space-y-4">
									<Badge variant="outline">BOD Section</Badge>
									<FormInput
										id="bod_title"
										label="BOD Title"
										register={register}
										error={errors.bod_title}
									/>
									<FormInput
										id="bod_desc"
										label="BOD Desc"
										textarea
										register={register}
										error={errors.bod_desc}
									/>
                                    <FormInput
										id="bod_badge"
										label="Badge"
										register={register}
										error={errors.bod_badge}
									/>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* ENGLISH CONTENT */}
					<TabsContent value="en" className="space-y-6">
						<Card>
							<CardHeader className="bg-slate-50/50 border-b pb-4">
								<CardTitle className="text-sm">Hero Section (EN)</CardTitle>
							</CardHeader>
							<CardContent className="pt-6 space-y-4">
								<FormInput
									id="hero_title_en"
									label="Title (EN)"
									register={register}
									error={errors.hero_title_en}
								/>
								<FormInput
									id="hero_desc_en"
									label="Description (EN)"
									textarea
									register={register}
									error={errors.hero_desc_en}
								/>
                                <FormInput
									id="hero_badge_en"
									label="Badge (EN)"
									register={register}
									error={errors.hero_badge_en}
								/>
							</CardContent>
						</Card>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card>
								<CardHeader className="bg-slate-50/50 border-b pb-4">
									<CardTitle className="text-sm flex gap-2">
										<Target className="w-4 h-4" /> Vision (EN)
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-6 space-y-4">
									<FormInput
										id="vision_title_en"
										label="Title"
										register={register}
										error={errors.vision_title_en}
									/>
									<FormInput
										id="vision_desc_en"
										label="Description"
										textarea
										register={register}
										error={errors.vision_desc_en}
									/>
                                    <FormInput
										id="vision_badge_en"
										label="Badge (EN)"
										register={register}
										error={errors.vision_badge_en}
									/>
									<FormInput
										id="vision_quote_en"
										label="Quote"
										textarea
										register={register}
										error={errors.vision_quote_en}
									/>
									<DynamicListField
										control={control}
										name="vision_list_en"
										label="Vision Points (EN)"
										error={errors.vision_list_en}
									/>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="bg-slate-50/50 border-b pb-4">
									<CardTitle className="text-sm flex gap-2">
										<Target className="w-4 h-4" /> Mission (EN)
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-6 space-y-4">
									<FormInput
										id="mission_title_en"
										label="Title"
										register={register}
										error={errors.mission_title_en}
									/>
									<FormInput
										id="mission_desc_en"
										label="Description"
										textarea
										register={register}
										error={errors.mission_desc_en}
									/>
                                    <FormInput
										id="mission_badge_en"
										label="Badge (EN)"
										register={register}
										error={errors.mission_badge_en}
									/>
									<FormInput
										id="mission_quote_en"
										label="Quote"
										textarea
										register={register}
										error={errors.mission_quote_en}
									/>
									<DynamicListField
										control={control}
										name="mission_list_en"
										label="Mission Points (EN)"
										error={errors.mission_list_en}
									/>
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader className="bg-slate-50/50 border-b pb-4">
								<CardTitle className="text-sm flex gap-2">
									<History className="w-4 h-4" /> History & Titles (EN)
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
									<FormInput
										id="history_title_en"
										label="History Title"
										register={register}
										error={errors.history_title_en}
									/>
									<FormInput
										id="history_desc_en"
										label="History Desc"
										textarea
										register={register}
										error={errors.history_desc_en}
									/>
                                    <FormInput
										id="history_badge_en"
										label="Badge (EN)"
										register={register}
										error={errors.history_badge_en}
									/>
								</div>
								<div className="space-y-4">
									<FormInput
										id="company_structure_title_en"
										label="Structure Title"
										register={register}
										error={errors.company_structure_title_en}
									/>
									<FormInput
										id="company_structure_desc_en"
										label="Structure Desc"
										textarea
										register={register}
										error={errors.company_structure_desc_en}
									/>
                                    <FormInput
										id="company_structure_badge_en"
										label="Badge (EN)"
										register={register}
										error={errors.company_structure_badge_en}
									/>
								</div>
								<div className="space-y-4">
									<FormInput
										id="boc_title_en"
										label="BOC Title"
										register={register}
										error={errors.boc_title_en}
									/>
									<FormInput
										id="boc_desc_en"
										label="BOC Desc"
										textarea
										register={register}
										error={errors.boc_desc_en}
									/>
                                    <FormInput
										id="boc_badge_en"
										label="Badge (EN)"
										register={register}
										error={errors.boc_badge_en}
									/>
								</div>
								<div className="space-y-4">
									<FormInput
										id="bod_title_en"
										label="BOD Title"
										register={register}
										error={errors.bod_title_en}
									/>
									<FormInput
										id="bod_desc_en"
										label="BOD Desc"
										textarea
										register={register}
										error={errors.bod_desc_en}
									/>
                                    <FormInput
										id="bod_badge_en"
										label="Badge (EN)"
										register={register}
										error={errors.bod_badge_en}
									/>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* === GOVERNANCE LIST (REPEATER) === */}
				<Card className="border-l-4 border-l-orange-500">
					<CardHeader className="bg-orange-50/50 border-b pb-4 flex flex-row justify-between items-center">
						<div>
							<CardTitle className="flex items-center gap-2 text-base">
								<Users className="w-5 h-5 text-orange-600" /> Governance List
								(BOC & BOD)
							</CardTitle>
							<CardDescription>
								Manage Board of Commissioners and Directors.
							</CardDescription>
						</div>
						<Button
							type="button"
							size="sm"
							onClick={() =>
								appendGov({
									name: "",
									position: "BOD",
									position_desc: "",
									photo_image: "",
								})
							}
							className="gap-1 bg-orange-600 hover:bg-orange-700 text-white"
						>
							<Plus size={16} /> Add Person
						</Button>
					</CardHeader>
					<CardContent className="pt-6 space-y-6">
						{govFields.map((item, index) => {
							const previewKey = `governance_list-${index}`;
							const preview =
								listPreviews[previewKey] || item.photo_image || null;

							return (
								<div
									key={item.id}
									className="relative grid grid-cols-1 md:grid-cols-12 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200"
								>
									{/* Image Upload for Item - 4x6 RATIO (2:3) */}
									<div className="md:col-span-3">
										<ImageUploadField
											label="Photo (4x6)"
											preview={preview}
											onFileSelect={(f) =>
												initiateCrop(f, previewKey, "list", 2 / 3)
											}
											isNew={!!listFiles[previewKey]}
											aspectClass="aspect-[2/3]"
										/>
									</div>
									{/* Text Fields */}
									<div className="md:col-span-8 space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<FormInput
												id={`governance_list.${index}.name`}
												label="Full Name"
												register={register}
												error={errors.governance_list?.[index]?.name}
											/>
											<div className="space-y-1.5 w-full">
												<Label className="text-xs font-semibold text-slate-500 uppercase">
													Position Type
												</Label>
												<Controller
													control={control}
													name={`governance_list.${index}.position`}
													render={({ field }) => (
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
														>
															<SelectTrigger className="h-9 bg-white">
																<SelectValue placeholder="Select" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="BOC">
																	Board of Commissioners
																</SelectItem>
																<SelectItem value="BOD">
																	Board of Directors
																</SelectItem>
															</SelectContent>
														</Select>
													)}
												/>
											</div>
										</div>
										<FormInput
											id={`governance_list.${index}.position_desc`}
											label="Position Description (e.g. President Director)"
											register={register}
											error={errors.governance_list?.[index]?.position_desc}
										/>
									</div>
									<div className="md:col-span-1 flex justify-end md:justify-center pt-2">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="text-red-500 hover:bg-red-50"
											onClick={() => removeGov(index)}
										>
											<Trash2 size={18} />
										</Button>
									</div>
								</div>
							);
						})}
						{govFields.length === 0 && (
							<p className="text-center text-slate-400 italic py-4">
								No data added yet.
							</p>
						)}
					</CardContent>
				</Card>

				{/* === STRUCTURE LIST (REPEATER) === */}
				<Card className="border-l-4 border-l-blue-500">
					<CardHeader className="bg-blue-50/50 border-b pb-4 flex flex-row justify-between items-center">
						<div>
							<CardTitle className="flex items-center gap-2 text-base">
								<Building2 className="w-5 h-5 text-blue-600" /> Company
								Structure Cards
							</CardTitle>
							<CardDescription>
								Manage business units (Dealership, Auto Rental, etc).
							</CardDescription>
						</div>
						<Button
							type="button"
							size="sm"
							onClick={() => appendStruct({ name: "", icon_image: "" })}
							className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
						>
							<Plus size={16} /> Add Unit
						</Button>
					</CardHeader>
					<CardContent className="pt-6 space-y-6">
						{structFields.map((item, index) => {
							const previewKey = `company_structure_list-${index}`;
							const preview =
								listPreviews[previewKey] || item.icon_image || null;

							return (
								<div
									key={item.id}
									className="relative grid grid-cols-1 md:grid-cols-12 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200"
								>
									{/* Structure Icon - SQUARE (1:1) */}
									<div className="md:col-span-2">
										<ImageUploadField
											label="Icon (1:1)"
											preview={preview}
											onFileSelect={(f) =>
												initiateCrop(f, previewKey, "list", 1)
											}
											isNew={!!listFiles[previewKey]}
											aspectClass="aspect-square"
										/>
									</div>
									<div className="md:col-span-9 flex items-center">
										<FormInput
											id={`company_structure_list.${index}.name`}
											label="Unit Name"
											register={register}
											error={errors.company_structure_list?.[index]?.name}
											className="w-full"
										/>
									</div>
									<div className="md:col-span-1 flex justify-center items-center">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="text-red-500 hover:bg-red-50"
											onClick={() => removeStruct(index)}
										>
											<Trash2 size={18} />
										</Button>
									</div>
								</div>
							);
						})}
						{structFields.length === 0 && (
							<p className="text-center text-slate-400 italic py-4">
								No data added yet.
							</p>
						)}
					</CardContent>
				</Card>

				<div className="flex justify-end pt-6 border-t">
					<Button
						type="submit"
						size="lg"
						disabled={isLoading}
						className="min-w-[200px]"
					>
						{isLoading ?
							<Loader2 className="animate-spin mr-2" />
						:	null}
						Save Changes
					</Button>
				</div>
			</form>

			{/* --- CROPPER MODAL --- */}
			<Dialog
				open={cropState.isOpen}
				onOpenChange={(v) =>
					!v && setCropState((p) => ({ ...p, isOpen: false }))
				}
			>
				<DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
					<DialogHeader className="p-4 border-b bg-white">
						<DialogTitle>Crop Image</DialogTitle>
					</DialogHeader>
					<div className="h-[400px] relative bg-slate-950">
						{cropState.imageSrc && (
							<Cropper
								image={cropState.imageSrc}
								crop={crop}
								zoom={zoom}
								aspect={cropState.aspectRatio}
								onCropChange={setCrop}
								onCropComplete={(_, croppedAreaPixels) =>
									setCroppedAreaPixels(croppedAreaPixels)
								}
								onZoomChange={setZoom}
							/>
						)}
					</div>
					<div className="p-4 bg-slate-50 flex items-center gap-4">
						<Label>Zoom</Label>
						<Slider
							value={[zoom]}
							min={1}
							max={3}
							step={0.1}
							onValueChange={(val) => setZoom(val[0])}
							className="flex-1"
						/>
					</div>
					<DialogFooter className="p-4 bg-white border-t">
						<Button
							variant="ghost"
							onClick={() => setCropState((p) => ({ ...p, isOpen: false }))}
						>
							Cancel
						</Button>
						<Button onClick={handleSaveCrop}>Apply Crop</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
