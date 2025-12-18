import { useState, useEffect, useCallback } from 'react';
import { Languages, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Componente de correção ortográfica
 * Mostra erros encontrados e permite corrigir
 */
function SpellCheckComponent({ editor }) {
  const [errors, setErrors] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const checkSpelling = useCallback(async () => {
    if (!editor) return;

    setIsChecking(true);
    try {
      const text = editor.getText();
      if (!text.trim()) {
        setErrors([]);
        return;
      }

      // Usar LanguageTool API
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          language: 'pt-BR',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setErrors(data.matches || []);
      } else {
        setErrors([]);
      }
    } catch (error) {
      console.error('Erro ao verificar ortografia:', error);
      setErrors([]);
    } finally {
      setIsChecking(false);
    }
  }, [editor]);

  // Verificar automaticamente quando o texto mudar (com debounce)
  useEffect(() => {
    if (!editor || !showPanel) return;

    const timeoutId = setTimeout(() => {
      checkSpelling();
    }, 2000); // Aguardar 2 segundos após parar de digitar

    return () => clearTimeout(timeoutId);
  }, [editor, showPanel, checkSpelling]);

  const applyCorrection = useCallback((error, suggestion) => {
    if (!editor) return;

    const { offset, length } = error;
    const text = editor.getText();
    const before = text.substring(0, offset);
    const after = text.substring(offset + length);
    const newText = before + suggestion + after;

    editor.commands.setContent(newText);
    checkSpelling(); // Re-verificar após correção
  }, [editor, checkSpelling]);

  if (!editor) return null;

  return (
    <div className="border-t border-white/10">
      <div
        onClick={() => setShowPanel(!showPanel)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-neutral-800/50 transition-colors text-xs cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Languages size={14} className="text-neutral-400" />
          <span className="text-neutral-300">Correção Ortográfica</span>
          {errors.length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-semibold">
              {errors.length}
            </span>
          )}
        </div>
        {isChecking ? (
          <span className="text-neutral-500 text-[10px]">Verificando...</span>
        ) : (
          <span
            onClick={(e) => {
              e.stopPropagation();
              checkSpelling();
            }}
            className="text-blue-400 hover:text-blue-300 text-[10px] cursor-pointer"
          >
            Verificar
          </span>
        )}
      </div>

      {showPanel && (
        <div className="px-3 pb-2 max-h-40 overflow-y-auto">
          {errors.length === 0 && !isChecking ? (
            <div className="flex items-center gap-2 text-green-400 text-xs py-2">
              <CheckCircle2 size={12} />
              <span>Nenhum erro encontrado!</span>
            </div>
          ) : errors.length > 0 ? (
            <div className="space-y-2">
              {errors.slice(0, 5).map((error, index) => (
                <div
                  key={index}
                  className="bg-neutral-800/50 rounded p-2 border border-red-500/20"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-red-400 text-xs font-medium mb-1">
                        {error.context?.text?.substring(
                          error.context.offset,
                          error.context.offset + error.context.length
                        )}
                      </div>
                      {error.replacements && error.replacements.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {error.replacements.slice(0, 3).map((replacement, idx) => (
                            <button
                              key={idx}
                              onClick={() => applyCorrection(error, replacement.value)}
                              className="px-2 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-[10px] transition-colors"
                            >
                              {replacement.value}
                            </button>
                          ))}
                        </div>
                      )}
                      {error.message && (
                        <div className="text-neutral-500 text-[10px] mt-1">
                          {error.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {errors.length > 5 && (
                <div className="text-neutral-500 text-[10px] text-center">
                  +{errors.length - 5} mais erros encontrados
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default SpellCheckComponent;

