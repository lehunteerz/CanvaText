/**
 * Utilitários para manipulação de arquivos
 */

/**
 * Detectar formato do arquivo pela extensão
 * @param {string} fileName - Nome do arquivo
 * @returns {string} Formato detectado (ex: 'txt', 'md', 'html')
 */
export const detectFileFormat = (fileName) => {
  if (!fileName) return null;
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension || null;
};

/**
 * Obter nome amigável do formato
 * @param {string} format - Formato (ex: 'txt', 'md')
 * @returns {string} Nome amigável
 */
export const getFormatName = (format) => {
  const formatNames = {
    'txt': 'Texto',
    'md': 'Markdown',
    'markdown': 'Markdown',
    'html': 'HTML',
    'htm': 'HTML',
    'json': 'JSON',
    'xml': 'XML',
    'rtf': 'RTF',
    'yaml': 'YAML',
    'yml': 'YAML',
    'ini': 'INI',
    'log': 'Log',
    'js': 'JavaScript',
    'jsx': 'JavaScript',
    'ts': 'TypeScript',
    'tsx': 'TypeScript',
    'css': 'CSS',
  };
  return formatNames[format] || format?.toUpperCase() || 'Desconhecido';
};

/**
 * Extrair título do nome do arquivo (sem extensão)
 * @param {string} fileName - Nome do arquivo
 * @returns {string} Título sem extensão
 */
export const extractTitleFromFileName = (fileName) => {
  if (!fileName) return 'Sem título';
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  return nameWithoutExt || 'Sem título';
};

