/**
 * Interface base para todos os plugins
 */
export class Plugin {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.version = config.version || '1.0.0';
    this.description = config.description || '';
    this.author = config.author || '';
    this.enabled = false;
    this.config = config.config || {};
  }

  /**
   * Chamado quando o plugin é ativado
   * @param {Object} context - Contexto da aplicação (notes, editor, app, etc.)
   */
  activate(context) {
    this.enabled = true;
    this.context = context;
    // Log apenas em produção para evitar duplicação no React StrictMode
    if (process.env.NODE_ENV === 'production') {
      console.log(`✅ Plugin ${this.name} ativado`);
    }
  }

  /**
   * Chamado quando o plugin é desativado
   */
  deactivate() {
    this.enabled = false;
    // Log apenas em produção
    if (process.env.NODE_ENV === 'production') {
      console.log(`❌ Plugin ${this.name} desativado`);
    }
  }

  /**
   * Retorna hooks do React que o plugin quer usar
   * @returns {Object} Objeto com hooks { hookName: hookFunction }
   */
  getHooks() {
    return {};
  }

  /**
   * Retorna componentes que o plugin quer renderizar
   * @returns {Object} Objeto com componentes { componentName: Component }
   */
  getComponents() {
    return {};
  }

  /**
   * Retorna comandos que o plugin disponibiliza
   * @returns {Object} Objeto com comandos { commandName: commandFunction }
   */
  getCommands() {
    return {};
  }

  /**
   * Retorna atalhos de teclado que o plugin adiciona
   * @returns {Object} Objeto com atalhos { 'Ctrl+K': handler }
   */
  getShortcuts() {
    return {};
  }
}

