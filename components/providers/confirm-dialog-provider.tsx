"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
	title?: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
};

type ConfirmDialogContextValue = (
	options: ConfirmOptions,
) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(
	null,
);

type DialogState = ConfirmOptions & {
	open: boolean;
};

const initialState: DialogState = {
	open: false,
	title: "Konfirmasi",
	description: "",
	confirmText: "Lanjutkan",
	cancelText: "Batal",
};

export function ConfirmDialogProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [dialog, setDialog] = useState<DialogState>(initialState);
	const resolverRef = useRef<((value: boolean) => void) | null>(null);

	const closeDialog = useCallback((value: boolean) => {
		resolverRef.current?.(value);
		resolverRef.current = null;
		setDialog((prev) => ({ ...prev, open: false }));
	}, []);

	const confirm = useCallback((options: ConfirmOptions) => {
		setDialog({
			open: true,
			title: options.title ?? initialState.title,
			description: options.description,
			confirmText: options.confirmText ?? initialState.confirmText,
			cancelText: options.cancelText ?? initialState.cancelText,
		});

		return new Promise<boolean>((resolve) => {
			resolverRef.current = resolve;
		});
	}, []);

	const value = useMemo(() => confirm, [confirm]);

	return (
		<ConfirmDialogContext.Provider value={value}>
			{children}
			<AlertDialog
				open={dialog.open}
				onOpenChange={(open) => {
					if (!open) {
						closeDialog(false);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{dialog.title}</AlertDialogTitle>
						<AlertDialogDescription>
							{dialog.description}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => closeDialog(false)}>
							{dialog.cancelText}
						</AlertDialogCancel>
						<AlertDialogAction onClick={() => closeDialog(true)}>
							{dialog.confirmText}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</ConfirmDialogContext.Provider>
	);
}

export function useConfirmDialog() {
	const context = useContext(ConfirmDialogContext);

	if (!context) {
		throw new Error(
			"useConfirmDialog must be used within ConfirmDialogProvider",
		);
	}

	return context;
}
