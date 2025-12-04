import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CanvasEditorProps {
  imageSrc: string;
  brushSize: number;
  onMaskChange: (maskDataUrl: string) => void;
  onProcessedImage: (processedDataUrl: string) => void;
}

const SUPPORTED_RATIOS = [
  { label: "1:1", value: 1.0 },
  { label: "3:4", value: 3/4 },
  { label: "4:3", value: 4/3 },
  { label: "9:16", value: 9/16 },
  { label: "16:9", value: 16/9 },
];

const CanvasEditor: React.FC<CanvasEditorProps> = ({ imageSrc, brushSize, onMaskChange, onProcessedImage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null);

  // Helper to find closest supported aspect ratio
  const getBestAspectRatio = (ratio: number) => {
    return SUPPORTED_RATIOS.reduce((prev, curr) => {
      return (Math.abs(curr.value - ratio) < Math.abs(prev.value - ratio) ? curr : prev);
    });
  };

  // Process image on load: Crop to supported ratio and Resize
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const originalRatio = img.width / img.height;
      const targetRatioObj = getBestAspectRatio(originalRatio);
      const targetRatio = targetRatioObj.value;

      // Calculate Crop Dimensions (Center Crop)
      let cropWidth = img.width;
      let cropHeight = img.height;

      if (originalRatio > targetRatio) {
        // Too wide, crop width
        cropWidth = img.height * targetRatio;
      } else {
        // Too tall, crop height
        cropHeight = img.width / targetRatio;
      }

      const cropX = (img.width - cropWidth) / 2;
      const cropY = (img.height - cropHeight) / 2;

      // Resize logic: Ensure max dimension is reasonable for API (e.g., 1024px or 1536px)
      // Gemini Flash/Pro handles up to roughly 2k well, but 1024-1536 is safe and fast.
      const MAX_DIMENSION = 1024;
      let finalWidth = cropWidth;
      let finalHeight = cropHeight;

      if (cropWidth > cropHeight) {
        if (cropWidth > MAX_DIMENSION) {
            finalWidth = MAX_DIMENSION;
            finalHeight = Math.round(MAX_DIMENSION / targetRatio);
        }
      } else {
        if (cropHeight > MAX_DIMENSION) {
            finalHeight = MAX_DIMENSION;
            finalWidth = Math.round(MAX_DIMENSION * targetRatio);
        }
      }
      
      // Ensure integers
      finalWidth = Math.round(finalWidth);
      finalHeight = Math.round(finalHeight);

      // Draw processed image to an offscreen canvas
      const offCanvas = document.createElement('canvas');
      offCanvas.width = finalWidth;
      offCanvas.height = finalHeight;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      // Draw cropped and resized image
      ctx.drawImage(
        img, 
        cropX, cropY, cropWidth, cropHeight, // Source crop
        0, 0, finalWidth, finalHeight        // Destination resize
      );

      const processedDataUrl = offCanvas.toDataURL('image/png');
      
      setProcessedImageSrc(processedDataUrl);
      setImgDimensions({ width: finalWidth, height: finalHeight });
      
      // Notify parent of the actual image being used
      onProcessedImage(processedDataUrl);
    };
  }, [imageSrc, onProcessedImage]);

  // Init visible canvas when processed image is ready
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && imgDimensions.width > 0 && processedImageSrc) {
      canvas.width = imgDimensions.width;
      canvas.height = imgDimensions.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'; // Semi-transparent red
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [imgDimensions, processedImageSrc]);

  // Handle Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            // Export the mask exactly as drawn on the processed image coordinates
            onMaskChange(canvas.toDataURL('image/png'));
        }
    }
  };

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = 'source-over';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

  }, [isDrawing, brushSize]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.beginPath();
      startDrawing(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.beginPath();
      startDrawing(e);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
       {imgDimensions.width > 0 && processedImageSrc && (
          <div 
            ref={containerRef}
            className="relative shadow-2xl rounded-lg overflow-hidden border border-neutral-700 bg-black"
            style={{ 
                width: imgDimensions.width, 
                height: imgDimensions.height, 
                maxWidth: '100%', 
                maxHeight: '70vh', 
                aspectRatio: `${imgDimensions.width}/${imgDimensions.height}` 
            }}
          >
            {/* Background Image: The processed (cropped) one */}
            <img 
              src={processedImageSrc} 
              alt="Base" 
              className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none select-none"
            />
            
            {/* Drawing Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
            />
          </div>
       )}
       <p className="mt-2 text-sm text-neutral-500">
         赤いブラシで衣服をなぞってください
       </p>
    </div>
  );
};

export default CanvasEditor;