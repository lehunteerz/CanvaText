import { useState, useCallback } from 'react';
import { Languages, ArrowRightLeft, Copy, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'Inglês' },
  { code: 'es', name: 'Espanhol' },
  { code: 'fr', name: 'Francês' },
  { code: 'de', name: 'Alemão' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: 'Japonês' },
  { code: 'zh', name: 'Chinês' },
  { code: 'ru', name: 'Russo' },
  { code: 'ar', name: 'Árabe' },
];

/**
 * Componente de tradução
 * Permite traduzir o texto do editor
 */
function TranslationComponent({ editor }) {
  const [fromLang, setFromLang] = useState('pt');
  const [toLang, setToLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const translate = useCallback(async () => {
    if (!editor) return;

    const text = editor.getText();
    if (!text.trim()) {
      setError('Nenhum texto para traduzir');
      return;
    }

    setIsTranslating(true);
    setError('');
    setTranslatedText('');

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
      );

      if (!response.ok) {
        throw new Error('Erro ao traduzir');
      }

      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        throw new Error('Erro na tradução');
      }
    } catch (err) {
      setError(err.message || 'Erro ao traduzir texto');
    } finally {
      setIsTranslating(false);
    }
  }, [editor, fromLang, toLang]);

  const copyToClipboard = useCallback(async () => {
    if (!translatedText) return;

    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  }, [translatedText]);

  const replaceText = useCallback(() => {
    if (!editor || !translatedText) return;

    editor.commands.setContent(translatedText);
    setTranslatedText('');
  }, [editor, translatedText]);

  if (!editor) return null;

  return (
    <div className="border-t border-white/10">
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-3">
          <Languages size={14} className="text-neutral-400" />
          <span className="text-xs font-medium text-neutral-300">Tradução</span>
        </div>

        {/* Seleção de idiomas */}
        <div className="flex items-center gap-2 mb-2">
          <select
            value={fromLang}
            onChange={(e) => setFromLang(e.target.value)}
            className="flex-1 px-2 py-1 bg-neutral-800 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          <ArrowRightLeft size={12} className="text-neutral-500" />

          <select
            value={toLang}
            onChange={(e) => setToLang(e.target.value)}
            className="flex-1 px-2 py-1 bg-neutral-800 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Botão de traduzir */}
        <button
          onClick={translate}
          disabled={isTranslating}
          className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors mb-2"
        >
          {isTranslating ? 'Traduzindo...' : 'Traduzir'}
        </button>

        {/* Resultado */}
        {error && (
          <div className="text-red-400 text-xs mb-2">{error}</div>
        )}

        {translatedText && (
          <div className="space-y-2">
            <div className="bg-neutral-800/50 rounded p-2 border border-white/10">
              <p className="text-xs text-neutral-300 whitespace-pre-wrap break-words">
                {translatedText}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs flex items-center justify-center gap-1 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={12} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Copiar
                  </>
                )}
              </button>
              <button
                onClick={replaceText}
                className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors"
              >
                Substituir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TranslationComponent;

