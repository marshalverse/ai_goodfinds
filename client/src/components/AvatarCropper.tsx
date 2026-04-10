import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AvatarCropperProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  isSaving?: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 80 },
      1,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function AvatarCropper({ open, onClose, imageSrc, onCropComplete, isSaving }: AvatarCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const { language } = useLanguage();

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const newCrop = centerAspectCrop(naturalWidth, naturalHeight);
    setCrop(newCrop);
    setCompletedCrop(newCrop);
  }, []);

  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: (completedCrop.unit === "%" ? (completedCrop.x / 100) * image.width : completedCrop.x) * scaleX,
      y: (completedCrop.unit === "%" ? (completedCrop.y / 100) * image.height : completedCrop.y) * scaleY,
      width: (completedCrop.unit === "%" ? (completedCrop.width / 100) * image.width : completedCrop.width) * scaleX,
      height: (completedCrop.unit === "%" ? (completedCrop.height / 100) * image.height : completedCrop.height) * scaleY,
    };

    // Output at 400x400 for good quality avatars
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  }, [completedCrop]);

  const handleSave = async () => {
    const blob = await getCroppedImg();
    if (blob) {
      onCropComplete(blob);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {language === "zh" ? "裁切大頭貼" : "Crop Avatar"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          <div className="max-h-[400px] overflow-hidden rounded-lg">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              className="max-h-[400px]"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[400px] w-auto"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {language === "zh"
            ? "拖動選取框調整裁切範圍，圖片將裁切為 1:1 正方形"
            : "Drag the selection to adjust crop area. Image will be cropped to 1:1 square."}
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            {language === "zh" ? "取消" : "Cancel"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !completedCrop}
            className="bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />{language === "zh" ? "上傳中..." : "Uploading..."}</>
            ) : (
              language === "zh" ? "確認並上傳" : "Confirm & Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
