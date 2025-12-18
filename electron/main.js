import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import { writeFileSync, readFileSync, promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manter referência global da janela
let mainWindow;

// Caminho fixo para salvamento automático
const SAVE_DIR = join(app.getPath('documents'), 'CanvaText saved');

// Função de segurança: Garantir que o diretório existe
async function ensureDirectoryExists() {
  try {
    await fs.mkdir(SAVE_DIR, { recursive: true });
    console.log('Diretório de backup verificado/criado:', SAVE_DIR);
  } catch (error) {
    console.error('Erro ao criar diretório de backup:', error);
    throw error;
  }
}

// Handlers IPC para controle da janela (devem ser registrados antes de criar a janela)
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    // Fechar completamente em todas as plataformas
    mainWindow.close();
  }
});

ipcMain.handle('window-toggle-always-on-top', () => {
  if (mainWindow) {
    const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
    const newState = !isAlwaysOnTop;
    
    if (newState) {
      // Ativar: usar nível 'status' para maior prioridade no Windows
      if (process.platform === 'win32') {
        mainWindow.setAlwaysOnTop(true, 'status');
      } else {
        mainWindow.setAlwaysOnTop(true);
      }
      // O atraso de 50ms é vital para o 'alwaysOnTop' estabilizar no Windows
      // Sem este delay, o Windows pode roubar o foco antes do alwaysOnTop ser aplicado
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
        }
      }, 50);
    } else {
      // Desativar: apenas definir como false
      mainWindow.setAlwaysOnTop(false);
    }
    
    // ESSENCIAL: Retornar o novo estado para o componente React (TitleBar.jsx)
    return newState;
  }
  return false;
});

ipcMain.handle('window-get-always-on-top', () => {
  if (mainWindow) {
    return mainWindow.isAlwaysOnTop();
  }
  return false;
});

// Handler para Auto-Save (Ctrl+S e Shift+S) - Backup automático
ipcMain.handle('auto-save-note', async (event, { content, title }) => {
  try {
    await ensureDirectoryExists(); // Garante que a pasta existe

    const sanitizedTitle = title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'untitled';
    const fileName = `${randomUUID()}-${sanitizedTitle}.html`;
    const filePath = join(SAVE_DIR, fileName);

    writeFileSync(filePath, content, 'utf-8');
    console.log('Auto-salvo com sucesso:', filePath);
    return { success: true, filePath };
  } catch (error) {
    console.error('Erro ao auto-salvar arquivo:', error);
    return { success: false, error: error.message };
  }
});

// Handler para Manual Save (Ctrl+Shift+S) - Exportar com dialog
ipcMain.handle('manual-save-note', async (event, { textContent, htmlContent, jsonContent, defaultName, format, suggestedExtension }) => {
  try {
    // Lista extensa de filtros para o "Menu Supremo de Salvamento"
    const filters = [
      { name: 'Texto Puro', extensions: ['txt'] },
      { name: 'Markdown', extensions: ['md', 'markdown'] },
      { name: 'HTML Webpage', extensions: ['html', 'htm'] },
      { name: 'JSON Data', extensions: ['json'] },
      { name: 'XML Document', extensions: ['xml'] },
      { name: 'Rich Text Format', extensions: ['rtf'] },
      { name: 'YAML Config', extensions: ['yaml', 'yml'] },
      { name: 'INI Config', extensions: ['ini'] },
      { name: 'Log File', extensions: ['log'] },
      { name: 'Javascript', extensions: ['js', 'jsx'] },
      { name: 'Typescript', extensions: ['ts', 'tsx'] },
      { name: 'CSS Style', extensions: ['css'] },
      { name: 'All Files', extensions: ['*'] }
    ];

    // Smart Save: Se houver extensão sugerida, ajustar filtro padrão
    let defaultFilterIndex = filters.length - 1; // Padrão: All Files
    if (suggestedExtension) {
      const filterIndex = filters.findIndex(f => 
        f.extensions.some(ext => ext === suggestedExtension)
      );
      if (filterIndex !== -1) {
        defaultFilterIndex = filterIndex;
      }
    }

    const dialogOptions = {
      title: 'Salvar arquivo',
      defaultPath: defaultName || 'nota',
      filters: filters,
      properties: ['createDirectory']
    };

    // Se houver extensão sugerida, definir o filtro padrão
    if (suggestedExtension && defaultFilterIndex < filters.length - 1) {
      dialogOptions.filters = [
        filters[defaultFilterIndex], // Colocar o filtro sugerido primeiro
        ...filters.filter((_, i) => i !== defaultFilterIndex)
      ];
    }

    const result = await dialog.showSaveDialog(mainWindow, dialogOptions);

    if (result.canceled) {
      return { canceled: true };
    }

    // Determinar o conteúdo baseado na extensão do arquivo escolhido
    const filePath = result.filePath;
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    let contentToSave = textContent || ''; // Padrão: texto puro

    // Lógica inteligente de salvamento baseada na extensão
    if (extension === 'json') {
      contentToSave = jsonContent || JSON.stringify({}, null, 2);
    } else if (extension === 'html' || extension === 'htm') {
      contentToSave = htmlContent || textContent || '';
    } else if (extension === 'xml') {
      // Converter HTML para XML básico
      const html = htmlContent || textContent || '';
      // XML básico - envolver em estrutura simples
      const escapedContent = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      contentToSave = `<?xml version="1.0" encoding="UTF-8"?>\n<document>\n  <content>${escapedContent}</content>\n</document>`;
    } else if (extension === 'rtf') {
      // RTF básico - texto puro com formatação mínima
      const text = textContent || '';
      // Escapar caracteres especiais do RTF
      const escapedText = text
        .replace(/\\/g, '\\\\')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}');
      contentToSave = `{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24 ${escapedText}}`;
    } else {
      // Para todos os outros formatos (.txt, .md, .js, .ts, .css, .log, .ini, .yaml, etc.)
      // Salvar como texto puro
      contentToSave = textContent || '';
    }

    // Salvar o arquivo
    writeFileSync(filePath, contentToSave, 'utf-8');
    
    return { success: true, filePath: filePath };
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    return { success: false, error: error.message };
  }
});

// Handler para abrir arquivo
ipcMain.handle('open-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Abrir arquivo',
      filters: [
        { name: 'Texto Puro', extensions: ['txt'] },
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'HTML Webpage', extensions: ['html', 'htm'] },
        { name: 'JSON Data', extensions: ['json'] },
        { name: 'XML Document', extensions: ['xml'] },
        { name: 'Rich Text Format', extensions: ['rtf'] },
        { name: 'YAML Config', extensions: ['yaml', 'yml'] },
        { name: 'INI Config', extensions: ['ini'] },
        { name: 'Log File', extensions: ['log'] },
        { name: 'Javascript', extensions: ['js', 'jsx'] },
        { name: 'Typescript', extensions: ['ts', 'tsx'] },
        { name: 'CSS Style', extensions: ['css'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];
    const fileName = filePath.split(/[/\\]/).pop();
    const extension = fileName.split('.').pop()?.toLowerCase();

    // Ler conteúdo do arquivo
    let content = readFileSync(filePath, 'utf-8');
    let htmlContent = content;

    // Converter para HTML se necessário
    if (extension === 'html' || extension === 'htm') {
      // Já é HTML
      htmlContent = content;
    } else if (extension === 'md' || extension === 'markdown') {
      // Markdown - converter para HTML usando biblioteca marked (profissional)
      try {
        // Configurar marked para gerar HTML compatível com Tiptap
        marked.setOptions({
          breaks: true, // Converter quebras de linha em <br>
          gfm: true, // Habilitar GitHub Flavored Markdown
        });
        htmlContent = marked.parse(content);
      } catch (error) {
        console.error('Erro ao converter Markdown:', error);
        // Fallback: converter básico
        htmlContent = content
          .split('\n')
          .map(line => {
            if (line.startsWith('# ')) {
              return `<h1>${line.substring(2)}</h1>`;
            } else if (line.startsWith('## ')) {
              return `<h2>${line.substring(3)}</h2>`;
            } else if (line.trim() === '') {
              return '<p><br></p>';
            } else {
              return `<p>${line}</p>`;
            }
          })
          .join('');
      }
    } else if (extension === 'json') {
      // JSON - formatar e mostrar como código
      try {
        const json = JSON.parse(content);
        content = JSON.stringify(json, null, 2);
        htmlContent = `<pre><code>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
      } catch (e) {
        htmlContent = `<p>${content}</p>`;
      }
    } else {
      // Texto puro - converter quebras de linha para parágrafos
      htmlContent = content
        .split('\n')
        .map(line => line.trim() === '' ? '<p><br></p>' : `<p>${line}</p>`)
        .join('');
    }

    return {
      success: true,
      fileName,
      filePath,
      content: htmlContent,
      textContent: content,
      extension,
    };
  } catch (error) {
    console.error('Erro ao abrir arquivo:', error);
    return { success: false, error: error.message };
  }
});

// Handler para listar arquivos salvos
ipcMain.handle('list-saved-files', async () => {
  try {
    await ensureDirectoryExists();
    const files = await fs.readdir(SAVE_DIR);
    
    const fileList = await Promise.all(
      files.map(async (fileName) => {
        const filePath = join(SAVE_DIR, fileName);
        try {
          const stats = await fs.stat(filePath);
          return {
            fileName,
            filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
          };
        } catch (error) {
          console.error(`Erro ao obter stats do arquivo ${fileName}:`, error);
          return null;
        }
      })
    );

    // Filtrar nulls e ordenar por data de modificação (mais recentes primeiro)
    const validFiles = fileList
      .filter(file => file !== null)
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

    return { success: true, files: validFiles };
  } catch (error) {
    console.error('Erro ao listar arquivos salvos:', error);
    return { success: false, error: error.message, files: [] };
  }
});

// Handler para deletar arquivo salvo
ipcMain.handle('delete-saved-file', async (event, fileName) => {
  try {
    const filePath = join(SAVE_DIR, fileName);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return { success: false, error: error.message };
  }
});

// Handler para renomear arquivo salvo
ipcMain.handle('rename-saved-file', async (event, { oldFileName, newFileName }) => {
  try {
    const oldPath = join(SAVE_DIR, oldFileName);
    const newPath = join(SAVE_DIR, newFileName);
    
    // Verificar se o novo nome já existe
    try {
      await fs.access(newPath);
      return { success: false, error: 'Já existe um arquivo com esse nome' };
    } catch {
      // Arquivo não existe, pode renomear
    }
    
    await fs.rename(oldPath, newPath);
    return { success: true, newFileName };
  } catch (error) {
    console.error('Erro ao renomear arquivo:', error);
    return { success: false, error: error.message };
  }
});

function createWindow() {
  // Criar a janela do navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Sem bordas padrão do Windows/Mac (frameless)
    titleBarStyle: 'hidden', // Esconder barra de título no macOS
    transparent: false, // Fundo opaco
    alwaysOnTop: false, // Começar sem fixar (usuário pode ativar)
    backgroundColor: '#1a1a1a', // Fundo escuro opaco
    show: false, // Não mostrar até estar pronto (evita flash de conteúdo não estilizado)
    skipTaskbar: false, // IMPORTANTE: Garantir que aparece na barra de tarefas
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'), // .cjs para CommonJS (compatível com "type": "module")
      nodeIntegration: false, // Segurança: não expor Node.js ao renderer
      contextIsolation: true, // Segurança: isolar contexto
      sandbox: false, // Necessário para algumas funcionalidades do Electron
    },
  });

  // Carregar a aplicação
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // Em desenvolvimento, carregar do servidor Vite
    mainWindow.loadURL('http://localhost:5173');
    // Abrir DevTools em desenvolvimento
    mainWindow.webContents.openDevTools();
  } else {
    // Em produção, carregar do build
    // No electron-builder, os arquivos estão em app.asar
    // O __dirname aponta para resources/app.asar/electron/ em produção
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  // Mostrar janela apenas quando estiver pronta (evita flash de conteúdo não estilizado)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handler para quando a janela é minimizada e depois clicada na barra de tarefas
  mainWindow.on('minimize', () => {
    // Salvar estado de minimizado
  });

  // Handler específico para quando a janela é restaurada
  mainWindow.on('restore', () => {
    mainWindow.focus();
  });

  // Handler para quando a janela perde o foco mas não é minimizada
  mainWindow.on('blur', () => {
    // Não fazer nada - permite que outras janelas sejam focadas
  });
}

// Este método será chamado quando o Electron terminar de inicializar
app.whenReady().then(async () => {
  // Garantir que o diretório de backup existe na inicialização
  await ensureDirectoryExists();
  createWindow();

  // Handler para macOS - recriar janela quando o ícone do dock é clicado
  // No Windows, também pode ser útil em alguns casos
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      // Se a janela existe mas está minimizada ou oculta, restaurá-la
      if (mainWindow.isMinimized()) {
        mainWindow.restore(); // 1. Restaura (se estava minimizada)
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show(); // 2. Mostra (se estava oculta)
      }
      // 3. Força o foco com um pequeno delay, que o Windows adora para frameless windows
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
        }
      }, 50);
    }
  });
});

// Handler para Windows - quando o ícone da barra de tarefas é clicado
// Garantir que apenas uma instância do app esteja rodando
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Se já existe uma instância, focar nela e sair
  app.quit();
} else {
  // Handler para quando uma segunda instância tenta abrir
  // No Windows, também pode ser disparado em alguns casos quando o usuário interage com o app
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore(); // 1. Restaura (se estava minimizada)
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show(); // 2. Mostra (se estava oculta)
      }
      // 3. Força o foco com um pequeno delay, que o Windows adora para frameless windows
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
        }
      }, 50);
    } else {
      // Se a janela não existe, criar uma nova
      createWindow();
    }
  });

}

// Sair quando todas as janelas estiverem fechadas
app.on('window-all-closed', () => {
  // No macOS, manter o app rodando mesmo sem janelas (padrão do macOS)
  // No Windows e Linux, fechar completamente o app
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
