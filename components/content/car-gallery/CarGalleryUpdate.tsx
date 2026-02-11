"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CarGalleryForm from "./CarGalleryForm";

const UpdateCarGallery = ({ id }: { id: string }) => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Fetch data detail by ID
		fetch(`${process.env.NEXT_PUBLIC_API_URL}/car-gallery/${id}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		})
			.then((res) => res.json())
			.then((json) => {
				if (json.status == "failed") {
					toast.error(json.message || "Failed to load car gallery data");
				} else {
					setData(json.data || json);
					toast.success("Car gallery data loaded successfully");
				}
			})
			.catch((err) => console.error(err))
			.finally(() => setLoading(false));
	}, [id]);

	if (loading)
		return (
			<div className="flex h-96 items-center justify-center">
				<Loader2 className="animate-spin" />
			</div>
		);
	return (
		<div>{data && <CarGalleryForm isEditMode={true} initialData={data} />}</div>
	);
};

export default UpdateCarGallery;
