import React, { useState } from 'react';

interface ApiKeySelectorProps {
  onKeySelected: (key: string) => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [inputKey, setInputKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      onKeySelected(inputKey.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6 bg-neutral-800 rounded-xl shadow-2xl max-w-lg mx-auto mt-10 border border-neutral-700">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">APIキーを入力</h2>
        <p className="text-neutral-400">
          Gemini APIキーを入力して利用を開始してください。
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
        />
        <button
            type="submit"
            disabled={!inputKey}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
            開始する
        </button>
      </form>

      <p className="text-xs text-neutral-500">
        APIキーは <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a> で取得できます。
        <br/>キーはブラウザ内にのみ保存され、外部には送信されません（Gemini APIへの直接送信を除く）。
      </p>
    </div>
  );
};

export default ApiKeySelector;