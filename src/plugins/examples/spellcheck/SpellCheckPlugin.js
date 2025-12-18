import { Plugin } from '../../core/PluginInterface';
import SpellCheckComponent from './SpellCheckComponent';

/**
 * Plugin de Correção Ortográfica
 * Adiciona verificação de ortografia e gramática ao editor
 */
export class SpellCheckPlugin extends Plugin {
  constructor() {
    super({
      id: 'spellcheck',
      name: 'Correção Ortográfica',
      version: '1.0.0',
      description: 'Verifica e corrige erros de ortografia e gramática',
      author: 'CanvaText Team',
    });
  }

  activate(context) {
    super.activate(context);
    // Plugin ativado com sucesso
  }

  deactivate() {
    super.deactivate();
    // Limpeza se necessário
  }

  /**
   * Retorna componentes que o plugin quer renderizar
   */
  getComponents() {
    return {
      SpellCheck: SpellCheckComponent,
    };
  }

  /**
   * Retorna comandos que o plugin disponibiliza
   */
  getCommands() {
    return {
      checkSpelling: (text) => {
        // Comando para verificar ortografia
        return this.checkSpelling(text);
      },
      correctWord: (word, suggestion) => {
        // Comando para corrigir palavra
        return this.correctWord(word, suggestion);
      },
    };
  }

  /**
   * Verifica ortografia usando API gratuita (LanguageTool)
   * 
   * API Pública Gratuita:
   * - 20 requisições por minuto
   * - 75 KB de texto por minuto
   * - 20 KB por requisição
   * - Sem garantias de desempenho ou disponibilidade
   * 
   * Documentação: https://dev.languagetool.org/public-http-api.html
   */
  async checkSpelling(text) {
    try {
      // Limitar tamanho do texto (20 KB por requisição)
      const maxLength = 20000; // ~20 KB
      const textToCheck = text.length > maxLength ? text.substring(0, maxLength) : text;

      // Usar LanguageTool API pública (gratuita, limite de 20 requisições/minuto)
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: textToCheck,
          language: 'pt-BR',
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar ortografia');
      }

      const data = await response.json();
      return data.matches || [];
    } catch (error) {
      console.error('Erro ao verificar ortografia:', error);
      // Fallback: usar spellcheck nativo do navegador
      return [];
    }
  }

  correctWord(word, suggestion) {
    return suggestion;
  }
}

