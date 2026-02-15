import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";

export function CropImageDialog({
	isOpen,
	onClose,
	onSave,
	imageSrc,
	crop,
	setCrop,
	zoom,
	setZoom,
	aspect,
	setCroppedAreaPixels,
}: any) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
				<DialogHeader className="p-4 border-b bg-white">
					<DialogTitle>Crop Image</DialogTitle>
				</DialogHeader>
				<div className="h-[400px] w-full relative bg-slate-950">
					{imageSrc && (
						<Cropper
							image={imageSrc}
							crop={crop}
							zoom={zoom}
							aspect={aspect}
							onCropChange={setCrop}
							onZoomChange={setZoom}
							onCropComplete={(_, area) => setCroppedAreaPixels(area)}
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
					<Button variant="ghost" onClick={() => onClose(false)}>
						Cancel
					</Button>
					<Button onClick={onSave}>Apply Crop</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
