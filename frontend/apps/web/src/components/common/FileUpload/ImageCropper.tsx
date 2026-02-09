import * as React from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: File | string | null;
  onCropComplete: (croppedImage: File) => void;
  aspect?: number;
  circularCrop?: boolean;
  minWidth?: number;
  minHeight?: number;
  outputWidth?: number;
  outputHeight?: number;
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
  outputQuality?: number;
}

export function ImageCropper({
  open,
  onOpenChange,
  image,
  onCropComplete,
  aspect = 1,
  circularCrop = false,
  minWidth = 50,
  minHeight = 50,
  outputWidth = 200,
  outputHeight = 200,
  outputType = 'image/jpeg',
  outputQuality = 0.9,
}: ImageCropperProps) {
  const { t } = useTranslation('common');
  const [imgSrc, setImgSrc] = React.useState<string>('');
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<Crop>();
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (!image) {
      setImgSrc('');
      return;
    }

    if (typeof image === 'string') {
      setImgSrc(image);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setImgSrc(reader.result as string);
      };
      reader.readAsDataURL(image);
    }
  }, [image]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        width,
        height
      ),
      width,
      height
    );

    setCrop(crop);
  };

  const getCroppedImg = async (): Promise<File | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const fileName =
            typeof image === 'string'
              ? 'cropped-image'
              : (image as unknown as File).name || 'cropped-image';
          const extension = outputType.split('/')[1];
          resolve(
            new File([blob], `${fileName.replace(/\.[^/.]+$/, '')}.${extension}`, {
              type: outputType,
            })
          );
        },
        outputType,
        outputQuality
      );
    });
  };

  const handleComplete = async () => {
    const croppedImage = await getCroppedImg();
    if (croppedImage) {
      onCropComplete(croppedImage);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('component.cropImage')}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center">
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              minWidth={minWidth}
              minHeight={minHeight}
              circularCrop={circularCrop}
              className="max-h-[60vh]"
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[60vh] object-contain"
              />
            </ReactCrop>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('cancel')}
          </Button>
          <Button onClick={handleComplete} disabled={!completedCrop}>
            {t('apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
