import { Plugin } from './PluginInterface';

/**
 * Gerenciador central de plugins
 */
class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.context = {
      notes: null,
      editor: null,
      app: null,
      toast: null,
    };
    this.hooks = new Map();
    this.components = new Map();
    this.commands = new Map();
    this.shortcuts = new Map();
  }

  /**
   * Registrar um plugin
   * @param {Plugin} plugin - Instância do plugin
   */
  register(plugin) {
    if (!(plugin instanceof Plugin)) {
      throw new Error('Plugin deve ser uma instância da classe Plugin');
    }

    if (this.plugins.has(plugin.id)) {
      // Silenciar aviso em desenvolvimento (React StrictMode registra duas vezes)
      if (process.env.NODE_ENV === 'production') {
        console.warn(`Plugin ${plugin.id} já está registrado. Substituindo...`);
      }
    }

    this.plugins.set(plugin.id, plugin);
    // Silenciar log em desenvolvimento para evitar duplicação
    if (process.env.NODE_ENV === 'production') {
      console.log(`📦 Plugin ${plugin.name} registrado`);
    }
  }

  /**
   * Ativar um plugin
   * @param {string} pluginId - ID do plugin
   */
  activate(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.error(`Plugin ${pluginId} não encontrado`);
      return false;
    }

    if (plugin.enabled) {
      console.warn(`Plugin ${pluginId} já está ativado`);
      return true;
    }

    try {
      plugin.activate(this.context);

      // Registrar hooks
      const hooks = plugin.getHooks();
      Object.entries(hooks).forEach(([name, hook]) => {
        this.hooks.set(`${pluginId}.${name}`, hook);
      });

      // Registrar componentes
      const components = plugin.getComponents();
      Object.entries(components).forEach(([name, component]) => {
        this.components.set(`${pluginId}.${name}`, component);
      });

      // Registrar comandos
      const commands = plugin.getCommands();
      Object.entries(commands).forEach(([name, command]) => {
        this.commands.set(`${pluginId}.${name}`, command);
      });

      // Registrar atalhos
      const shortcuts = plugin.getShortcuts();
      Object.entries(shortcuts).forEach(([key, handler]) => {
        this.shortcuts.set(`${pluginId}.${key}`, handler);
      });

      // Log apenas em produção
      if (process.env.NODE_ENV === 'production') {
        console.log(`✅ Plugin ${plugin.name} ativado`);
      }

      return true;
    } catch (error) {
      console.error(`Erro ao ativar plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Desativar um plugin
   * @param {string} pluginId - ID do plugin
   */
  deactivate(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.error(`Plugin ${pluginId} não encontrado`);
      return false;
    }

    if (!plugin.enabled) {
      console.warn(`Plugin ${pluginId} já está desativado`);
      return true;
    }

    try {
      plugin.deactivate();

      // Remover hooks, componentes, comandos e atalhos do plugin
      const keysToRemove = [];
      this.hooks.forEach((_, key) => {
        if (key.startsWith(`${pluginId}.`)) keysToRemove.push(key);
      });
      keysToRemove.forEach(key => this.hooks.delete(key));

      keysToRemove.length = 0;
      this.components.forEach((_, key) => {
        if (key.startsWith(`${pluginId}.`)) keysToRemove.push(key);
      });
      keysToRemove.forEach(key => this.components.delete(key));

      keysToRemove.length = 0;
      this.commands.forEach((_, key) => {
        if (key.startsWith(`${pluginId}.`)) keysToRemove.push(key);
      });
      keysToRemove.forEach(key => this.commands.delete(key));

      keysToRemove.length = 0;
      this.shortcuts.forEach((_, key) => {
        if (key.startsWith(`${pluginId}.`)) keysToRemove.push(key);
      });
      keysToRemove.forEach(key => this.shortcuts.delete(key));

      return true;
    } catch (error) {
      console.error(`Erro ao desativar plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Atualizar contexto da aplicação
   * @param {Object} context - Novo contexto
   */
  updateContext(context) {
    this.context = { ...this.context, ...context };
    
    // Notificar plugins ativos sobre mudança de contexto
    this.plugins.forEach(plugin => {
      if (plugin.enabled && plugin.onContextUpdate) {
        plugin.onContextUpdate(this.context);
      }
    });
  }

  /**
   * Obter todos os plugins
   * @returns {Array} Lista de plugins
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Obter plugins ativos
   * @returns {Array} Lista de plugins ativos
   */
  getActivePlugins() {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }

  /**
   * Obter hook por nome
   * @param {string} name - Nome do hook (formato: pluginId.hookName)
   * @returns {Function|null} Função do hook ou null
   */
  getHook(name) {
    return this.hooks.get(name) || null;
  }

  /**
   * Obter componente por nome
   * @param {string} name - Nome do componente (formato: pluginId.componentName)
   * @returns {React.Component|null} Componente ou null
   */
  getComponent(name) {
    return this.components.get(name) || null;
  }

  /**
   * Obter comando por nome
   * @param {string} name - Nome do comando (formato: pluginId.commandName)
   * @returns {Function|null} Função do comando ou null
   */
  getCommand(name) {
    return this.commands.get(name) || null;
  }

  /**
   * Obter todos os atalhos registrados
   * @returns {Map} Map de atalhos
   */
  getAllShortcuts() {
    return this.shortcuts;
  }
}

// Singleton
export const pluginManager = new PluginManager();

