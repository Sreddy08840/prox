import React, { useState } from 'react';
import { CheckSquare, Plus, Search, Trash2, Clock, CheckCircle2, Circle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  category: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Follow up with Rashid Al-Mansoori on 2BR budget', dueDate: 'Today, 4:00 PM', priority: 'HIGH', completed: false, category: 'Lead Follow-up' },
    { id: '2', title: 'Schedule site visit for Emma Johnson at Project Skyline', dueDate: 'Tomorrow, 10:00 AM', priority: 'MEDIUM', completed: false, category: 'Site Visit' },
    { id: '3', title: 'Verify financing status documents for Ahmed Hassan', dueDate: 'July 12, 2026', priority: 'HIGH', completed: true, category: 'Verification' },
    { id: '4', title: 'Send project brochure for Green Valley to Priya Sharma', dueDate: 'Completed yesterday', priority: 'LOW', completed: true, category: 'Documents' },
    { id: '5', title: 'Respond to WhatsApp inquiry from new inbound lead', dueDate: 'Today, 6:30 PM', priority: 'HIGH', completed: false, category: 'WhatsApp' },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [search, setSearch] = useState('');

  const handleToggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      dueDate: 'Due tomorrow',
      priority: newTaskPriority,
      completed: false,
      category: newTaskCategory,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2.5">
            <CheckSquare className="text-primary animate-pulse" size={26} />
            <span>Task Management</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">
            Track daily follow-ups, documents verification, and site inspections.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Task Panel */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 h-fit">
          <h3 className="text-sm font-bold text-foreground">Create Task</h3>
          <form onSubmit={handleAddTask} className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Task Title</label>
              <input
                type="text"
                placeholder="E.g., Call client back..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
                  className="w-full border rounded-xl px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Category</label>
                <input
                  type="text"
                  placeholder="E.g., WhatsApp"
                  value={newTaskCategory}
                  onChange={e => setNewTaskCategory(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all font-semibold"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground hover:bg-primary/95 transition-all shadow-md mt-2"
            >
              <Plus size={14} />
              <span>Add Task</span>
            </button>
          </form>
        </div>

        {/* Task List Panel */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Action Checklist</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Verify pipeline requirements status.</p>
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all text-xs font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground font-semibold">
                No tasks match your search criteria.
              </div>
            ) : (
              filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                    task.completed ? 'bg-muted/10 border-border/60 opacity-70' : 'bg-background hover:border-muted-foreground/20'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                    <div>
                      <span className={`text-xs font-extrabold block text-foreground ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center space-x-2 mt-0.5 text-[9px] font-bold text-muted-foreground">
                        <span className="bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider">{task.category}</span>
                        <span className="flex items-center space-x-1">
                          <Clock size={10} />
                          <span>{task.dueDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                      task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    }`}>
                      {task.priority}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
