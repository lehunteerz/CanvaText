/**
 * Utilitários para abrir arquivos
 */

/**
 * Abrir arquivo e retornar conteúdo
 * @returns {Promise<Object>} { success, fileName, content, textContent, extension }
 */
export const openFile = async () => {
  if (!window.electronAPI) {
    console.error('Electron API não disponível');
    return { success: false, error: 'Electron API não disponível' };
  }

  try {
    const result = await window.electronAPI.openFile();
    return result;
  } catch (error) {
    console.error('Erro ao abrir arquivo:', error);
    return { success: false, error: error.message };
  }
};

