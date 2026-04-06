import React, { useState } from "react";
import Cropper from "react-easy-crop";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Slider } from "./ui/slider";
import { RotateCcw } from "lucide-react";
import { getCroppedImage, compressImage } from "@/lib/imageUtils";

interface CropImageDialogProps {
  open: boolean;
  imageUrl: string;
  onCropComplete: (croppedImage: string) => void;
  onOpenChange: (open: boolean) => void;
  aspectRatio?: number;
}

export function CropImageDialog({
  open,
  imageUrl,
  onCropComplete,
  onOpenChange,
  aspectRatio = 1,
}: CropImageDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [processing, setProcessing] = useState(false);

  React.useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, [open, imageUrl]);

  const handleCropComplete = (_: unknown, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleResetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    try {
      // Crop the image
      const croppedImage = await getCroppedImage(
        imageUrl,
        croppedAreaPixels
      );

      // Compress the cropped image
      const compressedImage = await compressImage(croppedImage, 0.8, 500, 500);

      onCropComplete(compressedImage);
      onOpenChange(false);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crop and Adjust Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop Preview */}
          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ height: "400px" }}>
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={handleCropComplete}
              onZoomChange={setZoom}
              cropShape="round"
              showGrid={false}
            />
          </div>

          {/* Zoom Control */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Zoom</label>
            <Slider
              value={[zoom]}
              onValueChange={(value: number[]) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
            <div className="text-xs text-gray-500 text-center">{(zoom * 100).toFixed(0)}%</div>
          </div>

          {/* Info Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            Drag to reposition and use zoom for framing. Image is auto-compressed for upload.
          </div>
        </div>

        <DialogFooter className="gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handleResetCrop}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplyCrop}
            disabled={processing}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {processing ? "Processing..." : "Apply Crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
