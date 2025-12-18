import { Plugin } from '../../core/PluginInterface';
import TranslationComponent from './TranslationComponent';

/**
 * Plugin de Tradução de Texto
 * Permite traduzir o conteúdo das notas para diferentes idiomas
 */
export class TranslationPlugin extends Plugin {
  constructor() {
    super({
      id: 'translation',
      name: 'Tradução de Texto',
      version: '1.0.0',
      description: 'Traduz texto para diferentes idiomas',
      author: 'CanvaText Team',
    });
  }

  activate(context) {
    super.activate(context);
  }

  deactivate() {
    super.deactivate();
  }

  /**
   * Retorna componentes que o plugin quer renderizar
   */
  getComponents() {
    return {
      Translation: TranslationComponent,
    };
  }

  /**
   * Retorna comandos que o plugin disponibiliza
   */
  getCommands() {
    return {
      translate: async (text, from, to) => {
        return await this.translateText(text, from, to);
      },
    };
  }

  /**
   * Traduz texto usando API gratuita (MyMemory Translation)
   */
  async translateText(text, from = 'pt', to = 'en') {
    try {
      if (!text || !text.trim()) {
        return { success: false, error: 'Texto vazio' };
      }

      // Usar MyMemory Translation API (gratuita, limite de 10000 caracteres/dia)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
      );

      if (!response.ok) {
        throw new Error('Erro ao traduzir');
      }

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData) {
        return {
          success: true,
          translatedText: data.responseData.translatedText,
          originalText: text,
        };
      } else {
        throw new Error('Erro na tradução');
      }
    } catch (error) {
      console.error('Erro ao traduzir:', error);
      return {
        success: false,
        error: error.message || 'Erro ao traduzir texto',
      };
    }
  }
}

