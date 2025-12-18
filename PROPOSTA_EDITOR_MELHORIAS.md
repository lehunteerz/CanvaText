# 🎨 Proposta de Melhorias - Modo Editor

## 📋 Resumo das Requisições

### 1. **Painel de Configuração** (Imagem 1: "Na tela normal")
- Contorno (Outline) - seleção de cores
- Fundo (Background) - seleção de cores + botão para abrir color picker
- Espessura do traço (Stroke thickness) - 3 opções
- Opacidade (Opacity) - slider 0-100%
- Camadas (Layers) - botões para gerenciar ordem

### 2. **Menu de Contexto no Elemento** (Imagem 2: "Botão direito no elemento")
- Fundo (Background) - cores + color picker
- Espessura do traço
- Opacidade
- Camadas (gerenciar ordem)
- Ações (Duplicar, Apagar, Link)

### 3. **Menu de Contexto Geral** (Imagem 3: Menu completo)
- Recortar, Copiar, Colar
- Selecionar todos / Remover todos
- Exportar (PNG, SVG)
- Copiar/Colar estilos
- Adicionar à biblioteca
- Gerenciar camadas (Enviar para trás, Trazer para frente, etc.)
- Transformações (Inverter horizontal/vertical)
- Link
- Duplicar
- Bloquear
- Apagar

---

## 🏗️ Arquitetura Proposta

### **Abordagem 1: Componentes Separados (RECOMENDADA)**

#### Estrutura:
```
src/components/drawing/
├── DrawingPropertiesPanel.jsx      # Painel lateral de configuração (sempre visível)
├── ElementContextMenu.jsx          # Menu ao clicar direito no elemento
├── DrawingContextMenu.jsx          # Menu geral ao clicar direito no canvas
├── ColorPicker.jsx                  # Componente de seleção de cor avançada
├── StrokeThicknessSelector.jsx      # Seletor de espessura
└── LayerManager.jsx                # Gerenciador de camadas
```

#### Vantagens:
- ✅ Separação clara de responsabilidades
- ✅ Fácil manutenção e testes
- ✅ Reutilização de componentes
- ✅ Performance (lazy loading possível)

#### Desvantagens:
- ⚠️ Mais arquivos para gerenciar

---

### **Abordagem 2: Componente Único com Tabs**

#### Estrutura:
```
src/components/drawing/
└── DrawingControlPanel.jsx         # Painel único com todas as funcionalidades
```

#### Vantagens:
- ✅ Tudo em um lugar
- ✅ Menos arquivos

#### Desvantagens:
- ❌ Componente muito grande (>1000 linhas)
- ❌ Difícil manutenção
- ❌ Re-renders desnecessários

---

## 🎯 Abordagem Recomendada: **Abordagem 1 (Componentes Separados)**

---

## 📦 Componentes Detalhados

### 1. **DrawingPropertiesPanel.jsx**
**Localização:** Painel lateral esquerdo (fixo)
**Estado:** Sempre visível quando em modo desenho
**Funcionalidades:**
- Contorno: Grid de cores pré-definidas
- Fundo: Grid de cores + botão que abre ColorPicker
- Espessura: 3 botões (fino, médio, grosso)
- Opacidade: Slider com valor numérico
- Camadas: 4 botões (baixar, subir, trazer frente, enviar trás)

**Props:**
```javascript
{
  selectedElementId: string | null,
  defaultStyle: { stroke, fill, strokeWidth, opacity },
  onStyleChange: (style) => void,
  onLayerAction: (action) => void
}
```

---

### 2. **ElementContextMenu.jsx**
**Localização:** Posição dinâmica (onde clicou direito)
**Estado:** Aparece ao clicar direito em elemento selecionado
**Funcionalidades:**
- Fundo (cores rápidas + color picker)
- Espessura do traço
- Opacidade
- Camadas
- Ações (Duplicar, Apagar, Link)

**Props:**
```javascript
{
  element: Element,
  position: { x, y },
  onClose: () => void,
  onStyleChange: (style) => void,
  onDuplicate: () => void,
  onDelete: () => void,
  onLink: () => void,
  onLayerAction: (action) => void
}
```

---

### 3. **DrawingContextMenu.jsx**
**Localização:** Posição dinâmica (onde clicou direito)
**Estado:** Aparece ao clicar direito no canvas (sem elemento selecionado)
**Funcionalidades:**
- **Edição básica:** Recortar, Copiar, Colar
- **Seleção:** Selecionar todos, Remover todos
- **Exportação:** PNG, SVG
- **Estilos:** Copiar estilos, Colar estilos
- **Biblioteca:** Adicionar à biblioteca
- **Camadas:** Enviar para trás, Trazer para frente, etc.
- **Transformações:** Inverter horizontal/vertical
- **Link:** Adicionar link, Copiar link
- **Ações:** Duplicar, Bloquear, Apagar

**Props:**
```javascript
{
  position: { x, y },
  selectedElements: Element[],
  onClose: () => void,
  onAction: (action, data) => void
}
```

---

### 4. **ColorPicker.jsx**
**Localização:** Modal/Portal (sobrepõe tudo)
**Estado:** Abre ao clicar no botão de color picker
**Funcionalidades:**
- Gradiente de cores (quadrado grande)
- Slider de matiz (Hue)
- Slider de opacidade
- Input HEX
- Botão de copiar
- Botões de ação (cancelar, aplicar)

**Props:**
```javascript
{
  initialColor: string,
  onColorChange: (color) => void,
  onClose: () => void
}
```

---

## 🔧 Implementação Técnica

### **Gerenciamento de Estado**

#### Opção A: Context API (Atual)
```javascript
// DrawingContext.jsx - Expandir
{
  // ... estado atual
  defaultStyle: { stroke, fill, strokeWidth, opacity },
  setDefaultStyle: (style) => void,
  clipboard: { elements, styles },
  setClipboard: (data) => void,
  lockedElements: string[],
  toggleLock: (id) => void
}
```

#### Opção B: Zustand Store (Recomendado para futuro)
```javascript
// stores/drawingStore.js
{
  elements: [],
  selectedElements: [],
  defaultStyle: {},
  clipboard: {},
  lockedElements: [],
  // ... actions
}
```

**Recomendação:** Manter Context API por enquanto, mas estruturar para migração futura.

---

### **Estrutura de Dados do Elemento**

```javascript
{
  id: string,
  type: 'rectangle' | 'circle' | 'diamond' | 'line' | 'pencil' | 'frame',
  x: number,
  y: number,
  width: number,
  height: number,
  style: {
    stroke: string,        // Cor do contorno
    fill: string,          // Cor do fundo
    strokeWidth: number,   // Espessura (1, 2, 3)
    opacity: number,       // 0-100
  },
  zIndex: number,          // Ordem de camadas
  locked: boolean,         // Elemento bloqueado
  link: string | null,      // Link do elemento
  frameId: string | null,  // Frame pai (se houver)
  path?: Point[],          // Para lápis
  title?: string,          // Para frames
}
```

---

### **Ações do Menu de Contexto**

#### 1. **Edição Básica**
```javascript
// Recortar
cutElement(id) {
  copyElement(id);
  deleteElement(id);
}

// Copiar
copyElement(id) {
  const element = findElement(id);
  setClipboard({ type: 'element', data: element });
}

// Colar
pasteElement() {
  const { data } = clipboard;
  const newElement = { ...data, id: generateId(), x: x + 10, y: y + 10 };
  addElement(newElement);
}
```

#### 2. **Seleção**
```javascript
selectAllElements() {
  setSelectedElementIds(elements.map(el => el.id));
}

removeAllElements() {
  setElements([]);
  saveToHistory([]);
}
```

#### 3. **Exportação**
```javascript
// Já existe em exportCanvas.js
copyAsPNG() {
  exportCanvasAsPNG(canvas, 'clipboard');
}

copyAsSVG() {
  exportCanvasAsSVG(canvas, 'clipboard');
}
```

#### 4. **Estilos**
```javascript
copyStyles(id) {
  const element = findElement(id);
  setClipboard({ type: 'styles', data: element.style });
}

pasteStyles(id) {
  const { data } = clipboard;
  if (clipboard.type === 'styles') {
    updateElement(id, { style: data });
  }
}
```

#### 5. **Camadas**
```javascript
sendToBack(id) {
  const element = findElement(id);
  const minZ = Math.min(...elements.map(el => el.zIndex || 0));
  updateElement(id, { zIndex: minZ - 1 });
}

bringToFront(id) {
  const element = findElement(id);
  const maxZ = Math.max(...elements.map(el => el.zIndex || 0));
  updateElement(id, { zIndex: maxZ + 1 });
}

sendBackward(id) {
  updateElement(id, { zIndex: (element.zIndex || 0) - 1 });
}

bringForward(id) {
  updateElement(id, { zIndex: (element.zIndex || 0) + 1 });
}
```

#### 6. **Transformações**
```javascript
flipHorizontal(id) {
  // Para elementos com width/height, inverter coordenadas
  const element = findElement(id);
  // Lógica de inversão
}

flipVertical(id) {
  // Similar ao horizontal
}
```

#### 7. **Link**
```javascript
addLink(id, url) {
  updateElement(id, { link: url });
}

copyLink(id) {
  const element = findElement(id);
  navigator.clipboard.writeText(element.link);
}
```

#### 8. **Bloquear**
```javascript
toggleLock(id) {
  const element = findElement(id);
  updateElement(id, { locked: !element.locked });
}
```

---

## 🎨 Paleta de Cores Padrão

### Contorno (Outline):
```javascript
const OUTLINE_COLORS = [
  '#000000', // Preto
  '#EF4444', // Vermelho
  '#10B981', // Verde
  '#3B82F6', // Azul
  '#F59E0B', // Laranja
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
];
```

### Fundo (Background):
```javascript
const BACKGROUND_COLORS = [
  'transparent', // Transparente (padrão)
  '#FEE2E2', // Rosa claro
  '#D1FAE5', // Verde claro
  '#DBEAFE', // Azul claro
  '#FEF3C7', // Amarelo claro
  '#E9D5FF', // Roxo claro
  '#FCE7F3', // Rosa claro
];
```

---

## 📝 Ordem de Implementação Sugerida

### **Fase 1: Fundação** (1-2 horas)
1. ✅ Criar estrutura de pastas `src/components/drawing/`
2. ✅ Expandir `DrawingContext` com novos estados
3. ✅ Atualizar estrutura de dados dos elementos

### **Fase 2: Painel de Propriedades** (2-3 horas)
1. ✅ Criar `DrawingPropertiesPanel.jsx`
2. ✅ Implementar seleção de cores (Contorno e Fundo)
3. ✅ Implementar seletor de espessura
4. ✅ Implementar slider de opacidade
5. ✅ Implementar controles de camadas

### **Fase 3: Color Picker** (2-3 horas)
1. ✅ Criar `ColorPicker.jsx`
2. ✅ Implementar gradiente de cores
3. ✅ Implementar sliders (Hue, Opacidade)
4. ✅ Implementar input HEX
5. ✅ Integrar com painel de propriedades

### **Fase 4: Menu de Contexto no Elemento** (2-3 horas)
1. ✅ Criar `ElementContextMenu.jsx`
2. ✅ Implementar posicionamento dinâmico
3. ✅ Integrar com ações existentes
4. ✅ Adicionar handler de botão direito no DrawingCanvas

### **Fase 5: Menu de Contexto Geral** (3-4 horas)
1. ✅ Criar `DrawingContextMenu.jsx`
2. ✅ Implementar todas as ações do menu
3. ✅ Adicionar atalhos de teclado
4. ✅ Integrar com clipboard
5. ✅ Implementar transformações

### **Fase 6: Integração e Testes** (1-2 horas)
1. ✅ Testar todas as funcionalidades
2. ✅ Ajustar posicionamento de menus
3. ✅ Verificar performance
4. ✅ Corrigir bugs

**Tempo Total Estimado:** 11-17 horas

---

## 🚀 Próximos Passos

1. **Aprovar arquitetura proposta**
2. **Definir ordem de implementação**
3. **Começar pela Fase 1**

---

## 💡 Observações Importantes

### **Performance:**
- Usar `React.memo` nos componentes de menu
- Lazy loading do ColorPicker
- Debounce em sliders de opacidade

### **Acessibilidade:**
- Atalhos de teclado para todas as ações
- Suporte a leitores de tela
- Navegação por teclado nos menus

### **UX:**
- Feedback visual em todas as ações
- Animações suaves
- Tooltips informativos

---

**Aguardando aprovação para começar implementação! 🎨**

