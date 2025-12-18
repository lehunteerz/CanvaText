import { memo } from 'react';
import { Plus, FolderOpen, FileEdit, Download } from 'lucide-react';

const StartScreen = memo(function StartScreen({ onStart, onOpenFile, onOpenEditor, onOpenDownloads }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 overflow-y-auto">
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 px-4 py-8 w-full max-w-[1800px] mx-auto">
        {/* Botão Nova Nota */}
        <div
          onClick={onStart}
          className="
            w-full sm:w-[calc(50%-0.375rem)] md:w-64 lg:w-72 xl:w-80 2xl:w-96
            bg-neutral-900/90
            backdrop-blur-md
            border border-white/5
            rounded-2xl
            p-4 sm:p-6 md:p-8
            shadow-2xl
            flex flex-col items-center justify-center
            cursor-pointer
            hover:border-white/10
            hover:shadow-blue-500/10
            transition-all duration-300
            group
            animate-in fade-in
            min-w-[200px]
          "
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {/* Ícone grande azul no topo */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300">
            <Plus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
          </div>
          
          {/* Texto */}
          <div className="text-center mt-3 sm:mt-4">
            <p className="text-white text-base sm:text-lg font-bold">Nova Nota</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Clique para começar</p>
          </div>
        </div>

        {/* Botão Editor */}
        <div
          onClick={onOpenEditor}
          className="
            w-full sm:w-[calc(50%-0.375rem)] md:w-64 lg:w-72 xl:w-80 2xl:w-96
            bg-neutral-900/90
            backdrop-blur-md
            border border-white/5
            rounded-2xl
            p-4 sm:p-6 md:p-8
            shadow-2xl
            flex flex-col items-center justify-center
            cursor-pointer
            hover:border-white/10
            hover:shadow-purple-500/10
            transition-all duration-300
            group
            animate-in fade-in
            min-w-[200px]
          "
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {/* Ícone grande roxo no topo */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-purple-500 group-hover:scale-110 transition-all duration-300">
            <FileEdit className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
          </div>
          
          {/* Texto */}
          <div className="text-center mt-3 sm:mt-4">
            <p className="text-white text-base sm:text-lg font-bold">Editor</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Editor completo</p>
          </div>
        </div>

        {/* Botão Abrir Arquivo */}
        <div
          onClick={onOpenFile}
          className="
            w-full sm:w-[calc(50%-0.375rem)] md:w-64 lg:w-72 xl:w-80 2xl:w-96
            bg-neutral-900/90
            backdrop-blur-md
            border border-white/5
            rounded-2xl
            p-4 sm:p-6 md:p-8
            shadow-2xl
            flex flex-col items-center justify-center
            cursor-pointer
            hover:border-white/10
            hover:shadow-green-500/10
            transition-all duration-300
            group
            animate-in fade-in
            min-w-[200px]
          "
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {/* Ícone grande verde no topo */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-green-500 group-hover:scale-110 transition-all duration-300">
            <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
          </div>
          
          {/* Texto */}
          <div className="text-center mt-3 sm:mt-4">
            <p className="text-white text-base sm:text-lg font-bold">Abrir Arquivo</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Clique para abrir</p>
          </div>
        </div>

        {/* Botão Históricos de Downloads */}
        <div
          onClick={onOpenDownloads}
          className="
            w-full sm:w-[calc(50%-0.375rem)] md:w-64 lg:w-72 xl:w-80 2xl:w-96
            bg-neutral-900/90
            backdrop-blur-md
            border border-white/5
            rounded-2xl
            p-4 sm:p-6 md:p-8
            shadow-2xl
            flex flex-col items-center justify-center
            cursor-pointer
            hover:border-white/10
            hover:shadow-orange-500/10
            transition-all duration-300
            group
            animate-in fade-in
            min-w-[200px]
          "
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {/* Ícone grande laranja no topo */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-orange-500 group-hover:scale-110 transition-all duration-300">
            <Download className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
          </div>
          
          {/* Texto */}
          <div className="text-center mt-3 sm:mt-4">
            <p className="text-white text-base sm:text-lg font-bold">Históricos de Downloads</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Ver histórico</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default StartScreen;
