import React, { useCallback } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    } else {
      alert('画像ファイルを選択してください');
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      className="border-2 border-dashed border-neutral-600 rounded-xl p-10 flex flex-col items-center justify-center text-neutral-400 bg-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer min-h-[300px]"
    >
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer w-full h-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-lg font-medium text-white mb-2">画像をアップロード</span>
        <span className="text-sm">ドラッグ＆ドロップ または クリックして選択</span>
      </label>
    </div>
  );
};

export default ImageUploader;