# Configuração de BrowserWindow no Electron

## Configuração Básica: Transparente, Sem Bordas e Sempre no Topo

### Opções Principais

```javascript
mainWindow = new BrowserWindow({
  // 1. SEM BORDAS (Frameless)
  frame: false,  // Remove a barra de título e bordas do sistema
  
  // 2. TRANSPARENTE
  transparent: true,  // Permite que áreas transparentes do HTML sejam visíveis
  
  // 3. SEMPRE NO TOPO
  alwaysOnTop: true,  // Mantém a janela sempre acima de outras janelas
  
  // Outras opções úteis para apps estilo PureRef:
  width: 1200,
  height: 800,
  resizable: true,  // Permite redimensionar (padrão: true)
  minimizable: true,  // Permite minimizar (padrão: true)
  maximizable: true,  // Permite maximizar (padrão: true)
  closable: true,  // Permite fechar (padrão: true)
  
  // Opções de visualização
  backgroundColor: '#00000000',  // Cor de fundo (transparente em hex)
  opacity: 1.0,  // Opacidade da janela (0.0 a 1.0)
  
  // Comportamento
  skipTaskbar: false,  // Se true, não aparece na barra de tarefas
  fullscreenable: true,  // Permite tela cheia (padrão: true)
  show: false,  // Se true, mostra imediatamente (padrão: true)
  
  webPreferences: {
    preload: join(__dirname, 'preload.js'),
    nodeIntegration: false,  // Segurança: não expor Node.js
    contextIsolation: true,  // Segurança: isolar contexto
  },
});
```

## Explicação Detalhada

### 1. `frame: false` (Frameless Window)
- Remove a barra de título padrão do sistema operacional
- Remove os botões de controle (minimizar, maximizar, fechar)
- Remove as bordas da janela
- Você precisa criar controles customizados se quiser essas funcionalidades

### 2. `transparent: true` (Janela Transparente)
- Permite que áreas com `background: transparent` no CSS sejam realmente transparentes
- Você pode ver através da janela onde não há conteúdo
- Útil para criar efeitos de overlay ou apps flutuantes
- **Importante**: No CSS, use `background: transparent` ou `rgba()` com alpha

### 3. `alwaysOnTop: true` (Sempre no Topo)
- A janela sempre fica acima de outras janelas
- Útil para apps de referência, notas, ou ferramentas auxiliares
- Pode ser alternado dinamicamente com `mainWindow.setAlwaysOnTop(true/false)`

## Opções Adicionais Úteis

### Controle de Visibilidade
```javascript
// Mostrar janela após carregar (evita flash de conteúdo não estilizado)
mainWindow.once('ready-to-show', () => {
  mainWindow.show();
});
```

### Níveis de AlwaysOnTop (macOS e Linux)
```javascript
alwaysOnTop: true,
// Níveis disponíveis: 'normal', 'floating', 'tornado-menu', 'modal-panel', 
// 'main-menu', 'status', 'pop-up-menu', 'screen-saver'
```

### Vibração/Desfoque (Windows)
```javascript
vibrancy: 'ultra-dark',  // macOS: efeito de vibração
// Windows não suporta vibrancy, mas pode usar backgroundColor
```

## Exemplo Completo Otimizado

```javascript
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    backgroundColor: '#00000000',  // Transparente em hex
    show: false,  // Não mostrar até estar pronto
    resizable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Carregar conteúdo
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(join(__dirname, 'dist/index.html'));
  }

  // Mostrar apenas quando estiver pronto (evita flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}
```

## Dicas Importantes

1. **Performance**: Janelas transparentes podem ter impacto na performance, especialmente com animações
2. **CSS**: Use `background: transparent` ou `rgba()` com valores de alpha para transparência
3. **Arrastar Janela**: Use `-webkit-app-region: drag` no CSS para áreas arrastáveis
4. **Click-through**: Use `setIgnoreMouseEvents(true)` para permitir cliques através da janela em áreas vazias
5. **Segurança**: Sempre use `nodeIntegration: false` e `contextIsolation: true`

## Referências

- [Documentação Electron - BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window)
- [Opções de BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions)

