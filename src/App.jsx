import { useState, useCallback, useEffect, useRef } from 'react';
import NoteCanvas from './components/NoteCanvas';
import TabbedView from './components/TabbedView';
import EditorView from './components/EditorView';
import StartScreen from './components/StartScreen';
import TitleBar from './components/TitleBar';
import ShortcutsHelp from './components/ShortcutsHelp';
import SearchModal from './components/SearchModal';
import DownloadsHistoryModal from './components/DownloadsHistoryModal';
import { Trash2 } from 'lucide-react';
import { useNotes } from './hooks/useNotes';
import { useNoteShortcuts, useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { pluginManager } from './plugins/core/PluginManager';
import { WordCounterPlugin } from './plugins/examples/word-counter/WordCounterPlugin';
import { useToastContext } from './contexts/ToastContext';

function App() {
  const [isDraggingAnyNote, setIsDraggingAnyNote] = useState(false);
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas', 'tabs' ou 'editor'
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDownloadsModal, setShowDownloadsModal] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [openFileHandler, setOpenFileHandler] = useState(null);
  const openFileHandlerRef = useRef(null);
  const notesState = useNotes();
  const toast = useToastContext();

  // Inicializar sistema de plugins
  useEffect(() => {
    // Registrar plugins
    pluginManager.register(new WordCounterPlugin());
    
    // Atualizar contexto do plugin manager
    pluginManager.updateContext({
      notes: notesState,
      app: { viewMode, setViewMode },
      toast,
    });

    // Ativar plugins
    pluginManager.activate('word-counter');

    // Log apenas em produção
    if (process.env.NODE_ENV === 'production') {
      console.log('🔌 Sistema de plugins inicializado');
    }
  }, []); // Apenas na montagem

  // Atualizar contexto quando estado mudar
  useEffect(() => {
    pluginManager.updateContext({
      notes: notesState,
      app: { viewMode, setViewMode },
      toast,
    });
  }, [notesState, viewMode, toast]);

  // Handler para abrir arquivo (será passado para os componentes)
  // Usar ref para evitar chamadas automáticas
  useEffect(() => {
    openFileHandlerRef.current = openFileHandler;
  }, [openFileHandler]);

  const handleOpenFileGlobal = useCallback(() => {
    // Só executar se for uma chamada explícita (não automática)
    if (openFileHandlerRef.current) {
      openFileHandlerRef.current();
    }
  }, []);

  // Ativar atalhos globais de notas
  useNoteShortcuts(notesState, viewMode, setViewMode, setShowSearchModal, handleOpenFileGlobal);
  
  // Atalho para mostrar ajuda (Ctrl+Space)
  useKeyboardShortcuts({
    'Ctrl+ ': (e) => {
      e.preventDefault();
      setShowShortcutsHelp(true);
    },
    'Escape': (e) => {
      if (showShortcutsHelp) {
        e.preventDefault();
        setShowShortcutsHelp(false);
      } else if (showSearchModal) {
        e.preventDefault();
        setShowSearchModal(false);
      } else if (showDownloadsModal) {
        e.preventDefault();
        setShowDownloadsModal(false);
      }
    },
  }, true);

  // Handler para selecionar nota da busca
  const handleSelectNote = useCallback((noteId) => {
    setSelectedNoteId(noteId);
    // Se estiver em modo tabs, mudar para a aba da nota
    if (viewMode === 'tabs') {
      // O TabbedView vai lidar com isso via prop
    }
  }, [viewMode]);

  const handleNoteSelected = useCallback(() => {
    setSelectedNoteId(null);
  }, []);

  // Zero State: Variável derivada baseada no número de notas
  const isAppEmpty = notesState.notes.length === 0;

  const handleStartClick = useCallback(() => {
    // Adiciona uma nota automaticamente ao iniciar
    // A tela inicial vai sumir automaticamente quando isAppEmpty virar false
    notesState.addNote();
  }, [notesState]);

  const handleOpenEditor = useCallback(() => {
    // Mudar para o modo editor - Editor é independente e pode abrir sem notas
    setViewMode('editor');
  }, []);

  const handleOpenDownloads = useCallback(() => {
    setShowDownloadsModal(true);
  }, []);

  const handleCloseDownloads = useCallback(() => {
    setShowDownloadsModal(false);
  }, []);

  const handleReset = useCallback(() => {
    if (confirm('Tem certeza que deseja limpar todas as notas? Esta ação não pode ser desfeita.')) {
      notesState.clearAllNotes();
      // Se estiver no modo editor, manter no editor (independente)
      if (viewMode !== 'editor') {
      // A tela inicial vai aparecer automaticamente quando isAppEmpty virar true
      }
    }
  }, [notesState, viewMode]);

  const handleShowShortcuts = useCallback(() => {
    setShowShortcutsHelp(true);
  }, []);

  const handleCloseShortcuts = useCallback(() => {
    setShowShortcutsHelp(false);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setShowSearchModal(false);
  }, []);

  // Se estiver no modo Editor, sempre mostrar o Editor (independente de ter notas ou não)
  if (viewMode === 'editor') {
    return (
      <div className="w-full h-screen relative bg-neutral-950 flex flex-col transition-colors duration-300">
        <TitleBar 
          viewMode={viewMode} 
          setViewMode={setViewMode}
          onShowShortcuts={handleShowShortcuts}
        />
        <div className="flex-1 overflow-hidden pt-10">
          <EditorView />
        </div>
        <ShortcutsHelp 
          isOpen={showShortcutsHelp} 
          onClose={handleCloseShortcuts} 
        />
        <SearchModal
          isOpen={showSearchModal}
          onClose={handleCloseSearch}
          notes={notesState.notes}
          onSelectNote={handleSelectNote}
        />
        <DownloadsHistoryModal
          isOpen={showDownloadsModal}
          onClose={handleCloseDownloads}
          onOpenFile={handleOpenFileGlobal}
        />
      </div>
    );
  }

  // Zero State: Renderização condicional baseada no estado vazio (apenas para Canvas e Tabs)
  if (isAppEmpty) {
    return (
      <div className="w-full h-screen relative bg-neutral-900 flex flex-col transition-all duration-300">
        <TitleBar 
          viewMode={viewMode} 
          setViewMode={setViewMode}
          onShowShortcuts={handleShowShortcuts}
        />
        <div className="flex-1 pt-10">
          <StartScreen 
            onStart={handleStartClick} 
            onOpenFile={handleOpenFileGlobal}
            onOpenEditor={handleOpenEditor}
            onOpenDownloads={handleOpenDownloads}
          />
        </div>
        <ShortcutsHelp 
          isOpen={showShortcutsHelp} 
          onClose={handleCloseShortcuts} 
        />
        <SearchModal
          isOpen={showSearchModal}
          onClose={handleCloseSearch}
          notes={notesState.notes}
          onSelectNote={handleSelectNote}
        />
        <DownloadsHistoryModal
          isOpen={showDownloadsModal}
          onClose={handleCloseDownloads}
          onOpenFile={handleOpenFileGlobal}
        />
      </div>
    );
  }

  // Background dinâmico baseado no modo
  const bgClass = viewMode === 'canvas' ? 'bg-transparent' : viewMode === 'editor' ? 'bg-neutral-950' : 'bg-neutral-950';

  return (
    <div className={`w-full h-screen relative ${bgClass} flex flex-col transition-colors duration-300`}>
      <TitleBar 
        viewMode={viewMode} 
        setViewMode={setViewMode}
        onShowShortcuts={handleShowShortcuts}
      />
      <div className="flex-1 overflow-hidden pt-10">
        {viewMode === 'canvas' ? (
          <NoteCanvas 
            notesState={notesState} 
            isDraggingAnyNote={isDraggingAnyNote}
            setIsDraggingAnyNote={setIsDraggingAnyNote}
            selectedNoteId={selectedNoteId}
            onNoteSelected={handleNoteSelected}
            onOpenFileReady={(handler) => {
              // Só atualizar se o handler realmente mudou
              if (handler && handler !== openFileHandler) {
                setOpenFileHandler(() => handler);
              }
            }}
          />
        ) : viewMode === 'tabs' ? (
          <TabbedView 
            notesState={notesState}
            selectedNoteId={selectedNoteId}
            onNoteSelected={handleNoteSelected}
            onOpenFileReady={(handler) => {
              // Só atualizar se o handler realmente mudou
              if (handler && handler !== openFileHandler) {
                setOpenFileHandler(() => handler);
              }
            }}
          />
        ) : (
          <EditorView />
        )}
      </div>

      {/* Zona de Lixeira (Drag to Delete) - Só aparece no modo Canvas */}
      {viewMode === 'canvas' && (
        <div 
          id="trash-zone"
          className={`
            fixed bottom-6 left-6 
            w-14 h-14 
            rounded-full 
            flex items-center justify-center 
            transition-all duration-300 
            z-50
            ${isDraggingAnyNote 
              ? 'bg-red-500/30 text-red-400 scale-110 shadow-2xl border-2 border-red-500/50' 
              : 'bg-red-500/20 text-red-400 opacity-20 hover:opacity-100 hover:bg-red-500/30'
            }
            backdrop-blur-md 
            border border-red-500/30
            cursor-pointer
          `}
          title="Arraste uma nota aqui para deletar"
          style={{ WebkitAppRegion: 'no-drag' }}
          onClick={handleReset}
        >
          <Trash2 size={isDraggingAnyNote ? 22 : 18} />
        </div>
      )}

      {/* Modal de Ajuda de Atalhos */}
      <ShortcutsHelp 
        isOpen={showShortcutsHelp} 
        onClose={handleCloseShortcuts} 
      />

      {/* Modal de Busca */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={handleCloseSearch}
        notes={notesState.notes}
        onSelectNote={handleSelectNote}
      />

      {/* Modal de Histórico de Downloads */}
      <DownloadsHistoryModal
        isOpen={showDownloadsModal}
        onClose={handleCloseDownloads}
        onOpenFile={handleOpenFileGlobal}
      />
    </div>
  );
}

export default App;
