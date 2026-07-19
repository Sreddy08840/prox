import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Plus, Search, Trash2, Clock, CheckCircle2, Circle, X, AlertCircle, Sparkles } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  category: string;
}

const DEFAULT_TASKS: Task[] = [
  { id: '1', title: 'Follow up with Rashid Al-Mansoori on 2BR budget', dueDate: 'Today, 4:00 PM', priority: 'HIGH', completed: false, category: 'Lead Follow-up' },
  { id: '2', title: 'Schedule site visit for Emma Johnson at Project Skyline', dueDate: 'Tomorrow, 10:00 AM', priority: 'MEDIUM', completed: false, category: 'Site Visit' },
  { id: '3', title: 'Verify financing status documents for Ahmed Hassan', dueDate: 'July 12, 2026', priority: 'HIGH', completed: true, category: 'Verification' },
  { id: '4', title: 'Send project brochure for Green Valley to Priya Sharma', dueDate: 'Completed yesterday', priority: 'LOW', completed: true, category: 'Documents' },
  { id: '5', title: 'Respond to WhatsApp inquiry from new inbound lead', dueDate: 'Today, 6:30 PM', priority: 'HIGH', completed: false, category: 'WhatsApp' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('propx_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_e) {
        return DEFAULT_TASKS;
      }
    }
    return DEFAULT_TASKS;
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [newTaskDueDate, setNewTaskDueDate] = useState('Due tomorrow');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal & feedback states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('propx_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const createTask = (title: string, priority: 'HIGH' | 'MEDIUM' | 'LOW', category: string, dueDate: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Please enter a valid task title');
      return false;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: trimmedTitle,
      dueDate: dueDate.trim() || 'Due tomorrow',
      priority,
      completed: false,
      category: category.trim() || 'General',
    };

    setTasks(prev => [newTask, ...prev]);
    setFormError(null);
    showToast('Task added successfully!');
    return true;
  };

  const handleSidePanelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createTask(newTaskTitle, newTaskPriority, newTaskCategory, newTaskDueDate)) {
      setNewTaskTitle('');
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createTask(newTaskTitle, newTaskPriority, newTaskCategory, newTaskDueDate)) {
      setNewTaskTitle('');
      setIsModalOpen(false);
    }
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Task removed');
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;
    const matchesStatus = filterStatus === 'ALL' ? true :
                          filterStatus === 'COMPLETED' ? t.completed : !t.completed;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-primary/30 flex items-center space-x-2 text-xs font-bold animate-in slide-in-from-top-4 duration-300">
          <Sparkles className="text-primary" size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2.5">
            <CheckSquare className="text-primary animate-pulse" size={26} />
            <span>Task Management</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">
            Track daily follow-ups, documents verification, and site inspections.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md hover:shadow-lg hover:scale-[1.02] cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Task Side Panel */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Create New Task</h3>
            <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md">Quick Form</span>
          </div>

          {formError && (
            <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 flex items-center space-x-2 text-xs font-bold">
              <AlertCircle size={14} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSidePanelSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Task Title *</label>
              <input
                type="text"
                placeholder="E.g., Call Rashid regarding budget..."
                value={newTaskTitle}
                onChange={e => {
                  setNewTaskTitle(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="w-full px-3 py-2 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
                  className="w-full border rounded-xl px-2.5 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Category</label>
                <input
                  type="text"
                  placeholder="E.g., Site Visit"
                  value={newTaskCategory}
                  onChange={e => setNewTaskCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Due Schedule</label>
              <input
                type="text"
                placeholder="E.g., Today 5:00 PM"
                value={newTaskDueDate}
                onChange={e => setNewTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-white hover:bg-primary/90 transition-all shadow-md cursor-pointer mt-2"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </form>
        </div>

        {/* Task List Panel */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Action Checklist</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                Showing {filteredTasks.length} of {tasks.length} total tasks
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="border rounded-xl px-2.5 py-1.5 bg-background text-foreground focus:outline-none text-xs font-bold"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border rounded-xl px-2.5 py-1.5 bg-background text-foreground focus:outline-none text-xs font-bold"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {/* Search Bar */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl p-6 space-y-2">
                <CheckSquare size={32} className="mx-auto text-muted-foreground/40" />
                <p className="text-xs font-bold text-foreground">No tasks found</p>
                <p className="text-[10px] text-muted-foreground">Try adjusting your search or priority filter.</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                    task.completed ? 'bg-muted/10 border-border/60 opacity-70' : 'bg-background hover:border-primary/30 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="text-muted-foreground hover:text-primary transition-colors shrink-0 cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>
                    <div>
                      <span className={`text-xs font-extrabold block text-foreground ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center space-x-2 mt-1 text-[9px] font-bold text-muted-foreground">
                        <span className="bg-muted px-2 py-0.5 rounded-md uppercase tracking-wider text-foreground">{task.category}</span>
                        <span className="flex items-center space-x-1">
                          <Clock size={10} />
                          <span>{task.dueDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                      task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                      task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    }`}>
                      {task.priority}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Dialog for Adding Tasks */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-card text-foreground border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Create New Task</h3>
                  <p className="text-[10px] text-muted-foreground">Add a follow-up item to your workspace checklist.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 flex items-center space-x-2 text-xs font-bold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs text-left">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Task Description / Title *</label>
                <input
                  ref={titleInputRef}
                  type="text"
                  placeholder="E.g., Call client back regarding 2BR budget..."
                  value={newTaskTitle}
                  onChange={e => {
                    setNewTaskTitle(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  autoFocus
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
                    className="w-full border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                  >
                    <option value="HIGH font-bold">High Priority</option>
                    <option value="MEDIUM font-bold">Medium Priority</option>
                    <option value="LOW font-bold">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="E.g., Site Visit, Documents"
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Due Date / Schedule</label>
                <input
                  type="text"
                  placeholder="E.g., Today 5:00 PM or Tomorrow"
                  value={newTaskDueDate}
                  onChange={e => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 bg-primary text-primary-foreground px-5 py-2 rounded-xl text-xs font-extrabold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Create Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
