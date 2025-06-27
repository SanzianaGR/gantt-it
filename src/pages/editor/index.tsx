"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inter } from "next/font/google";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const inter = Inter({ subsets: ["latin"] });

interface TeamMember {
  id: string;
  name: string;
  color: string;
  role?: string;
}

interface Task {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  assigneeId?: string;
  description?: string;
  progress?: number;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

const DAY_WIDTH = 100; // pixels per day
const DAYS_TO_SHOW = 30;

// Predefined colors for team members - using standard hex colors
const TEAM_COLORS = [
  "#FF6B6B", // Primary color
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Mint
  "#FFD93D", // Yellow
  "#D4A5A5", // Rose
  "#9B59B6", // Purple
  "#3498DB", // Sky Blue
];

const CATEGORIES = [
  "Development",
  "Design",
  "Marketing",
  "Research",
  "Planning",
  "Testing",
  "Documentation",
  "Other"
];

// Priority colors
const PRIORITY_COLORS = {
  low: "#4ECDC4",
  medium: "#FF6B6B",
  high: "#FFD93D"
};

export default function EditorPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const chartRef = useRef<HTMLDivElement>(null);

  // Handle hotkeys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code == "Escape" && showTaskModal) {
        setEditingTask(null);
        setShowTaskModal(false);
      }
      if (e.code == "Delete" && editingTask) {
        setTasks(tasks.filter((task) => task.id !== editingTask.id));
        setShowTaskModal(false);
        setEditingTask(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showTaskModal, editingTask, tasks]);

  const getDateFromX = (x: number): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysToAdd = Math.floor(x / DAY_WIDTH);
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + daysToAdd);
    return newDate;
  };

  const getXFromDate = (date: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * DAY_WIDTH;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const startDate = getDateFromX(x);
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: "New Task",
      startDate,
      endDate: new Date(startDate.getTime() + 24 * 60 * 60 * 1000), // 1 day default
      progress: 0,
      priority: 'medium',
    };

    setCurrentTask(newTask);
    setIsDragging(true);
    setDragStartX(x);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !currentTask) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const daysDiff = Math.floor((x - dragStartX) / DAY_WIDTH);
    
    const newEndDate = new Date(currentTask.startDate);
    newEndDate.setDate(newEndDate.getDate() + Math.max(1, daysDiff));

    setCurrentTask({
      ...currentTask,
      endDate: newEndDate,
    });
  };

  const handleMouseUp = () => {
    if (currentTask) {
      // Add the task to the tasks array immediately
      setTasks(prevTasks => [...prevTasks, currentTask]);
      // Then open the edit modal
      setEditingTask(currentTask);
      setShowTaskModal(true);
    }
    setIsDragging(false);
    setCurrentTask(null);
  };

  const handleAddTeamMember = () => {
    if (!newMemberName.trim()) return;
    
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      role: newMemberRole.trim(),
      color: TEAM_COLORS[teamMembers.length % TEAM_COLORS.length],
    };
    
    setTeamMembers([...teamMembers, newMember]);
    setNewMemberName("");
    setNewMemberRole("");
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setShowTaskModal(true);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleTaskSave = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleExport = async (format: 'pdf' | 'png') => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: '#F8F9FA',
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        removeContainer: true,
        onclone: (clonedDoc) => {
          // Remove any problematic color functions
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const style = element.getAttribute('style');
            if (style) {
              // Replace any oklab color functions with hex colors
              element.setAttribute('style', style.replace(/oklab\([^)]+\)/g, '#FF6B6B'));
            }
          }
        }
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `gantt-chart-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`gantt-chart-${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export chart. Please try again.');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getTaskColor = (task: Task) => {
    if (task.priority === 'high') return PRIORITY_COLORS.high;
    if (task.priority === 'low') return PRIORITY_COLORS.low;
    return task.assigneeId 
      ? teamMembers.find(m => m.id === task.assigneeId)?.color || PRIORITY_COLORS.medium
      : PRIORITY_COLORS.medium;
  };

  return (
    <main className={`min-h-screen bg-[#F8F9FA] ${inter.className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[#343A40]">Gantt Chart</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Name..."
                className="px-3 py-2 rounded-lg border border-[#343A40]/10 focus:outline-none focus:border-[#FF6B6B] w-32 text-[#343A40] placeholder-[#343A40]/40"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTeamMember()}
              />
              <input
                type="text"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                placeholder="Role..."
                className="px-3 py-2 rounded-lg border border-[#343A40]/10 focus:outline-none focus:border-[#FF6B6B] w-32 text-[#343A40] placeholder-[#343A40]/40"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTeamMember()}
              />
              <button
                onClick={handleAddTeamMember}
                className="px-4 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#FF6B6B]/90 transition-colors font-medium"
              >
                Add Member
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#FF6B6B]/90 transition-colors font-medium"
              >
                Export PDF
              </button>
              <button
                onClick={() => handleExport('png')}
                className="px-4 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#FF6B6B]/90 transition-colors font-medium"
              >
                Export PNG
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full px-4 py-2 rounded-lg border border-[#343A40]/10 focus:outline-none focus:border-[#FF6B6B] text-[#343A40] placeholder-[#343A40]/40"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[#343A40]/10 focus:outline-none focus:border-[#FF6B6B] text-[#343A40] bg-white"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Team Members */}
        {teamMembers.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <span className="text-sm text-[#343A40] font-medium">{member.name}</span>
                {member.role && (
                  <span className="text-xs text-[#343A40]/60">({member.role})</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timeline Grid */}
        <div 
          ref={chartRef}
          className="relative bg-white rounded-xl shadow-sm p-4 min-h-[400px] overflow-x-auto"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {/* Days Header */}
          <div className="flex mb-4 min-w-max">
            {Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
              const date = new Date(today);
              date.setDate(today.getDate() + i);
              const isToday = date.getTime() === today.getTime();
              
              return (
                <div 
                  key={i} 
                  className={`w-[${DAY_WIDTH}px] flex-shrink-0 text-center text-sm ${
                    isToday ? 'text-[#FF6B6B] font-medium' : 'text-[#343A40]/60'
                  }`}
                >
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              );
            })}
          </div>

          {/* Grid Lines and Today Indicator */}
          <div className="absolute top-16 left-0 right-0 bottom-0 flex min-w-max">
            {Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
              const date = new Date(today);
              date.setDate(today.getDate() + i);
              const isToday = date.getTime() === today.getTime();
              
              return (
                <div 
                  key={i} 
                  className={`w-[${DAY_WIDTH}px] flex-shrink-0 border-l ${
                    isToday ? 'border-[#FF6B6B]' : 'border-[#343A40]/10'
                  }`}
                />
              );
            })}
          </div>

          {/* Tasks */}
          <div className="relative min-w-max">
            {filteredTasks.map((task) => {
              const assignee = teamMembers.find(m => m.id === task.assigneeId);
              const taskColor = getTaskColor(task);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute h-8 rounded-lg flex items-center px-3 text-white text-sm cursor-pointer hover:opacity-90 transition-opacity"
                  style={{
                    left: `${getXFromDate(task.startDate)}px`,
                    width: `${(task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24) * DAY_WIDTH}px`,
                    top: `${tasks.indexOf(task) * 48 + 16}px`,
                    backgroundColor: taskColor,
                  }}
                  onClick={() => handleTaskClick(task.id)}
                >
                  {task.title}
                  {assignee && (
                    <span className="ml-2 text-xs opacity-75">
                      ({assignee.name})
                    </span>
                  )}
                </motion.div>
              );
            })}

            {/* Current Task Being Dragged */}
            {currentTask && (
              <div
                className="absolute h-8 rounded-lg flex items-center px-3 text-white text-sm"
                style={{
                  left: `${getXFromDate(currentTask.startDate)}px`,
                  width: `${(currentTask.endDate.getTime() - currentTask.startDate.getTime()) / (1000 * 60 * 60 * 24) * DAY_WIDTH}px`,
                  top: `${tasks.length * 48 + 16}px`,
                  backgroundColor: getTaskColor(currentTask),
                }}
              >
                {currentTask.title}
              </div>
            )}
          </div>
        </div>

        {/* Task Modal */}
        <AnimatePresence>
          {showTaskModal && editingTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowTaskModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4 text-[#343A40]">Edit Task</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#343A40] mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-[#343A40]/10 focus:outline-none focus:border-[#FF6B6B] text-[#343A40]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#343A40] mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingTask.description || ''}
                      onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-[#343A40]/10 focus:outline-none focus:border-[#FF6B6B] h-24 text-[#343A40]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#343A40] mb-1">
                      Category
                    </label>
                    <select
                      value={editingTask.category || ''}
                      onChange={(e) => setEditingTask({...editingTask, category: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-[#343A40]/10 focus:outline-none focus:border-[#FF6B6B] text-[#343A40]"
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#343A40] mb-1">
                      Priority
                    </label>
                    <select
                      value={editingTask.priority || 'medium'}
                      onChange={(e) => setEditingTask({...editingTask, priority: e.target.value as Task['priority']})}
                      className="w-full px-3 py-2 rounded-lg border border-[#343A40]/10 focus:outline-none focus:border-[#FF6B6B] text-[#343A40]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#343A40] mb-1">
                      Progress
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editingTask.progress || 0}
                      onChange={(e) => setEditingTask({...editingTask, progress: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <div className="text-right text-sm text-[#343A40]/60">
                      {editingTask.progress || 0}%
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#343A40] mb-1">
                      Assignee
                    </label>
                    <select
                      value={editingTask.assigneeId || ''}
                      onChange={(e) => setEditingTask({...editingTask, assigneeId: e.target.value || undefined})}
                      className="w-full px-3 py-2 rounded-lg border border-[#343A40]/10 focus:outline-none focus:border-[#FF6B6B] text-[#343A40]"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} {member.role ? `(${member.role})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      onClick={() => handleTaskDelete(editingTask.id)}
                      className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleTaskSave(editingTask)}
                      className="px-4 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#FF6B6B]/90 transition-colors font-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <div className="mt-8 text-center text-[#343A40]/60">
          <p>Click and drag to create a new task. Click a task to edit details.</p>
        </div>
      </div>
    </main>
  );
} 