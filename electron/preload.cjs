const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs protegidas para o renderer process
// Usando contextBridge para segurança (Context Isolation)
contextBridge.exposeInMainWorld('electronAPI', {
  // Informações da plataforma
  platform: process.platform,
  
  // Controles de janela (aliases simples - recomendados)
  minimize: () => {
    return ipcRenderer.invoke('window-minimize');
  },
  close: () => {
    return ipcRenderer.invoke('window-close');
  },
  
  // Controles de janela (nomes completos - mantidos para compatibilidade)
  minimizeWindow: () => {
    return ipcRenderer.invoke('window-minimize');
  },
  maximizeWindow: () => {
    return ipcRenderer.invoke('window-maximize');
  },
  closeWindow: () => {
    return ipcRenderer.invoke('window-close');
  },
  toggleAlwaysOnTop: () => {
    return ipcRenderer.invoke('window-toggle-always-on-top');
  },
  getAlwaysOnTop: () => {
    return ipcRenderer.invoke('window-get-always-on-top');
  },
  
  // Exportar arquivo (mantido para compatibilidade)
  saveFile: (options) => {
    return ipcRenderer.invoke('manual-save-note', options);
  },
  
  // Auto-Save (Shift+S) - Backup automático
  autoSaveNote: (content, title) => {
    return ipcRenderer.invoke('auto-save-note', { content, title });
  },
  
  // Manual Save (Ctrl+Shift+S) - Exportar com dialog
  manualSaveNote: (options) => {
    return ipcRenderer.invoke('manual-save-note', options);
  },
  
  // Abrir arquivo
  openFile: () => {
    return ipcRenderer.invoke('open-file');
  },
  
  // Histórico de downloads
  listSavedFiles: () => {
    return ipcRenderer.invoke('list-saved-files');
  },
  deleteSavedFile: (fileName) => {
    return ipcRenderer.invoke('delete-saved-file', fileName);
  },
  renameSavedFile: (oldFileName, newFileName) => {
    return ipcRenderer.invoke('rename-saved-file', { oldFileName, newFileName });
  },
});
