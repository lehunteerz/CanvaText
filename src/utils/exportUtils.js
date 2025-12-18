// Importar Turndown para conversão profissional de HTML para Markdown
import TurndownService from 'turndown';

// Criar instância do Turndown com configurações otimizadas
const turndownService = new TurndownService({
  headingStyle: 'atx', // Usar # para títulos
  codeBlockStyle: 'fenced', // Usar ``` para blocos de código
  bulletListMarker: '-', // Usar - para listas
  emDelimiter: '*', // Usar * para itálico
  strongDelimiter: '**', // Usar ** para negrito
});

// Adicionar regras customizadas para elementos do Tiptap
turndownService.addRule('strikethrough', {
  filter: ['s', 'del'],
  replacement: (content) => `~~${content}~~`,
});

turndownService.addRule('underline', {
  filter: 'u',
  replacement: (content) => `_${content}_`,
});

turndownService.addRule('taskList', {
  filter: (node) => {
    return node.nodeName === 'UL' && node.classList.contains('task-list');
  },
  replacement: (content) => {
    return content;
  },
});

turndownService.addRule('taskItem', {
  filter: (node) => {
    return node.nodeName === 'LI' && node.classList.contains('task-item');
  },
  replacement: (content, node) => {
    const checkbox = node.querySelector('input[type="checkbox"]');
    const isChecked = checkbox && checkbox.checked;
    return `${isChecked ? '[x]' : '[ ]'} ${content}`;
  },
});

// Função auxiliar para converter HTML para Markdown profissional
const htmlToMarkdown = (html) => {
  if (!html) return '';
  
  try {
    // Usar Turndown para conversão profissional
    return turndownService.turndown(html);
  } catch (error) {
    console.error('Erro ao converter HTML para Markdown:', error);
    // Fallback: retornar texto puro se a conversão falhar
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }
};

// Flag para prevenir múltiplas chamadas simultâneas
let isSaving = false;

// Função de Auto-Save (Shift+S) - Backup automático
export const autoSaveNote = async (editor, noteTitle = 'nota') => {
  if (!editor || !window.electronAPI) {
    console.error('Editor ou Electron API não disponível');
    return { success: false, error: 'Editor ou Electron API não disponível' };
  }

  // Prevenir múltiplas chamadas simultâneas
  if (isSaving) {
    console.warn('Salvamento já em andamento, ignorando chamada duplicada');
    return { success: false, error: 'Salvamento já em andamento' };
  }

  isSaving = true;

  try {
    // Capturar HTML para visualização rápida
    const htmlContent = editor.getHTML();

    // Garantir que o editor não perde o foco
    const wasFocused = document.activeElement === editor.view.dom;

    const result = await window.electronAPI.autoSaveNote(htmlContent, noteTitle);

    // Restaurar foco se estava focado antes
    if (wasFocused && editor.view.dom) {
      setTimeout(() => {
        try {
          editor.view.dom.focus();
        } catch (e) {
          // Ignorar erros de foco
        }
      }, 0);
    }

    if (result.success) {
      console.log('Backup automático salvo em:', result.filePath);
      return { success: true, filePath: result.filePath };
    } else {
      console.error('Erro ao fazer backup automático:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Erro ao fazer backup automático:', error);
    return { success: false, error: error.message };
  } finally {
    isSaving = false;
  }
};

// Função principal de exportação (com formato específico)
export const exportNote = async (editor, format, defaultName = 'nota') => {
  if (!editor || !window.electronAPI) {
    console.error('Editor ou Electron API não disponível');
    return { success: false, error: 'Editor ou Electron API não disponível' };
  }

  // Prevenir múltiplas chamadas simultâneas
  if (isSaving) {
    console.warn('Exportação já em andamento, ignorando chamada duplicada');
    return { success: false, error: 'Exportação já em andamento' };
  }

  isSaving = true;

  try {
    // Garantir que o editor não perde o foco
    const wasFocused = document.activeElement === editor.view.dom;

    let content = '';
    let fileExtension = '';

    switch (format) {
      case 'html':
        content = editor.getHTML();
        fileExtension = '.html';
        break;
      
      case 'json':
        content = JSON.stringify(editor.getJSON(), null, 2);
        fileExtension = '.json';
        break;
      
      case 'text':
        content = editor.getText();
        fileExtension = '.txt';
        break;
      
      case 'markdown':
        // Converter HTML para Markdown
        const html = editor.getHTML();
        content = htmlToMarkdown(html);
        fileExtension = '.md';
        break;
      
      default:
        console.error('Formato não suportado:', format);
        return { success: false, error: 'Formato não suportado' };
    }

    const result = await window.electronAPI.saveFile({
      content,
      defaultName: `${defaultName}${fileExtension}`,
      format
    });

    // Restaurar foco após dialog (com delay maior)
    if (wasFocused && editor.view.dom) {
      const delay = result.canceled ? 100 : 200;
      setTimeout(() => {
        try {
          editor.view.dom.focus();
        } catch (e) {
          // Ignorar erros de foco
        }
      }, delay);
    }

    if (result.success) {
      return { success: true, filePath: result.filePath };
    } else if (result.canceled) {
      return { canceled: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Erro ao exportar:', error);
    return { success: false, error: error.message };
  } finally {
    isSaving = false;
  }
};

// Função universal de exportação (Ctrl+Shift+S) - envia todos os conteúdos
// Smart Save: Detecta extensão no título e sugere formato automaticamente
export const exportNoteUniversal = async (editor, defaultName = 'nota') => {
  if (!editor || !window.electronAPI) {
    console.error('Editor ou Electron API não disponível');
    return { success: false, error: 'Editor ou Electron API não disponível' };
  }

  // Prevenir múltiplas chamadas simultâneas
  if (isSaving) {
    console.warn('Exportação já em andamento, ignorando chamada duplicada');
    return { success: false, error: 'Exportação já em andamento' };
  }

  isSaving = true;

  try {
    // Garantir que o editor não perde o foco
    const wasFocused = document.activeElement === editor.view.dom;

    // Capturar os três estados do editor Tiptap
    const textContent = editor.getText();
    const htmlContent = editor.getHTML();
    const jsonContent = JSON.stringify(editor.getJSON(), null, 2);

    // Smart Save: Detectar extensão no título
    let suggestedExtension = null;
    const extensionMatch = defaultName.match(/\.([a-zA-Z0-9]+)$/);
    if (extensionMatch) {
      suggestedExtension = extensionMatch[1].toLowerCase();
    }

    const result = await window.electronAPI.manualSaveNote({
      textContent,
      htmlContent,
      jsonContent,
      defaultName: defaultName,
      suggestedExtension: suggestedExtension, // Passar extensão detectada
      format: 'universal' // Indica que é o menu universal
    });

    // Restaurar foco após dialog (com delay maior para garantir que o dialog fechou)
    if (wasFocused && editor.view.dom) {
      const delay = result.canceled ? 100 : 200;
      setTimeout(() => {
        try {
          editor.view.dom.focus();
        } catch (e) {
          // Ignorar erros de foco
        }
      }, delay);
    }

    if (result.success) {
      return { success: true, filePath: result.filePath };
    } else if (result.canceled) {
      return { canceled: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Erro ao exportar:', error);
    return { success: false, error: error.message };
  } finally {
    isSaving = false;
  }
};
