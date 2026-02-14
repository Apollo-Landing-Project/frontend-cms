"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import SharesForm from "./SharesForm";

const UpdateShares = ({ id }: { id: string }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/shares/${id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.status == "failed") {
                    toast.error(json.message || "Failed to load shares data");
                } else {
                    setData(json.data || json);
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
        <div>{data && <SharesForm isEditMode={true} initialData={data} />}</div>
    );
};

export default UpdateShares;
