import React from 'react';
import { TearingStyle } from '../types';

interface ControlsProps {
  brushSize: number;
  setBrushSize: (size: number) => void;
  selectedStyle: TearingStyle;
  setSelectedStyle: (style: TearingStyle) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onReset: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  brushSize,
  setBrushSize,
  selectedStyle,
  setSelectedStyle,
  onGenerate,
  isGenerating,
  onReset
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-neutral-800 rounded-xl shadow-lg border border-neutral-700 mt-6 space-y-6">
      
      {/* Top Row: Brush & Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Brush Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-neutral-300">ブラシサイズ</label>
            <span className="text-xs text-neutral-500">{brushSize}px</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-pink-600"
          />
        </div>

        {/* Style Selector */}
        <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">破き方のスタイル</label>
            <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as TearingStyle)}
                className="w-full bg-neutral-900 border border-neutral-600 text-white rounded-lg p-2.5 focus:ring-pink-500 focus:border-pink-500 outline-none"
            >
                <option value={TearingStyle.WILD}>ワイルドに破る</option>
                <option value={TearingStyle.BURNT}>焼け焦げたように</option>
                <option value={TearingStyle.CLAW}>鋭い爪痕</option>
                <option value={TearingStyle.MELTING}>溶け落ちる</option>
                <option value={TearingStyle.GEOMETRIC}>幾何学的なカット</option>
                <option value={TearingStyle.PAPER}>紙の切れ端のように</option>
            </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 border-t border-neutral-700 pt-6">
        <button
            onClick={onReset}
            disabled={isGenerating}
            className="flex-1 px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
            やり直す
        </button>
        <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`flex-[2] px-6 py-3 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all transform
                ${isGenerating 
                    ? 'bg-pink-800 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 hover:scale-[1.02]'
                }`}
        >
            {isGenerating ? (
                <>
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    妄撮中... (生成中)
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    妄撮を実行 (生成)
                </>
            )}
        </button>
      </div>
    </div>
  );
};

export default Controls;