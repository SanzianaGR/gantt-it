"client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TeamMember {
  id: string;
  name: string;
  color: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  assigneeId?: string;
  description?: string;
  progress?: number;
  priority?: "low" | "medium" | "high" | "critical";
  y?: number; // Canvas Y position
}

interface TimelineConfig {
  startDate: Date;
  timeUnit: "days" | "weeks" | "months";
  unitsToShow: number;
  unitWidth: number;
}

const TASK_HEIGHT = 32;
const HEADER_HEIGHT = 80;
const TASK_SPACING = 8;
const MIN_TASK_WIDTH = 100;

const TEAM_COLORS = ["#FF6B6B", "#343A40", "#FF6B6B", "#343A40", "#FF6B6B"];

const PRIORITY_COLORS = {
  low: "#343A40",
  medium: "#FF6B6B",
  high: "#FF6B6B",
  critical: "#343A40",
};

export default function GanttItOne() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTimelineConfig, setShowTimelineConfig] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [panOffset, setPanOffset] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [timelineConfig, setTimelineConfig] = useState<TimelineConfig>({
    startDate: new Date(),
    timeUnit: "days",
    unitsToShow: 30,
    unitWidth: 100,
  });

  // Sample data
  useEffect(() => {
    const sampleMembers: TeamMember[] = [
      {
        id: "1",
        name: "Sarah Chen",
        role: "Project Manager",
        color: TEAM_COLORS[0],
      },
      {
        id: "2",
        name: "Alex Rodriguez",
        role: "Lead Developer",
        color: TEAM_COLORS[1],
      },
      {
        id: "3",
        name: "Maya Patel",
        role: "UI/UX Designer",
        color: TEAM_COLORS[2],
      },
      {
        id: "4",
        name: "David Kim",
        role: "Backend Developer",
        color: TEAM_COLORS[3],
      },
    ];

    const today = new Date();
    const sampleTasks: Task[] = [
      {
        id: "1",
        title: "Project Planning & Research",
        startDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        assigneeId: "1",
        progress: 80,
        priority: "high",
        y: 0,
      },
      {
        id: "2",
        title: "UI/UX Design System",
        startDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
        assigneeId: "3",
        progress: 45,
        priority: "medium",
        y: 1,
      },
      {
        id: "3",
        title: "Backend API Development",
        startDate: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
        assigneeId: "4",
        progress: 20,
        priority: "critical",
        y: 2,
      },
    ];

    setTeamMembers(sampleMembers);
    setTasks(sampleTasks);
  }, []);

  const getTimeUnitMs = () => {
    switch (timelineConfig.timeUnit) {
      case "days":
        return 24 * 60 * 60 * 1000;
      case "weeks":
        return 7 * 24 * 60 * 60 * 1000;
      case "months":
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  };

  const formatTimeUnit = (date: Date, index: number) => {
    const unitDate = new Date(
      timelineConfig.startDate.getTime() + index * getTimeUnitMs()
    );

    switch (timelineConfig.timeUnit) {
      case "days":
        return {
          main: unitDate.getDate().toString(),
          sub: unitDate.toLocaleDateString("en-US", { weekday: "short" }),
        };
      case "weeks":
        return {
          main: `Week ${Math.ceil(
            (unitDate.getTime() -
              new Date(unitDate.getFullYear(), 0, 1).getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          )}`,
          sub: `${unitDate.getMonth() + 1}/${unitDate.getDate()}`,
        };
      case "months":
        return {
          main: unitDate.toLocaleDateString("en-US", { month: "short" }),
          sub: unitDate.getFullYear().toString(),
        };
      default:
        return { main: "", sub: "" };
    }
  };

  const dateToX = (date: Date) => {
    const diffMs = date.getTime() - timelineConfig.startDate.getTime();
    const units = diffMs / getTimeUnitMs();
    return units * timelineConfig.unitWidth * zoomLevel + panOffset;
  };

  const xToDate = (x: number) => {
    const adjustedX = x - panOffset;
    const units = adjustedX / (timelineConfig.unitWidth * zoomLevel);
    return new Date(
      timelineConfig.startDate.getTime() + units * getTimeUnitMs()
    );
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw timeline header
    ctx.fillStyle = "#F8F9FA";
    ctx.fillRect(0, 0, rect.width, HEADER_HEIGHT);

    // Draw time units
    for (let i = 0; i < timelineConfig.unitsToShow; i++) {
      const x = i * timelineConfig.unitWidth * zoomLevel + panOffset;
      if (x > rect.width) break;
      if (x < -timelineConfig.unitWidth * zoomLevel) continue;

      const unitInfo = formatTimeUnit(timelineConfig.startDate, i);
      const isToday =
        timelineConfig.timeUnit === "days" &&
        new Date(
          timelineConfig.startDate.getTime() + i * getTimeUnitMs()
        ).toDateString() === new Date().toDateString();

      // Draw unit background
      if (isToday) {
        ctx.fillStyle = "#FF6B6B";
        ctx.fillRect(x, 0, timelineConfig.unitWidth * zoomLevel, HEADER_HEIGHT);
      }

      // Draw unit border
      ctx.strokeStyle = "#343A40";
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Draw unit text
      ctx.fillStyle = isToday ? "#FFFFFF" : "#343A40";
      ctx.font = "bold 14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(
        unitInfo.main,
        x + (timelineConfig.unitWidth * zoomLevel) / 2,
        35
      );

      ctx.font = "12px system-ui";
      ctx.globalAlpha = 0.7;
      ctx.fillText(
        unitInfo.sub,
        x + (timelineConfig.unitWidth * zoomLevel) / 2,
        55
      );
      ctx.globalAlpha = 1;
    }

    // Draw tasks
    [...tasks, previewTask].filter(Boolean).forEach((task) => {
      if (!task) return;

      const startX = dateToX(task.startDate);
      const endX = dateToX(task.endDate);
      const width = Math.max(MIN_TASK_WIDTH, endX - startX);
      const y =
        HEADER_HEIGHT + 20 + (task.y || 0) * (TASK_HEIGHT + TASK_SPACING);

      const assignee = teamMembers.find((m) => m.id === task.assigneeId);
      const taskColor =
        task.id === "preview"
          ? "#FF6B6B"
          : assignee?.color || PRIORITY_COLORS[task.priority || "medium"];

      // Draw task background
      ctx.fillStyle = task.id === "preview" ? "#FF6B6B" : taskColor;
      ctx.globalAlpha = task.id === "preview" ? 0.6 : 1;

      // Rounded rectangle
      const radius = 8;
      ctx.beginPath();
      ctx.roundRect(startX, y, width, TASK_HEIGHT, radius);
      ctx.fill();

      // Draw progress bar
      if (task.progress && task.progress > 0 && task.id !== "preview") {
        ctx.fillStyle = "#FFFFFF";
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.roundRect(
          startX,
          y,
          (width * task.progress) / 100,
          TASK_HEIGHT,
          radius
        );
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      // Draw task text
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 13px system-ui";
      ctx.textAlign = "left";

      // Clip text to task width
      ctx.save();
      ctx.beginPath();
      ctx.rect(startX + 12, y, width - 24, TASK_HEIGHT);
      ctx.clip();

      ctx.fillText(task.title, startX + 12, y + 20);

      if (assignee && task.id !== "preview") {
        ctx.font = "11px system-ui";
        ctx.globalAlpha = 0.9;
        ctx.fillText(assignee.name, startX + 12, y + 32);
      }

      ctx.restore();
      ctx.globalAlpha = 1;

      // Draw priority indicator
      if (task.priority === "critical" && task.id !== "preview") {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(startX + width - 15, y + 10, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw current date line
    if (timelineConfig.timeUnit === "days") {
      const nowX = dateToX(new Date());
      if (nowX >= 0 && nowX <= rect.width) {
        ctx.strokeStyle = "#FF6B6B";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(nowX, HEADER_HEIGHT);
        ctx.lineTo(nowX, rect.height);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
      }
    }
  }, [tasks, teamMembers, timelineConfig, panOffset, zoomLevel, previewTask]);

  useEffect(() => {
    const animate = () => {
      drawCanvas();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawCanvas]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing task
    const clickedTask = tasks.find((task) => {
      const startX = dateToX(task.startDate);
      const endX = dateToX(task.endDate);
      const width = Math.max(MIN_TASK_WIDTH, endX - startX);
      const taskY =
        HEADER_HEIGHT + 20 + (task.y || 0) * (TASK_HEIGHT + TASK_SPACING);

      return (
        x >= startX &&
        x <= startX + width &&
        y >= taskY &&
        y <= taskY + TASK_HEIGHT
      );
    });

    if (clickedTask) {
      setSelectedTask(clickedTask);
      setShowTaskModal(true);
      return;
    }

    // Start creating new task if clicking in timeline area
    if (y > HEADER_HEIGHT) {
      setIsDragging(true);
      setDragStart({ x, y });

      const startDate = xToDate(x);
      const rowIndex = Math.floor(
        (y - HEADER_HEIGHT - 20) / (TASK_HEIGHT + TASK_SPACING)
      );

      setPreviewTask({
        id: "preview",
        title: "New Task",
        startDate,
        endDate: new Date(startDate.getTime() + getTimeUnitMs()),
        y: Math.max(0, rowIndex),
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !previewTask) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const startDate = xToDate(dragStart.x);
    const endDate = xToDate(x);

    setPreviewTask({
      ...previewTask,
      startDate: new Date(Math.min(startDate.getTime(), endDate.getTime())),
      endDate: new Date(
        Math.max(startDate.getTime(), endDate.getTime()) + getTimeUnitMs()
      ),
    });
  };

  const handleCanvasMouseUp = () => {
    if (previewTask && previewTask.id === "preview") {
      const newTask: Task = {
        ...previewTask,
        id: Date.now().toString(),
      };
      setTasks((prev) => [...prev, newTask]);
      setSelectedTask(newTask);
      setShowTaskModal(true);
    }

    setIsDragging(false);
    setDragStart(null);
    setPreviewTask(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoomLevel((prev) => Math.max(0.5, Math.min(3, prev * zoomFactor)));
    } else {
      // Pan
      setPanOffset((prev) => prev - e.deltaX - e.deltaY);
    }
  };

  const addTeamMember = (member: Omit<TeamMember, "id" | "color">) => {
    const newMember: TeamMember = {
      ...member,
      id: Date.now().toString(),
      color: TEAM_COLORS[teamMembers.length % TEAM_COLORS.length],
    };
    setTeamMembers((prev) => [...prev, newMember]);
  };

  const handleTaskSave = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const exportToPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvasImg = await html2canvas(canvas, {
        scale: 2,
        backgroundColor: "#FFFFFF",
        useCORS: true,
      });

      const imgData = canvasImg.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvasImg.width, canvasImg.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvasImg.width, canvasImg.height);
      pdf.save(`gantt-it-one-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const exportToPNG = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement("a");
      link.download = `gantt-it-one-${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#FF6B6B" }}
                >
                  <span className="text-white font-bold text-lg">G</span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: "#343A40" }}>
                  GanttIt
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTimelineConfig(true)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                style={{ color: "#343A40" }}
              >
                Configure Timeline
              </button>

              <button
                onClick={() => setShowMemberModal(true)}
                className="px-6 py-3 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                style={{ backgroundColor: "#FF6B6B" }}
              >
                Add Member
              </button>

              <button
                onClick={exportToPDF}
                className="px-6 py-3 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                style={{ backgroundColor: "#FF6B6B" }}
              >
                Export PDF
              </button>

              <button
                onClick={exportToPNG}
                className="px-6 py-3 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                style={{ backgroundColor: "#FF6B6B" }}
              >
                Export PNG
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Team Members */}
        {teamMembers.length > 0 && (
          <div className="mb-6">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "#343A40" }}
            >
              Team Members
            </h3>
            <div className="flex flex-wrap gap-4">
              {teamMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div
                      className="font-semibold text-sm"
                      style={{ color: "#343A40" }}
                    >
                      {member.name}
                    </div>
                    <div
                      className="text-xs opacity-70"
                      style={{ color: "#343A40" }}
                    >
                      {member.role}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Info */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm" style={{ color: "#343A40" }}>
            Timeline: {timelineConfig.startDate.toLocaleDateString()} •{" "}
            {timelineConfig.unitsToShow} {timelineConfig.timeUnit} • Zoom:{" "}
            {Math.round(zoomLevel * 100)}%
          </div>
          <div className="text-xs opacity-70" style={{ color: "#343A40" }}>
            Click and drag to create tasks • Scroll to pan • Ctrl+Scroll to zoom
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair"
            style={{ height: "600px" }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
          />
        </div>
      </div>

      {/* Timeline Configuration Modal */}
      <AnimatePresence>
        {showTimelineConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTimelineConfig(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <TimelineConfigForm
                config={timelineConfig}
                onSave={setTimelineConfig}
                onCancel={() => setShowTimelineConfig(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <TaskEditForm
                task={selectedTask}
                teamMembers={teamMembers}
                onSave={handleTaskSave}
                onDelete={handleTaskDelete}
                onCancel={() => setShowTaskModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Member Modal */}
      <AnimatePresence>
        {showMemberModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMemberModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AddMemberForm
                onSave={addTeamMember}
                onCancel={() => setShowMemberModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Timeline Configuration Form
function TimelineConfigForm({
  config,
  onSave,
  onCancel,
}: {
  config: TimelineConfig;
  onSave: (config: TimelineConfig) => void;
  onCancel: () => void;
}) {
  const [editedConfig, setEditedConfig] = useState(config);

  const handleSave = () => {
    onSave(editedConfig);
    onCancel();
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-8" style={{ color: "#343A40" }}>
        Configure Timeline
      </h3>

      <div className="space-y-6">
        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#343A40" }}
          >
            Start Date
          </label>
          <input
            type="date"
            value={editedConfig.startDate.toISOString().split("T")[0]}
            onChange={(e) =>
              setEditedConfig({
                ...editedConfig,
                startDate: new Date(e.target.value),
              })
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#343A40",
              } as React.CSSProperties
            }
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#343A40" }}
          >
            Time Unit
          </label>
          <select
            value={editedConfig.timeUnit}
            onChange={(e) =>
              setEditedConfig({
                ...editedConfig,
                timeUnit: e.target.value as "days" | "weeks" | "months",
              })
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#343A40",
              } as React.CSSProperties
            }
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#343A40" }}
          >
            Units to Show: {editedConfig.unitsToShow}
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={editedConfig.unitsToShow}
            onChange={(e) =>
              setEditedConfig({
                ...editedConfig,
                unitsToShow: parseInt(e.target.value),
              })
            }
            className="w-full"
            style={{ accentColor: "#FF6B6B" }}
          />
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
            style={{ color: "#343A40" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            Save Timeline
          </button>
        </div>
      </div>
    </div>
  );
}

// Task Edit Form Component (keeping existing implementation)
function TaskEditForm({
  task,
  teamMembers,
  onSave,
  onDelete,
  onCancel,
}: {
  task: Task;
  teamMembers: TeamMember[];
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}) {
  const [editedTask, setEditedTask] = useState(task);

  const handleSave = () => {
    onSave(editedTask);
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-8" style={{ color: "#343A40" }}>
        Edit Task
      </h3>

      <div className="space-y-6">
        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#343A40" }}
          >
            Task Title
          </label>
          <input
            type="text"
            value={editedTask.title}
            onChange={(e) =>
              setEditedTask({ ...editedTask, title: e.target.value })
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#343A40",
              } as React.CSSProperties
            }
            placeholder="Enter task title..."
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#343A40" }}
          >
            Description
          </label>
          <textarea
            value={editedTask.description || ""}
            onChange={(e) =>
              setEditedTask({ ...editedTask, description: e.target.value })
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-opacity-50 h-24 resize-none transition-all duration-200"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#343A40",
              } as React.CSSProperties
            }
            placeholder="Add task description..."
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#343A40" }}
          >
            Assignee
          </label>
          <select
            value={editedTask.assigneeId || ""}
            onChange={(e) =>
              setEditedTask({
                ...editedTask,
                assigneeId: e.target.value || undefined,
              })
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#343A40",
              } as React.CSSProperties
            }
          >
            <option value="">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#343A40" }}
          >
            Progress: {editedTask.progress || 0}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={editedTask.progress || 0}
            onChange={(e) =>
              setEditedTask({
                ...editedTask,
                progress: parseInt(e.target.value),
              })
            }
            className="w-full"
            style={{ accentColor: "#FF6B6B" }}
          />
        </div>

        <div className="flex justify-between pt-6">
          <button
            onClick={() => onDelete(editedTask.id)}
            className="px-6 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 font-semibold"
            style={{ color: "#FF6B6B" }}
          >
            Delete Task
          </button>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
              style={{ color: "#343A40" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
              style={{ backgroundColor: "#FF6B6B" }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Member Form Component (keeping existing implementation)
function AddMemberForm({
  onSave,
  onCancel,
}: {
  onSave: (member: Omit<TeamMember, "id" | "color">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const handleSave = () => {
    if (!name.trim() || !role.trim()) return;
    onSave({ name: name.trim(), role: role.trim() });
    onCancel();
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-8" style={{ color: "#343A40" }}>
        Add Team Member
      </h3>

      <div className="space-y-6">
        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#343A40" }}
          >
            Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#343A40",
              } as React.CSSProperties
            }
            placeholder="Enter full name..."
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#343A40" }}
          >
            Role *
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#343A40",
              } as React.CSSProperties
            }
            placeholder="e.g. Frontend Developer, Designer..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
            style={{ color: "#343A40" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !role.trim()}
            className="px-8 py-3 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}
