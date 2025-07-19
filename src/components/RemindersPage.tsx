import React, { useState, useMemo } from 'react';
import { useReminders } from '../contexts/RemindersContext';
import type { Reminder } from '../types';
import { Plus, Trash2, Edit, Save, X, Bookmark, Check, Hourglass, CheckCircle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import AutoSizingTextarea from './AutoSizingTextarea';
import UserProfile from './UserProfile';

// --- Card de Lembrete (Sub-componente) ---
// Este componente representa um único lembrete na lista.
interface ReminderCardProps {
  reminder: Reminder;
  onToggle: (id: string) => void;
  onRemove: (id: string, title: string) => void;
  onUpdate: (reminder: Reminder) => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onToggle, onRemove, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editState, setEditState] = useState({ title: reminder.title, description: reminder.description });

    const handleSave = () => {
        onUpdate({ ...reminder, title: editState.title.trim(), description: editState.description.trim() });
        setIsEditing(false);
    }

    return (
        <div className={`rounded-xl shadow-md overflow-hidden transition-all duration-300 ${reminder.isCompleted ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
            <div className={`p-5 border-l-4 ${reminder.isCompleted ? 'border-gray-400' : 'border-primary-500'}`}>
                <div className="flex items-start justify-between gap-4">
                    {/* Checkbox e Título */}
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <button onClick={() => onToggle(reminder.id)} className="mt-1 flex-shrink-0">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${reminder.isCompleted ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                                {reminder.isCompleted && <Check className="w-4 h-4 text-white" />}
                            </div>
                        </button>
                        <div className="flex-1 min-w-0">
                           {isEditing ? (
                                <input type="text" value={editState.title} onChange={(e) => setEditState({...editState, title: e.target.value})} className="w-full text-lg font-bold text-gray-800 bg-gray-100 p-2 rounded-md"/>
                           ) : (
                            <h3 className={`text-lg font-bold text-gray-800 break-words ${reminder.isCompleted ? 'line-through' : ''}`}>{reminder.title}</h3>
                           )}
                            <p className="text-xs text-gray-500 mt-1">Adicionado em: {new Date(reminder.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                    {/* Botões de Ação */}
                    <div className="flex items-center space-x-2">
                        {isEditing ? (
                            <>
                                <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-100 rounded-full"><Save className="w-5 h-5"/></button>
                                <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
                            </>
                        ) : (
                             <>
                                {!reminder.isCompleted && <button onClick={() => setIsEditing(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Edit className="w-5 h-5"/></button>}
                                <button onClick={() => onRemove(reminder.id, reminder.title)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 className="w-5 h-5"/></button>
                             </>
                        )}
                    </div>
                </div>
                {/* Descrição */}
                <div className="pl-10 mt-2">
                     {isEditing ? (
                        <AutoSizingTextarea value={editState.description || ''} onChange={(e) => setEditState({...editState, description: e.target.value})} placeholder="Adicione uma descrição..." className="w-full text-sm text-gray-600 bg-gray-100 p-2 rounded-md"/>
                     ) : (
                        <p className={`text-sm text-gray-600 whitespace-pre-wrap break-words ${!reminder.description && 'italic'}`}>{reminder.description || 'Sem descrição'}</p>
                     )}
                </div>
            </div>
        </div>
    )
};

// --- Página Principal de Lembretes ---
// Este é o componente principal que estrutura a página.
const RemindersPage: React.FC = () => {
    const { state, dispatch, isSaving } = useReminders();
    const [newReminder, setNewReminder] = useState({ title: '', description: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [modalState, setModalState] = useState<{isOpen: boolean; id: string | null; title: string}>({ isOpen: false, id: null, title: '' });

    // Ordena os lembretes por data de criação para mostrar os mais recentes primeiro
    const reminders = useMemo(() => {
        return (state.data?.reminders || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [state.data?.reminders]);

    // Filtra os lembretes em duas listas: pendentes e concluídos
    const pendingReminders = reminders.filter(r => !r.isCompleted);
    const completedReminders = reminders.filter(r => r.isCompleted);

    // --- Funções para interagir com os lembretes ---
    const handleAddReminder = () => {
        if (!newReminder.title.trim()) return; // Não adiciona se o título estiver vazio
        dispatch({ type: 'ADD_REMINDER', payload: { title: newReminder.title.trim(), description: newReminder.description.trim() } });
        setNewReminder({ title: '', description: '' }); // Limpa o formulário
        setIsAdding(false); // Fecha o formulário
    };

    const handleToggleReminder = (id: string) => dispatch({ type: 'TOGGLE_REMINDER', payload: { reminderId: id } });
    const handleUpdateReminder = (reminder: Reminder) => dispatch({ type: 'UPDATE_REMINDER', payload: reminder });
    
    // Abre o modal de confirmação antes de remover
    const handleRequestRemove = (id: string, title: string) => {
        setModalState({ isOpen: true, id, title });
    }

    // Ação executada ao confirmar a exclusão no modal
    const handleConfirmRemove = () => {
        if (modalState.id) {
            dispatch({ type: 'REMOVE_REMINDER', payload: { reminderId: modalState.id } });
        }
        setModalState({ isOpen: false, id: null, title: '' }); // Fecha e reseta o modal
    }

    // Mostra um spinner de carregamento enquanto os dados não chegam do Firebase
    if (state.loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
      <div className="flex h-screen bg-gray-50">
        {/* Barra Lateral Fixa (visível em telas maiores) */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-col hidden sm:flex">
          <div className="p-6 border-b border-gray-200">
            <h1 className="font-semibold text-xl text-gray-900">Lembretes</h1>
            <p className="text-sm text-gray-500">Suas tarefas em um só lugar.</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Resumo</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Hourglass className="w-4 h-4 text-primary-600" />
                    <span className="font-medium">Pendentes</span>
                  </div>
                  <span className="font-bold text-lg text-primary-700 bg-primary-100 rounded-full px-2.5 py-0.5">
                    {pendingReminders.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Concluídos</span>
                  </div>
                  <span className="font-bold text-lg text-green-700 bg-green-100 rounded-full px-2.5 py-0.5">
                    {completedReminders.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <UserProfile />
        </aside>

        {/* Conteúdo Principal com scroll */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {/* Indicador de Salvamento Flutuante */}
            {isSaving && (
              <div className="fixed top-6 right-6 z-50 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium text-sm">Salvando...</span>
              </div>
            )}

            <div className="max-w-4xl mx-auto">
                {/* Seção para Adicionar Lembrete */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
                    {isAdding ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center space-x-3 mb-2">
                                 <Bookmark className="w-6 h-6 text-primary-600" />
                                 <h2 className="text-lg font-semibold text-gray-800">Novo Lembrete</h2>
                            </div>
                            <input type="text" autoFocus placeholder="Título do lembrete (ex: Pagar a conta de luz)" value={newReminder.title} onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 border-gray-300 focus:ring-primary-400"/>
                            <AutoSizingTextarea placeholder="Descrição (opcional)" value={newReminder.description} onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 border-gray-300 focus:ring-primary-400"/>
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                                <button onClick={handleAddReminder} disabled={!newReminder.title.trim()} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">Adicionar</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-primary-400 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                            <Plus className="w-5 h-5" />
                            <span>Adicionar Novo Lembrete</span>
                        </button>
                    )}
                </div>
                {/* Listas de Lembretes */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Pendentes ({pendingReminders.length})</h2>
                        {pendingReminders.length > 0 ? (
                            <div className="space-y-4">
                                {pendingReminders.map(r => <ReminderCard key={r.id} reminder={r} onToggle={handleToggleReminder} onRemove={handleRequestRemove} onUpdate={handleUpdateReminder} />)}
                            </div>
                        ) : (<p className="text-gray-500 italic text-center py-8">Nenhum lembrete pendente. Ótimo trabalho! ✨</p>)}
                    </div>
                     <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Concluídos ({completedReminders.length})</h2>
                        {completedReminders.length > 0 ? (
                            <div className="space-y-4">
                                {completedReminders.map(r => <ReminderCard key={r.id} reminder={r} onToggle={handleToggleReminder} onRemove={handleRequestRemove} onUpdate={handleUpdateReminder} />)}
                            </div>
                        ) : (<p className="text-gray-500 italic text-center py-8">Nenhum lembrete concluído ainda.</p>)}
                    </div>
                </div>

                {/* Modal de Confirmação de Exclusão */}
                <ConfirmationModal 
                    isOpen={modalState.isOpen} 
                    onClose={() => setModalState({ isOpen: false, id: null, title: '' })} 
                    onConfirm={handleConfirmRemove} 
                    title="Excluir Lembrete" 
                    confirmText="Sim, excluir"
                    variant="danger"
                >
                    <p>Tem certeza que deseja excluir o lembrete <span className="font-bold">"{modalState.title}"</span>?</p>
                    <p className="mt-4 font-bold text-red-600">Esta ação não pode ser desfeita.</p>
                </ConfirmationModal>
            </div>
        </main>
      </div>
    )
}

export default RemindersPage;