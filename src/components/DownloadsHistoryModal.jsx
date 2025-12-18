import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Edit2, List, Grid, FileText, Calendar, HardDrive } from 'lucide-react';

function DownloadsHistoryModal({ isOpen, onClose, onOpenFile }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'grid'
  const [editingFile, setEditingFile] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState(null);

  // Carregar arquivos quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadFiles();
    } else {
      setEditingFile(null);
      setEditValue('');
    }
  }, [isOpen]);

  const loadFiles = async () => {
    if (!window.electronAPI) {
      setError('Electron API não disponível');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await window.electronAPI.listSavedFiles();
      if (result.success) {
        setFiles(result.files || []);
      } else {
        setError(result.error || 'Erro ao carregar arquivos');
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      setError(error.message || 'Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileName) => {
    if (!confirm(`Tem certeza que deseja deletar "${fileName}"?`)) {
      return;
    }

    if (!window.electronAPI) {
      setError('Electron API não disponível');
      return;
    }

    try {
      const result = await window.electronAPI.deleteSavedFile(fileName);
      if (result.success) {
        setFiles(files.filter(file => file.fileName !== fileName));
      } else {
        setError(result.error || 'Erro ao deletar arquivo');
      }
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      setError(error.message || 'Erro ao deletar arquivo');
    }
  };

  const handleStartRename = (file) => {
    setEditingFile(file.fileName);
    // Remover UUID e extensão para mostrar apenas o nome limpo
    const nameWithoutExt = file.fileName.replace(/\.[^/.]+$/, '');
    const cleanName = nameWithoutExt.replace(/^[a-f0-9-]+-/, ''); // Remove UUID prefix
    setEditValue(cleanName);
  };

  const handleConfirmRename = async () => {
    if (!editValue.trim() || !editingFile) {
      setEditingFile(null);
      return;
    }

    if (!window.electronAPI) {
      setError('Electron API não disponível');
      return;
    }

    try {
      // Manter a extensão original
      const oldExt = editingFile.split('.').pop();
      const newFileName = `${editValue.trim()}.${oldExt}`;
      
      const result = await window.electronAPI.renameSavedFile(editingFile, newFileName);
      if (result.success) {
        await loadFiles(); // Recarregar lista
        setEditingFile(null);
        setEditValue('');
      } else {
        setError(result.error || 'Erro ao renomear arquivo');
      }
    } catch (error) {
      console.error('Erro ao renomear arquivo:', error);
      setError(error.message || 'Erro ao renomear arquivo');
    }
  };

  const handleCancelRename = () => {
    setEditingFile(null);
    setEditValue('');
  };

  // Nota: A funcionalidade de abrir arquivo pode ser adicionada futuramente
  // Por enquanto, o modal apenas gerencia os arquivos salvos

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCleanFileName = (fileName) => {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    return nameWithoutExt.replace(/^[a-f0-9-]+-/, ''); // Remove UUID prefix
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <HardDrive size={20} className="text-neutral-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Histórico de Downloads</h2>
            {files.length > 0 && (
              <span className="text-sm text-neutral-400">({files.length})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle View Mode */}
            <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Visualização em lista"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Visualização em grade"
              >
                <Grid size={16} />
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors p-1"
              title="Fechar (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-neutral-400">Carregando arquivos...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-red-400 mb-2">{error}</div>
              <button
                onClick={loadFiles}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText size={48} className="text-neutral-600 mb-4" />
              <div className="text-neutral-400 text-center">
                Nenhum arquivo salvo encontrado
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.fileName}
                  className="bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 rounded-lg p-3 sm:p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {editingFile === file.fileName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleConfirmRename();
                              if (e.key === 'Escape') handleCancelRename();
                            }}
                            className="flex-1 bg-neutral-700 text-white px-2 py-1 rounded border border-blue-500/50 focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={handleConfirmRename}
                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors text-sm"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <FileText size={16} className="text-neutral-400 flex-shrink-0" />
                            <h3 className="text-white font-medium truncate">{getCleanFileName(file.fileName)}</h3>
                            <span className="text-xs text-neutral-500">{file.fileName.split('.').pop()}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-neutral-400 mt-2">
                            <span className="flex items-center gap-1">
                              <HardDrive size={12} />
                              {formatFileSize(file.size)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(file.modifiedAt)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    {editingFile !== file.fileName && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleStartRename(file)}
                          className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                          title="Renomear"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(file.fileName)}
                          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                          title="Deletar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {files.map((file) => (
                <div
                  key={file.fileName}
                  className="bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 rounded-lg p-4 transition-colors flex flex-col"
                >
                  {editingFile === file.fileName ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRename();
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        className="w-full bg-neutral-700 text-white px-2 py-1 rounded border border-blue-500/50 focus:border-blue-500 focus:outline-none text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleConfirmRename}
                          className="flex-1 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors text-xs"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="flex-1 px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <FileText size={24} className="text-neutral-400" />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStartRename(file)}
                            className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="Renomear"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(file.fileName)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="Deletar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-white font-medium text-sm mb-2 truncate">{getCleanFileName(file.fileName)}</h3>
                      <div className="text-xs text-neutral-400 space-y-1 mt-auto">
                        <div className="flex items-center gap-1">
                          <HardDrive size={10} />
                          {formatFileSize(file.size)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(file.modifiedAt)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-700 flex items-center justify-between text-xs text-neutral-500">
          <div>
            {files.length > 0 && (
              <span>
                {files.length} {files.length === 1 ? 'arquivo' : 'arquivos'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">Esc</kbd>
              Fechar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DownloadsHistoryModal;

