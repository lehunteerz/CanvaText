import { useEffect, useState } from 'react';
import { pluginManager } from '../plugins/core/PluginManager';

/**
 * Hook para usar plugins no React
 * @param {string} pluginId - ID do plugin
 * @returns {Object} { plugin, isActive, activate, deactivate }
 */
export const usePlugin = (pluginId) => {
  const [plugin, setPlugin] = useState(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const p = pluginManager.plugins.get(pluginId);
    if (p) {
      setPlugin(p);
      setIsActive(p.enabled);
    }
  }, [pluginId]);

  const activate = () => {
    const success = pluginManager.activate(pluginId);
    if (success) {
      setIsActive(true);
    }
    return success;
  };

  const deactivate = () => {
    const success = pluginManager.deactivate(pluginId);
    if (success) {
      setIsActive(false);
    }
    return success;
  };

  return {
    plugin,
    isActive,
    activate,
    deactivate,
  };
};

/**
 * Hook para obter todos os plugins
 * @returns {Object} { plugins, activePlugins, activate, deactivate }
 */
export const usePlugins = () => {
  const [plugins, setPlugins] = useState([]);
  const [activePlugins, setActivePlugins] = useState([]);

  useEffect(() => {
    const updatePlugins = () => {
      setPlugins(pluginManager.getAllPlugins());
      setActivePlugins(pluginManager.getActivePlugins());
    };

    updatePlugins();
    // Atualizar periodicamente (pode ser melhorado com eventos)
    const interval = setInterval(updatePlugins, 1000);
    return () => clearInterval(interval);
  }, []);

  const activate = (pluginId) => {
    const success = pluginManager.activate(pluginId);
    if (success) {
      setActivePlugins(pluginManager.getActivePlugins());
    }
    return success;
  };

  const deactivate = (pluginId) => {
    const success = pluginManager.deactivate(pluginId);
    if (success) {
      setActivePlugins(pluginManager.getActivePlugins());
    }
    return success;
  };

  return {
    plugins,
    activePlugins,
    activate,
    deactivate,
  };
};

