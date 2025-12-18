import { Plugin } from '../../core/PluginInterface';
import WordCounterComponent from './WordCounterComponent';

/**
 * Plugin de exemplo: Contador de palavras
 * Demonstra como criar um plugin simples que adiciona uma funcionalidade ao editor
 */
export class WordCounterPlugin extends Plugin {
  constructor() {
    super({
      id: 'word-counter',
      name: 'Contador de Palavras',
      version: '1.0.0',
      description: 'Mostra contagem de palavras e caracteres no editor',
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
      WordCounter: WordCounterComponent,
    };
  }
}

