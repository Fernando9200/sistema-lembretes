// src/components/RemindersPage.tsx
import React, { useState, useMemo } from 'react';
import { useReminders } from '../contexts/RemindersContext';
import type { Reminder } from '../types';
import { Plus, Trash2, Edit, Save, X, Bookmark, Check, Hourglass, CheckCircle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import AutoSizingTextarea from './AutoSizingTextarea';

// --- Card de Lembrete (Sub-componente) ---
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
        if (!newReminder.title.trim()) return;
        dispatch({ type: 'ADD_REMINDER', payload: { title: newReminder.title.trim(), description: newReminder.description.trim() } });
        setNewReminder({ title: '', description: '' });
        setIsAdding(false);
    };

    const handleToggleReminder = (id: string) => dispatch({ type: 'TOGGLE_REMINDER', payload: { reminderId: id } });
    const handleUpdateReminder = (reminder: Reminder) => dispatch({ type: 'UPDATE_REMINDER', payload: reminder });
    
    const handleRequestRemove = (id: string, title: string) => {
        setModalState({ isOpen: true, id, title });
    }

    const handleConfirmRemove = () => {
        if (modalState.id) {
            dispatch({ type: 'REMOVE_REMINDER', payload: { reminderId: modalState.id } });
        }
        setModalState({ isOpen: false, id: null, title: '' });
    }

    if (state.loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Indicador de Salvamento Flutuante */}
            {isSaving && (
                <div className="fixed top-20 right-6 z-50 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium text-sm">Salvando...</span>
                </div>
            )}

            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Estatísticas na parte superior */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{reminders.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <Bookmark className="w-6 h-6 text-gray-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                                <p className="text-2xl font-bold text-primary-700">{pendingReminders.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                <Hourglass className="w-6 h-6 text-primary-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                                <p className="text-2xl font-bold text-green-700">{completedReminders.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {reminders.length > 0 ? Math.round((completedReminders.length / reminders.length) * 100) : 0}%
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Lembretes Pendentes */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Hourglass className="w-6 h-6 text-primary-600" />
                            Pendentes ({pendingReminders.length})
                        </h2>
                        {pendingReminders.length > 0 ? (
                            <div className="space-y-4">
                                {pendingReminders.map(r => <ReminderCard key={r.id} reminder={r} onToggle={handleToggleReminder} onRemove={handleRequestRemove} onUpdate={handleUpdateReminder} />)}
                            </div>
                        ) : (<p className="text-gray-500 italic text-center py-8 bg-white rounded-xl">Nenhum lembrete pendente. Ótimo trabalho! ✨</p>)}
                    </div>

                    {/* Lembretes Concluídos */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            Concluídos ({completedReminders.length})
                        </h2>
                        {completedReminders.length > 0 ? (
                            <div className="space-y-4">
                                {completedReminders.map(r => <ReminderCard key={r.id} reminder={r} onToggle={handleToggleReminder} onRemove={handleRequestRemove} onUpdate={handleUpdateReminder} />)}
                            </div>
                        ) : (<p className="text-gray-500 italic text-center py-8 bg-white rounded-xl">Nenhum lembrete concluído ainda.</p>)}
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
        </div>
    )
}

export default RemindersPage;