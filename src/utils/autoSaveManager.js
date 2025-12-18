/**
 * Auto-Save Manager
 * Gerencia salvamento automático com debounce para evitar lag durante digitação
 */

// Estado global do auto-save
let saveState = {
  isSaving: false,
  pendingSaves: new Map(), // Map<noteId, {content, timeoutId}>
  listeners: new Set(), // Callbacks para notificar mudanças de estado
};

/**
 * Função de debounce customizada
 * @param {Function} func - Função a ser executada
 * @param {number} delay - Delay em milissegundos
 * @returns {Function} - Função debounced
 */
function debounce(func, delay) {
  let timeoutId = null;
  
  return function debounced(...args) {
    // Limpar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Criar novo timeout
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func.apply(this, args);
    }, delay);
    
    return timeoutId;
  };
}

/**
 * Salva o conteúdo de uma nota no localStorage
 * @param {string} noteId - ID da nota
 * @param {string} content - Conteúdo HTML da nota
 * @param {Array} allNotes - Array completo de notas
 * @returns {Promise<number>} - Tempo de salvamento em ms
 */
async function performSave(noteId, content, allNotes) {
  const startTime = performance.now();
  
  try {
    // Atualizar o estado para indicar que está salvando
    setSavingState(true);
    
    // Atualizar a nota específica no array
    const updatedNotes = allNotes.map(note =>
      note.id === noteId ? { ...note, content } : note
    );
    
    // Salvar no localStorage
    const STORAGE_KEY = 'canvatext-notes';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    
    const saveTime = performance.now() - startTime;
    
    // Log do tempo de salvamento
    console.log(`[Auto-Save] Nota "${noteId.substring(0, 8)}..." salva em ${saveTime.toFixed(2)}ms`);
    
    return saveTime;
  } catch (error) {
    console.error('[Auto-Save] Erro ao salvar nota:', error);
    throw error;
  } finally {
    // Atualizar estado após salvar
    setSavingState(false);
  }
}

/**
 * Atualiza o estado de salvamento e notifica listeners
 * @param {boolean} saving - Se está salvando
 */
function setSavingState(saving) {
  if (saveState.isSaving !== saving) {
    saveState.isSaving = saving;
    // Notificar todos os listeners
    saveState.listeners.forEach(listener => {
      try {
        listener(saving);
      } catch (error) {
        console.error('[Auto-Save] Erro ao notificar listener:', error);
      }
    });
  }
}

/**
 * Cria uma função debounced para salvar uma nota específica
 * @param {string} noteId - ID da nota
 * @param {Function} getAllNotes - Função que retorna todas as notas
 * @returns {Function} - Função para agendar salvamento
 */
function createDebouncedSave(noteId, getAllNotes) {
  let timeoutId = null;
  
  return (content) => {
    // Cancelar save anterior se existir
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Agendar novo save após 1000ms
    timeoutId = setTimeout(async () => {
      try {
        console.log(`[Auto-Save] Executando save para nota "${noteId.substring(0, 8)}..." após debounce`);
        const allNotes = getAllNotes();
        if (!Array.isArray(allNotes)) {
          console.error('[Auto-Save] getAllNotes não retornou um array:', allNotes);
          return;
        }
        await performSave(noteId, content, allNotes);
        
        // Remover do mapa de pendentes após salvar
        saveState.pendingSaves.delete(noteId);
        timeoutId = null;
      } catch (error) {
        console.error(`[Auto-Save] Erro ao salvar nota ${noteId}:`, error);
        saveState.pendingSaves.delete(noteId);
        timeoutId = null;
      }
    }, 1000);
    
    // Armazenar referência do timeout e conteúdo
    saveState.pendingSaves.set(noteId, {
      content,
      timeoutId,
      debouncedFn: null, // Não precisamos mais disso
    });
    
    return timeoutId;
  };
}

/**
 * Auto-Save Manager
 */
export const autoSaveManager = {
  /**
   * Agenda um salvamento debounced para uma nota
   * @param {string} noteId - ID da nota
   * @param {string} content - Conteúdo HTML da nota
   * @param {Function} getAllNotes - Função que retorna todas as notas
   */
  scheduleSave(noteId, content, getAllNotes) {
    if (!noteId || !getAllNotes) {
      console.warn('[Auto-Save] scheduleSave chamado com parâmetros inválidos', { noteId, hasGetAllNotes: !!getAllNotes });
      return;
    }
    
    // Debug: log quando agendando save
    console.log(`[Auto-Save] Agendando save para nota "${noteId.substring(0, 8)}..."`);
    
    // Verificar se já existe uma função debounced para esta nota
    let pending = saveState.pendingSaves.get(noteId);
    
    if (!pending || !pending.debouncedFn) {
      // Criar nova função debounced para esta nota
      const debouncedSaveFn = createDebouncedSave(noteId, getAllNotes);
      pending = {
        content,
        timeoutId: null,
        debouncedFn: debouncedSaveFn,
      };
      saveState.pendingSaves.set(noteId, pending);
      console.log(`[Auto-Save] Criada nova função debounced para nota "${noteId.substring(0, 8)}..."`);
    }
    
    // Agendar save usando a função debounced existente
    pending.debouncedFn(content);
  },
  
  /**
   * Força salvamento imediato de uma nota (sem debounce)
   * @param {string} noteId - ID da nota
   * @param {string} content - Conteúdo HTML da nota
   * @param {Function} getAllNotes - Função que retorna todas as notas
   * @returns {Promise<number>} - Tempo de salvamento em ms
   */
  async forceSave(noteId, content, getAllNotes) {
    if (!noteId || !getAllNotes) {
      console.warn('[Auto-Save] forceSave chamado com parâmetros inválidos');
      return 0;
    }
    
    // Cancelar save pendente se existir
    const pending = saveState.pendingSaves.get(noteId);
    if (pending) {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
      saveState.pendingSaves.delete(noteId);
    }
    
    // Salvar imediatamente
    const allNotes = getAllNotes();
    return await performSave(noteId, content, allNotes);
  },
  
  /**
   * Força salvamento de todas as notas pendentes
   * @param {Function} getAllNotes - Função que retorna todas as notas
   * @returns {Promise<void>}
   */
  async forceSaveAll(getAllNotes) {
    const allNotes = getAllNotes();
    const saves = [];
    
    // Salvar todas as notas pendentes
    for (const [noteId, pending] of saveState.pendingSaves.entries()) {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
      
      const note = allNotes.find(n => n.id === noteId);
      if (note && pending.content !== undefined) {
        saves.push(performSave(noteId, pending.content, allNotes));
      }
    }
    
    // Limpar mapa de pendentes
    saveState.pendingSaves.clear();
    
    // Aguardar todos os saves completarem
    await Promise.all(saves);
  },
  
  /**
   * Verifica se há salvamentos pendentes
   * @returns {boolean}
   */
  hasPendingSaves() {
    return saveState.pendingSaves.size > 0;
  },
  
  /**
   * Verifica se está salvando no momento
   * @returns {boolean}
   */
  isSaving() {
    return saveState.isSaving;
  },
  
  /**
   * Adiciona um listener para mudanças no estado de salvamento
   * @param {Function} listener - Callback(isSaving: boolean) => void
   * @returns {Function} - Função para remover o listener
   */
  onSavingStateChange(listener) {
    if (typeof listener !== 'function') {
      console.warn('[Auto-Save] Listener deve ser uma função');
      return () => {};
    }
    
    saveState.listeners.add(listener);
    
    // Retornar função de cleanup
    return () => {
      saveState.listeners.delete(listener);
    };
  },
  
  /**
   * Limpa todos os saves pendentes (útil para cleanup)
   */
  clearPendingSaves() {
    for (const pending of saveState.pendingSaves.values()) {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
    }
    saveState.pendingSaves.clear();
  },
};

