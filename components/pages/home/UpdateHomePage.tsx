"use client";

import React, { useEffect, useState } from "react";

const UpdateHomePage = ({ id }: { id: string }) => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Fetch data detail by ID
		fetch(`${process.env.NEXT_PUBLIC_API_URL}/page/home/${id}`)
			.then((res) => res.json())
			.then((json) => setData(json.data || json))
			.catch((err) => console.error(err))
			.finally(() => setLoading(false));
	}, [id]);

	if (loading)
		return (
			<div className="flex h-96 items-center justify-center">
				<Loader2 className="animate-spin" />
			</div>
		);
	return <div>UpdateHomePage</div>;
};

export default UpdateHomePage;
