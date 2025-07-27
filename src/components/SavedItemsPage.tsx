// src/components/SavedItemsPage.tsx
import React, { useState, useMemo } from 'react';
import { useSavedItems } from '../contexts/SavedItemsContext';
import type { SavedItem } from '../types';
import { 
  Plus, Trash2, Edit, Save, X, Star, ExternalLink, 
  FileText, Link as LinkIcon, Search, Calendar, Upload,
  Download, Eye
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import AutoSizingTextarea from './AutoSizingTextarea';
import UserProfile from './UserProfile';
import FileUpload from './FileUpload';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';

// Card de Item Salvo
interface SavedItemCardProps {
  item: SavedItem;
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string, title: string) => void;
  onUpdate: (item: SavedItem) => void;
}

const SavedItemCard: React.FC<SavedItemCardProps> = ({ item, onToggleFavorite, onRemove, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState({ 
    title: item.title, 
    content: item.content, 
    url: item.url || ''
  });

  const handleSave = () => {
    onUpdate({ 
      ...item, 
      title: editState.title.trim(), 
      content: editState.content.trim(),
      url: item.type === 'link' ? editState.url.trim() : item.url // Mantém URL original para arquivos
    });
    setIsEditing(false);
  };

  const handleOpenLink = () => {
    if (item.type === 'link' && item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenFile = () => {
    if (item.type === 'file' && item.fileData) {
      window.open(item.fileData.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
    return '📎';
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'link':
        return <LinkIcon className="w-4 h-4 text-blue-600" />;
      case 'file':
        return <Upload className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-green-600" />;
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case 'link':
        return 'bg-blue-100';
      case 'file':
        return 'bg-purple-100';
      default:
        return 'bg-green-100';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="p-5 border-l-4 border-primary-500">
        <div className="flex items-start justify-between gap-4">
          {/* Tipo, Título e Metadata */}
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="mt-1 flex-shrink-0">
              <div className={`w-8 h-8 ${getTypeColor()} rounded-lg flex items-center justify-center`}>
                {getTypeIcon()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editState.title} 
                  onChange={(e) => setEditState({...editState, title: e.target.value})} 
                  className="w-full text-lg font-bold text-gray-800 bg-gray-100 p-2 rounded-md"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-800 break-words">{item.title}</h3>
                  {item.type === 'link' && item.url && (
                    <button 
                      onClick={handleOpenLink}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title="Abrir link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  {item.type === 'file' && item.fileData && (
                    <div className="flex gap-1">
                      <button 
                        onClick={handleOpenFile}
                        className="text-purple-500 hover:text-purple-700 transition-colors"
                        title="Visualizar arquivo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a 
                        href={item.fileData.url}
                        download={item.fileData.fileName}
                        className="text-purple-500 hover:text-purple-700 transition-colors"
                        title="Baixar arquivo"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                {item.lastModified.getTime() !== item.createdAt.getTime() && (
                  <span>• Editado: {new Date(item.lastModified).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onToggleFavorite(item.id)}
              className={`p-2 rounded-full transition-colors ${
                item.isFavorite 
                  ? 'text-yellow-500 hover:bg-yellow-100' 
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Star className={`w-5 h-5 ${item.isFavorite ? 'fill-current' : ''}`} />
            </button>
            {isEditing ? (
              <>
                <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-100 rounded-full">
                  <Save className="w-5 h-5"/>
                </button>
                <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5"/>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                  <Edit className="w-5 h-5"/>
                </button>
                <button onClick={() => onRemove(item.id, item.title)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                  <Trash2 className="w-5 h-5"/>
                </button>
              </>
            )}
          </div>
        </div>

        {/* URL (apenas para links) */}
        {item.type === 'link' && (
          <div className="pl-11 mt-2">
            {isEditing ? (
              <input 
                type="url" 
                value={editState.url} 
                onChange={(e) => setEditState({...editState, url: e.target.value})} 
                placeholder="https://..." 
                className="w-full text-sm text-blue-600 bg-gray-100 p-2 rounded-md"
              />
            ) : (
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
              >
                {item.url}
              </a>
            )}
          </div>
        )}

        {/* Informações do arquivo (apenas para arquivos) */}
        {item.type === 'file' && item.fileData && (
          <div className="pl-11 mt-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="text-lg">{getFileIcon(item.fileData.fileType)}</span>
              <span className="font-medium">{item.fileData.fileName}</span>
              <span>•</span>
              <span>{formatFileSize(item.fileData.fileSize)}</span>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div className="pl-11 mt-3">
          {isEditing ? (
            <AutoSizingTextarea 
              value={editState.content} 
              onChange={(e) => setEditState({...editState, content: e.target.value})} 
              placeholder="Conteúdo ou descrição..." 
              className="w-full text-sm text-gray-700 bg-gray-100 p-2 rounded-md"
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {item.content || 'Sem conteúdo'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Página Principal
const SavedItemsPage: React.FC = () => {
  const { state, dispatch, isSaving } = useSavedItems();
  const { uploadFile, uploading: cloudinaryUploading, error: uploadError } = useCloudinaryUpload();
  const [newItem, setNewItem] = useState({ 
    title: '', 
    content: '', 
    type: 'text' as 'text' | 'link' | 'file', 
    url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [modalState, setModalState] = useState<{isOpen: boolean; id: string | null; title: string}>({ 
    isOpen: false, 
    id: null, 
    title: '' 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'link' | 'file' | 'favorites'>('all');

  const items = useMemo(() => {
    let filtered = (state.data?.items || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Filtro por tipo
    if (filterType === 'text') filtered = filtered.filter(item => item.type === 'text');
    if (filterType === 'link') filtered = filtered.filter(item => item.type === 'link');
    if (filterType === 'file') filtered = filtered.filter(item => item.type === 'file');
    if (filterType === 'favorites') filtered = filtered.filter(item => item.isFavorite);
    
    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.fileData?.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  }, [state.data?.items, searchTerm, filterType]);

  const handleAddItem = async () => {
    if (!newItem.title.trim()) return;

    try {
      let fileData;
      
      if (newItem.type === 'file' && selectedFile) {
        console.log('🔄 Iniciando upload do arquivo:', selectedFile.name);
        const uploadResult = await uploadFile(selectedFile);
        console.log('✅ Upload concluído:', uploadResult);
        fileData = uploadResult;
      }

      const itemPayload = { 
        title: newItem.title.trim(), 
        content: newItem.content.trim(),
        type: newItem.type,
        url: newItem.type === 'link' ? newItem.url.trim() : undefined,
        fileData
      };

      console.log('🔄 Adicionando item:', itemPayload);

      dispatch({ 
        type: 'ADD_ITEM', 
        payload: itemPayload
      });
      
      setNewItem({ title: '', content: '', type: 'text', url: '' });
      setSelectedFile(null);
      setIsAdding(false);

      console.log('✅ Item adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar item:', error);
      alert(`Erro ao fazer upload do arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleToggleFavorite = (id: string) => {
    console.log('🔄 Toggleando favorito:', id);
    dispatch({ type: 'TOGGLE_FAVORITE', payload: { itemId: id } });
  };

  const handleUpdateItem = (item: SavedItem) => {
    console.log('🔄 Atualizando item:', item);
    dispatch({ type: 'UPDATE_ITEM', payload: item });
  };
  
  const handleRequestRemove = (id: string, title: string) => {
    setModalState({ isOpen: true, id, title });
  };

  const handleConfirmRemove = () => {
    if (modalState.id) {
      console.log('🔄 Removendo item:', modalState.id);
      dispatch({ type: 'REMOVE_ITEM', payload: { itemId: modalState.id } });
    }
    setModalState({ isOpen: false, id: null, title: '' });
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewItem({ title: '', content: '', type: 'text', url: '' });
    setSelectedFile(null);
  };

  // Debug: Log do estado atual
  console.log('🔍 Estado atual da página:', { state, items: items.length });

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando itens salvos...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: state.data?.items.length || 0,
    texts: state.data?.items.filter(item => item.type === 'text').length || 0,
    links: state.data?.items.filter(item => item.type === 'link').length || 0,
    files: state.data?.items.filter(item => item.type === 'file').length || 0,
    favorites: state.data?.items.filter(item => item.isFavorite).length || 0
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Barra Lateral */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-col hidden sm:flex">
        <div className="p-6 border-b border-gray-200">
          <h1 className="font-semibold text-xl text-gray-900">Itens Salvos</h1>
          <p className="text-sm text-gray-500">Textos, links e arquivos</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Estatísticas */}
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Resumo</h2>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Total</span>
                <span className="font-bold text-primary-700 bg-primary-100 rounded-full px-2.5 py-0.5">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Textos</span>
                <span className="font-bold text-green-700 bg-green-100 rounded-full px-2.5 py-0.5">{stats.texts}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Links</span>
                <span className="font-bold text-blue-700 bg-blue-100 rounded-full px-2.5 py-0.5">{stats.links}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Arquivos</span>
                <span className="font-bold text-purple-700 bg-purple-100 rounded-full px-2.5 py-0.5">{stats.files}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Favoritos</span>
                <span className="font-bold text-yellow-700 bg-yellow-100 rounded-full px-2.5 py-0.5">{stats.favorites}</span>
              </div>
            </div>

            {/* Filtros */}
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Filtros</h2>
            <div className="space-y-2">
              {[
                { key: 'all', label: 'Todos', icon: FileText },
                { key: 'text', label: 'Textos', icon: FileText },
                { key: 'link', label: 'Links', icon: LinkIcon },
                { key: 'file', label: 'Arquivos', icon: Upload },
                { key: 'favorites', label: 'Favoritos', icon: Star }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    filterType === filter.key 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <filter.icon className="w-4 h-4" />
                  <span className="font-medium">{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <UserProfile />
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Indicador de Salvamento */}
        {(isSaving || cloudinaryUploading) && (
          <div className="fixed top-6 right-6 z-50 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium text-sm">
              {cloudinaryUploading ? 'Fazendo upload...' : 'Salvando...'}
            </span>
          </div>
        )}

        {/* Erro de upload */}
        {uploadError && (
          <div className="fixed top-6 right-6 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
            <span className="font-medium text-sm">Erro: {uploadError}</span>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Barra de Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, conteúdo ou nome do arquivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Seção para Adicionar Item */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            {isAdding ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center space-x-3 mb-4">
                  <Plus className="w-6 h-6 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Novo Item</h2>
                </div>
                
                {/* Seletor de Tipo */}
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => setNewItem({...newItem, type: 'text'})}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      newItem.type === 'text' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Texto</span>
                  </button>
                  <button
                    onClick={() => setNewItem({...newItem, type: 'link'})}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      newItem.type === 'link' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>Link</span>
                  </button>
                  <button
                    onClick={() => setNewItem({...newItem, type: 'file'})}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      newItem.type === 'file' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Arquivo</span>
                  </button>
                </div>

                <input 
                  type="text" 
                  autoFocus 
                  placeholder="Título" 
                  value={newItem.title} 
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})} 
                  className="w-full p-3 border rounded-lg focus:ring-2 border-gray-300 focus:ring-primary-400"
                />

                {newItem.type === 'link' && (
                  <input 
                    type="url" 
                    placeholder="URL (https://...)" 
                    value={newItem.url} 
                    onChange={(e) => setNewItem({...newItem, url: e.target.value})} 
                    className="w-full p-3 border rounded-lg focus:ring-2 border-gray-300 focus:ring-primary-400"
                  />
                )}

                {newItem.type === 'file' && (
                  <FileUpload
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                    onClearFile={() => setSelectedFile(null)}
                    uploading={cloudinaryUploading}
                  />
                )}

                <AutoSizingTextarea 
                  placeholder="Conteúdo ou descrição..." 
                  value={newItem.content} 
                  onChange={(e) => setNewItem({...newItem, content: e.target.value})} 
                  className="w-full p-3 border rounded-lg focus:ring-2 border-gray-300 focus:ring-primary-400"
                />

                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={handleCancelAdd} 
                    className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
                    disabled={cloudinaryUploading}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAddItem} 
                    disabled={
                      !newItem.title.trim() || 
                      (newItem.type === 'file' && !selectedFile) || 
                      cloudinaryUploading
                    } 
                    className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cloudinaryUploading ? 'Fazendo upload...' : 'Adicionar'}
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAdding(true)} 
                className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-primary-400 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Adicionar Novo Item</span>
              </button>
            )}
          </div>

          {/* Lista de Itens */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {filterType === 'all' && `Todos os Itens (${items.length})`}
              {filterType === 'text' && `Textos (${items.length})`}
              {filterType === 'link' && `Links (${items.length})`}
              {filterType === 'file' && `Arquivos (${items.length})`}
              {filterType === 'favorites' && `Favoritos (${items.length})`}
            </h2>
            
            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map(item => (
                  <SavedItemCard 
                    key={item.id} 
                    item={item} 
                    onToggleFavorite={handleToggleFavorite} 
                    onRemove={handleRequestRemove} 
                    onUpdate={handleUpdateItem} 
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-center py-8">
                {searchTerm 
                  ? 'Nenhum item encontrado para sua busca.' 
                  : 'Nenhum item salvo ainda. Comece adicionando seu primeiro item!'
                }
              </p>
            )}
          </div>

          {/* Modal de Confirmação */}
          <ConfirmationModal 
            isOpen={modalState.isOpen} 
            onClose={() => setModalState({ isOpen: false, id: null, title: '' })} 
            onConfirm={handleConfirmRemove} 
            title="Excluir Item" 
            confirmText="Sim, excluir"
            variant="danger"
          >
            <p>Tem certeza que deseja excluir <span className="font-bold">"{modalState.title}"</span>?</p>
            <p className="mt-4 font-bold text-red-600">Esta ação não pode ser desfeita.</p>
          </ConfirmationModal>
        </div>
      </main>
    </div>
  );
};

export default SavedItemsPage;