import { useState, useEffect, useRef } from 'react';
import { autoSaveManager } from '../utils/autoSaveManager';

const STORAGE_KEY = 'canvatext-notes';

// Função para ler notas do localStorage
const loadNotesFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Erro ao carregar notas do localStorage:', error);
  }
  return [];
};

// Função para salvar notas no localStorage
const saveNotesToStorage = (notes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Erro ao salvar notas no localStorage:', error);
  }
};

export const useNotes = () => {
  const [notes, setNotes] = useState(() => loadNotesFromStorage());
  
  // Ref para sempre acessar o estado atualizado no autoSaveManager
  const notesRef = useRef(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Salvar no localStorage sempre que o estado mudar (apenas para mudanças não relacionadas a conteúdo)
  // O salvamento de conteúdo é gerenciado pelo autoSaveManager
  useEffect(() => {
    // Não salvar se houver saves pendentes de conteúdo (evitar duplicação)
    if (!autoSaveManager.hasPendingSaves()) {
      saveNotesToStorage(notes);
    }
  }, [notes]);

  // Adicionar nova nota
  const addNote = (initialContent = '', initialTitle = null) => {
    const newNote = {
      id: crypto.randomUUID(),
      x: 100,
      y: 100,
      content: initialContent || '',
      isCollapsed: false,
      title: initialTitle || null, // Título customizado (null = usar título extraído do conteúdo)
      width: 320, // Tamanho padrão
      height: 320, // Tamanho padrão
    };
    setNotes((prevNotes) => [...prevNotes, newNote]);
    return newNote.id; // Retorna o ID para possível uso futuro
  };

  // Atualizar conteúdo da nota com auto-save debounced
  const updateNoteContent = (id, content) => {
    // Atualizar estado imediatamente para UI responsiva
    setNotes((prevNotes) => {
      const updated = prevNotes.map((note) =>
        note.id === id ? { ...note, content } : note
      );
      
      // Agendar salvamento com debounce (1000ms)
      // Passar função que sempre retorna o estado atualizado
      autoSaveManager.scheduleSave(id, content, () => {
        // Sempre retornar o estado mais recente do ref
        return notesRef.current;
      });
      
      return updated;
    });
  };

  // Atualizar posição da nota
  const updateNotePosition = (id, position) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, x: position.x, y: position.y } : note
      )
    );
  };

  // Atualizar estado colapsado da nota
  const updateNoteCollapsed = (id, isCollapsed) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, isCollapsed } : note
      )
    );
  };

  // Atualizar título da nota
  const updateNoteTitle = (id, newTitle) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, title: newTitle || null } : note
      )
    );
  };

  // Atualizar tamanho da nota
  const updateNoteSize = (id, size) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, width: size.width, height: size.height } : note
      )
    );
  };

  // Duplicar nota
  const duplicateNote = (id) => {
    const noteToDuplicate = notes.find(n => n.id === id);
    if (!noteToDuplicate) return null;

    const newNote = {
      id: crypto.randomUUID(),
      x: noteToDuplicate.x + 20,
      y: noteToDuplicate.y + 20,
      content: noteToDuplicate.content,
      isCollapsed: noteToDuplicate.isCollapsed,
      title: noteToDuplicate.title,
      width: noteToDuplicate.width,
      height: noteToDuplicate.height,
    };

    setNotes((prevNotes) => {
      const index = prevNotes.findIndex(n => n.id === id);
      if (index === -1) return [...prevNotes, newNote];
      return [...prevNotes.slice(0, index + 1), newNote, ...prevNotes.slice(index + 1)];
    });

    return newNote.id;
  };

  // Deletar nota (com force save antes de deletar)
  const deleteNote = async (id) => {
    // Forçar salvamento antes de deletar
    const noteToDelete = notesRef.current.find(n => n.id === id);
    if (noteToDelete && noteToDelete.content) {
      try {
        await autoSaveManager.forceSave(id, noteToDelete.content, () => notesRef.current);
        console.log(`[Auto-Save] Nota "${id.substring(0, 8)}..." salva antes de deletar`);
      } catch (error) {
        console.error(`[Auto-Save] Erro ao salvar nota antes de deletar:`, error);
      }
    }
    
    // Deletar a nota
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
  };

  // Reordenar notas (para drag-and-drop nas abas)
  const reorderNotes = (fromIndex, toIndex) => {
    setNotes((prevNotes) => {
      const newNotes = [...prevNotes];
      const [removed] = newNotes.splice(fromIndex, 1);
      newNotes.splice(toIndex, 0, removed);
      return newNotes;
    });
  };

  // Limpar todas as notas (útil para reset)
  const clearAllNotes = () => {
    localStorage.removeItem(STORAGE_KEY);
    setNotes([]);
  };

  // Função helper para forçar save de uma nota específica
  const forceSaveNote = async (id) => {
    const note = notesRef.current.find(n => n.id === id);
    if (note && note.content !== undefined) {
      return await autoSaveManager.forceSave(id, note.content, () => notesRef.current);
    }
    return 0;
  };
  
  // Função helper para forçar save de todas as notas pendentes
  const forceSaveAll = async () => {
    return await autoSaveManager.forceSaveAll(() => notesRef.current);
  };

  return {
    notes,
    addNote,
    updateNoteContent,
    updateNotePosition,
    updateNoteCollapsed,
    updateNoteTitle,
    updateNoteSize,
    duplicateNote,
    deleteNote,
    reorderNotes,
    clearAllNotes,
    forceSaveNote,
    forceSaveAll,
  };
};
