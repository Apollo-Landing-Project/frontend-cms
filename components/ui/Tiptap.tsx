"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import React, { useCallback, useRef } from "react";
import {
    Bold,
    Italic,
    Link as LinkIcon,
    Unlink,
    ImagePlus,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImage } from "@/utils/canvasUtils";

interface TiptapProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    enableImageUpload?: boolean;
    className?: string;
    disabled?: boolean;
}

export default function Tiptap({
    content,
    onChange,
    placeholder = "Write something...",
    enableImageUpload = false,
    className,
    disabled = false,
}: TiptapProps) {
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        immediatelyRender: false,
        editable: !disabled,
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-600 underline cursor-pointer",
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "rounded-lg max-w-full h-auto my-4",
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none",
                    disabled && "opacity-50 cursor-not-allowed"
                ),
            },
        },
    });

    // Update editable state if disabled/enabled changes dynamically
    React.useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [editor, disabled]);

    // Update editor content when content prop changes
    React.useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        if (url === null) return; // cancelled
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
    }, [editor]);

    const handleImageUpload = useCallback(async () => {
        fileInputRef.current?.click();
    }, []);

    const onFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file || !editor) return;

            setUploading(true);
            try {
                const compressed = await compressImage(file);
                const formData = new FormData();
                formData.append("content_image", compressed);

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/news-news/upload-content-image`,
                    {
                        method: "POST",
                        credentials: "include",
                        body: formData,
                    },
                );

                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "Upload failed");

                const imageUrl = json.data?.url;
                if (imageUrl) {
                    editor.chain().focus().setImage({ src: imageUrl }).run();
                }
            } catch (err: any) {
                console.error("Image upload failed:", err);
                alert("Failed to upload image: " + err.message);
            } finally {
                setUploading(false);
                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        },
        [editor],
    );

    if (!editor) return null;

    return (
        <div
            className={cn(
                "border rounded-lg overflow-hidden bg-white",
                className,
            )}
        >
            {/* TOOLBAR */}
            <div className="flex items-center gap-1 px-3 py-2 border-b bg-slate-50/80">
                <ToolbarButton
                    active={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold"
                >
                    <Bold size={16} />
                </ToolbarButton>

                <ToolbarButton
                    active={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic"
                >
                    <Italic size={16} />
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <ToolbarButton
                    active={editor.isActive("link")}
                    onClick={setLink}
                    title="Add Link"
                >
                    <LinkIcon size={16} />
                </ToolbarButton>

                {editor.isActive("link") && (
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().unsetLink().run()
                        }
                        title="Remove Link"
                    >
                        <Unlink size={16} />
                    </ToolbarButton>
                )}

                {enableImageUpload && (
                    <>
                        <div className="w-px h-5 bg-slate-200 mx-1" />
                        <ToolbarButton
                            onClick={handleImageUpload}
                            disabled={uploading}
                            title="Insert Image"
                        >
                            {uploading ?
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />
                                : <ImagePlus size={16} />}
                        </ToolbarButton>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onFileChange}
                        />
                    </>
                )}
            </div>

            {/* EDITOR */}
            <EditorContent editor={editor} />
        </div>
    );
}

// --- Toolbar Button Helper ---
function ToolbarButton({
    children,
    active,
    onClick,
    disabled,
    title,
}: {
    children: React.ReactNode;
    active?: boolean;
    onClick: () => void;
    disabled?: boolean;
    title?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "p-1.5 rounded-md transition-colors text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed",
                active && "bg-slate-200 text-slate-900 shadow-sm",
            )}
        >
            {children}
        </button>
    );
}
