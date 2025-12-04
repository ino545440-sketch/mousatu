import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import CanvasEditor from './components/CanvasEditor';
import Controls from './components/Controls';
import ApiKeySelector from './components/ApiKeySelector';
import { TearingStyle } from './types';
import { generateMousatsuImage } from './services/geminiService';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [processedBaseImage, setProcessedBaseImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState<number>(30);
  const [selectedStyle, setSelectedStyle] = useState<TearingStyle>(TearingStyle.WILD);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File Upload Handler
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBaseImage(e.target.result as string);
        setProcessedBaseImage(null); // Reset processed image until Canvas generates it
        setResultImage(null);
        setMaskImage(null);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generation Handler
  const handleGenerate = async () => {
    if (!apiKey) {
        setError("APIキーが設定されていません。");
        return;
    }
    // Use processedBaseImage to ensure dimensions match the mask
    if (!processedBaseImage) {
        setError("画像の処理が完了していません。少し待ってから再度お試しください。");
        return;
    }
    if (!maskImage) {
      setError("編集する箇所をブラシでなぞってください。");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResultImage(null);

    try {
      const result = await generateMousatsuImage(apiKey, processedBaseImage, maskImage, selectedStyle);
      setResultImage(result);
    } catch (e: any) {
        let msg = "生成に失敗しました。";
        if (e.message) msg += ` ${e.message}`;
        setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setBaseImage(null);
    setProcessedBaseImage(null);
    setMaskImage(null);
    setResultImage(null);
    setError(null);
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center">
        <header className="w-full p-6 text-center">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600">
            妄撮 GEN AI
          </h1>
          <p className="text-neutral-500 mt-2">Nano Banana Pro Powered</p>
        </header>
        <ApiKeySelector onKeySelected={(key) => setApiKey(key)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col pb-20">
      {/* Header */}
      <header className="p-6 text-center border-b border-neutral-800 relative">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600 tracking-tighter">
          妄撮 GEN AI
        </h1>
        <p className="text-neutral-500 text-sm mt-2 font-mono">
          Model: Gemini 3 Pro (Image Preview)
        </p>
        <button 
            onClick={() => setApiKey(null)}
            className="absolute top-6 right-6 text-xs text-neutral-500 hover:text-white underline"
        >
            APIキーを変更
        </button>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        
        {error && (
            <div className="w-full max-w-2xl bg-red-900/50 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6 text-center">
                {error}
            </div>
        )}

        {!baseImage ? (
          // Upload View
          <div className="w-full max-w-2xl mt-10">
            <ImageUploader onImageUpload={handleImageUpload} />
            <div className="mt-8 text-neutral-500 text-sm text-center">
                <p>AIが衣服の裂け目をシミュレーションします。</p>
                <p>※ 生成には数秒〜1分程度かかります。</p>
            </div>
          </div>
        ) : (
          // Editor & Result View
          <div className="w-full flex flex-col items-center">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
                {/* Left: Editor */}
                <div className="flex flex-col items-center">
                    <div className="w-full flex justify-between items-center mb-2 px-2">
                        <h2 className="text-xl font-bold text-pink-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                            Target
                        </h2>
                    </div>
                    
                    <CanvasEditor 
                        imageSrc={baseImage} 
                        brushSize={brushSize} 
                        onMaskChange={setMaskImage}
                        onProcessedImage={setProcessedBaseImage}
                    />
                </div>

                {/* Right: Result */}
                <div className="flex flex-col items-center justify-start h-full">
                     <div className="w-full flex justify-between items-center mb-2 px-2">
                        <h2 className="text-xl font-bold text-purple-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            Result
                        </h2>
                    </div>

                    <div className="w-full bg-black rounded-lg border border-neutral-700 aspect-square flex items-center justify-center relative overflow-hidden shadow-2xl">
                        {resultImage ? (
                            <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
                        ) : isGenerating ? (
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mb-4"></div>
                                <span className="text-pink-400 font-mono animate-pulse">Processing...</span>
                            </div>
                        ) : (
                            <div className="text-neutral-600 flex flex-col items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>ここに結果が表示されます</span>
                            </div>
                        )}
                    </div>
                    {resultImage && (
                         <a 
                            href={resultImage} 
                            download="mousatsu_result.png"
                            className="mt-4 px-6 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-full text-sm transition-colors"
                         >
                            画像を保存
                         </a>
                    )}
                </div>
            </div>

            {/* Controls are Sticky at bottom on mobile, or just block on desktop */}
            <div className="w-full max-w-4xl mt-8 mb-8 sticky bottom-4 z-10">
                <Controls 
                    brushSize={brushSize}
                    setBrushSize={setBrushSize}
                    selectedStyle={selectedStyle}
                    setSelectedStyle={setSelectedStyle}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    onReset={handleReset}
                />
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;