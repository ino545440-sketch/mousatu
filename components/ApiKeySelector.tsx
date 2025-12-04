import React, { useEffect, useState } from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [checking, setChecking] = useState(true);
  const [hasKey, setHasKey] = useState(false);

  const checkKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (selected) {
          onKeySelected();
        }
      } else {
        // Fallback for dev environments without the wrapper
        console.warn("window.aistudio not found");
      }
    } catch (e) {
      console.error("Error checking API key:", e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        // Assume success after closing dialog as per guidelines
        setHasKey(true);
        onKeySelected();
      }
    } catch (e) {
      console.error("Error selecting key:", e);
    }
  };

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-neutral-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
        <p>Checking API Access...</p>
      </div>
    );
  }

  if (hasKey) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6 bg-neutral-800 rounded-xl shadow-2xl max-w-lg mx-auto mt-10 border border-neutral-700">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">APIキーが必要です</h2>
        <p className="text-neutral-400">
          高画質な画像生成モデル (Gemini 3 Pro) を使用するには、有料プロジェクトのAPIキーを選択する必要があります。
        </p>
      </div>
      
      <button
        onClick={handleSelectKey}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
      >
        APIキーを選択 / 連携
      </button>

      <p className="text-xs text-neutral-500 max-w-xs">
        詳しくは <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Billing Documentation</a> をご覧ください。
      </p>
    </div>
  );
};

export default ApiKeySelector;