import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  priority?: "low" | "medium" | "high" | "critical";
  y?: number;
}

interface TimelineConfig {
  startDate: Date;
  timeUnit: "days" | "weeks" | "months";
  unitsToShow: number;
  unitWidth: number;
}

const TASK_HEIGHT = 44; // Made thicker
const HEADER_HEIGHT = 80;
const TASK_SPACING = 10;
const MIN_TASK_WIDTH = 120;

// Beautiful color palette
const TEAM_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8C471",
  "#82E0AA",
  "#F1948A",
  "#85C1E9",
  "#D2B4DE",
  "#A3E4D7",
  "#F9E79F",
  "#AED6F1",
  "#A9DFBF",
  "#F5B7B1",
];

const PRIORITY_COLORS = {
  low: "#4ECDC4",
  medium: "#FF6B6B",
  high: "#FFA07A",
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
      { id: "5", name: "Emma Wilson", color: TEAM_COLORS[4] }, // No role
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

    // Draw timeline header with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, HEADER_HEIGHT);
    gradient.addColorStop(0, "#FAFBFC");
    gradient.addColorStop(1, "#F4F6F8");
    ctx.fillStyle = gradient;
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
        const todayGradient = ctx.createLinearGradient(
          x,
          0,
          x + timelineConfig.unitWidth * zoomLevel,
          HEADER_HEIGHT
        );
        todayGradient.addColorStop(0, "#FF6B6B");
        todayGradient.addColorStop(1, "#FF5252");
        ctx.fillStyle = todayGradient;
        ctx.fillRect(x, 0, timelineConfig.unitWidth * zoomLevel, HEADER_HEIGHT);
      }

      // Draw subtle unit border
      ctx.strokeStyle = "#E0E6ED";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();

      // Draw unit text with better typography
      ctx.fillStyle = isToday ? "#FFFFFF" : "#2D3748";
      ctx.font =
        'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(
        unitInfo.main,
        x + (timelineConfig.unitWidth * zoomLevel) / 2,
        35
      );

      ctx.font =
        '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isToday ? "rgba(255,255,255,0.8)" : "#718096";
      ctx.fillText(
        unitInfo.sub,
        x + (timelineConfig.unitWidth * zoomLevel) / 2,
        55
      );
    }

    // Draw tasks with enhanced styling
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

      // Draw task shadow
      if (task.id !== "preview") {
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.beginPath();
        ctx.roundRect(startX + 2, y + 2, width, TASK_HEIGHT, 12);
        ctx.fill();
      }

      // Draw task background with gradient
      const taskGradient = ctx.createLinearGradient(
        startX,
        y,
        startX,
        y + TASK_HEIGHT
      );
      if (task.id === "preview") {
        taskGradient.addColorStop(0, "rgba(255,107,107,0.6)");
        taskGradient.addColorStop(1, "rgba(255,107,107,0.4)");
      } else {
        taskGradient.addColorStop(0, taskColor);
        taskGradient.addColorStop(1, adjustColorBrightness(taskColor, -20));
      }

      ctx.fillStyle = taskGradient;
      ctx.beginPath();
      ctx.roundRect(startX, y, width, TASK_HEIGHT, 12);
      ctx.fill();

      // Draw progress bar with glass effect
      if (task.progress && task.progress > 0 && task.id !== "preview") {
        const progressGradient = ctx.createLinearGradient(
          startX,
          y,
          startX,
          y + TASK_HEIGHT
        );
        progressGradient.addColorStop(0, "rgba(255,255,255,0.4)");
        progressGradient.addColorStop(1, "rgba(255,255,255,0.2)");
        ctx.fillStyle = progressGradient;
        ctx.beginPath();
        ctx.roundRect(
          startX + 2,
          y + 2,
          ((width - 4) * task.progress) / 100,
          TASK_HEIGHT - 4,
          10
        );
        ctx.fill();
      }

      // Draw task text with better positioning
      ctx.fillStyle = "#FFFFFF";
      ctx.font =
        'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = "left";

      // Clip text to task width
      ctx.save();
      ctx.beginPath();
      ctx.rect(startX + 16, y, width - 32, TASK_HEIGHT);
      ctx.clip();

      ctx.fillText(task.title, startX + 16, y + 22);

      if (assignee && task.id !== "preview") {
        ctx.font =
          '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(assignee.name, startX + 16, y + 36);
      }

      ctx.restore();

      // Draw priority indicator with glow
      if (task.priority === "critical" && task.id !== "preview") {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(startX + width - 20, y + 15, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw current date line with glow effect
    if (timelineConfig.timeUnit === "days") {
      const nowX = dateToX(new Date());
      if (nowX >= 0 && nowX <= rect.width) {
        ctx.shadowColor = "#FF6B6B";
        ctx.shadowBlur = 4;
        ctx.strokeStyle = "#FF6B6B";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(nowX, HEADER_HEIGHT);
        ctx.lineTo(nowX, rect.height);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
      }
    }
  }, [tasks, teamMembers, timelineConfig, panOffset, zoomLevel, previewTask]);

  // Helper function to adjust color brightness
  const adjustColorBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

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
      <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)",
                  }}
                >
                  <span className="text-white font-bold text-lg">G</span>
                </div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: "#1A202C" }}
                >
                  GanttIt
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTimelineConfig(true)}
                className="px-5 py-2.5 text-sm rounded-xl border border-gray-200/80 hover:bg-gray-50/80 transition-all duration-200 font-medium backdrop-blur-sm"
                style={{ color: "#4A5568" }}
              >
                Configure Timeline
              </button>

              <button
                onClick={() => setShowMemberModal(true)}
                className="px-6 py-3 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)",
                }}
              >
                Add Member
              </button>

              <button
                onClick={exportToPDF}
                className="px-6 py-3 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)",
                }}
              >
                Export PDF
              </button>

              <button
                onClick={exportToPNG}
                className="px-6 py-3 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)",
                }}
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
          <div className="mb-8">
            <h3
              className="text-lg font-semibold mb-5"
              style={{ color: "#2D3748" }}
            >
              Team Members
            </h3>
            <div className="flex flex-wrap gap-4">
              {teamMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-sm border border-gray-100/50 hover:shadow-lg transition-all duration-300"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${
                        member.color
                      } 0%, ${adjustColorBrightness(member.color, -15)} 100%)`,
                    }}
                  >
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div
                      className="font-semibold text-sm"
                      style={{ color: "#2D3748" }}
                    >
                      {member.name}
                    </div>
                    {member.role && (
                      <div className="text-xs" style={{ color: "#718096" }}>
                        {member.role}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Info */}
        <div className="mb-6 flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl px-6 py-4 border border-gray-100/50">
          <div className="text-sm font-medium" style={{ color: "#4A5568" }}>
            Timeline: {timelineConfig.startDate.toLocaleDateString()} •{" "}
            {timelineConfig.unitsToShow} {timelineConfig.timeUnit} • Zoom:{" "}
            {Math.round(zoomLevel * 100)}%
          </div>
          <div className="text-xs" style={{ color: "#718096" }}>
            Click and drag to create tasks • Scroll to pan • Ctrl+Scroll to zoom
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 overflow-hidden">
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTimelineConfig(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100/50"
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100/50"
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowMemberModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100/50"
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

// Custom Dropdown Component
function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      {label && (
        <label
          className="block text-sm font-semibold mb-3"
          style={{ color: "#2D3748" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3.5 bg-white/80 border border-gray-200/80 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 backdrop-blur-sm hover:bg-white/90"
          style={
            {
              "--tw-ring-color": "#FF6B6B",
              color: selectedOption ? "#2D3748" : "#A0AEC0",
            } as React.CSSProperties
          }
        >
          <span className="block truncate font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <motion.svg
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5"
              style={{ color: "#A0AEC0" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </motion.svg>
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-100/50 overflow-hidden"
            >
              <div className="py-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50/80 transition-colors duration-150 font-medium ${
                      option.value === value ? "text-white" : "text-gray-900"
                    }`}
                    style={{
                      backgroundColor:
                        option.value === value ? "#FF6B6B" : "transparent",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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

  const timeUnitOptions = [
    { value: "days", label: "Days" },
    { value: "weeks", label: "Weeks" },
    { value: "months", label: "Months" },
  ];

  return (
    <div>
      <h3 className="text-2xl font-bold mb-8" style={{ color: "#1A202C" }}>
        Configure Timeline
      </h3>

      <div className="space-y-6">
        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#2D3748" }}
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
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 font-medium"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#2D3748",
              } as React.CSSProperties
            }
          />
        </div>

        <CustomSelect
          label="Time Unit"
          value={editedConfig.timeUnit}
          onChange={(value) =>
            setEditedConfig({
              ...editedConfig,
              timeUnit: value as "days" | "weeks" | "months",
            })
          }
          options={timeUnitOptions}
        />

        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#2D3748" }}
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
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: "#FF6B6B" }}
          />
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200 font-semibold backdrop-blur-sm"
            style={{ color: "#4A5568" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)",
            }}
          >
            Save Timeline
          </button>
        </div>
      </div>
    </div>
  );
}

// Task Edit Form Component
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

  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...teamMembers.map((member) => ({
      value: member.id,
      label: `${member.name}${member.role ? ` (${member.role})` : ""}`,
    })),
  ];

  return (
    <div>
      <h3 className="text-2xl font-bold mb-8" style={{ color: "#1A202C" }}>
        Edit Task
      </h3>

      <div className="space-y-6">
        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#2D3748" }}
          >
            Task Title
          </label>
          <input
            type="text"
            value={editedTask.title}
            onChange={(e) =>
              setEditedTask({ ...editedTask, title: e.target.value })
            }
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 font-medium"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#2D3748",
              } as React.CSSProperties
            }
            placeholder="Enter task title..."
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#2D3748" }}
          >
            Description
          </label>
          <textarea
            value={editedTask.description || ""}
            onChange={(e) =>
              setEditedTask({ ...editedTask, description: e.target.value })
            }
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm outline-none focus:ring-2 focus:ring-opacity-50 h-24 resize-none transition-all duration-200 font-medium"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#2D3748",
              } as React.CSSProperties
            }
            placeholder="Add task description..."
          />
        </div>

        <CustomSelect
          label="Assignee"
          value={editedTask.assigneeId || ""}
          onChange={(value) =>
            setEditedTask({ ...editedTask, assigneeId: value || undefined })
          }
          options={assigneeOptions}
        />

        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#2D3748" }}
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
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: "#FF6B6B" }}
          />
        </div>

        <div className="flex justify-between pt-6">
          <button
            onClick={() => onDelete(editedTask.id)}
            className="px-6 py-3 rounded-xl hover:bg-red-50/80 transition-all duration-200 font-semibold backdrop-blur-sm"
            style={{ color: "#E53E3E" }}
          >
            Delete Task
          </button>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200 font-semibold backdrop-blur-sm"
              style={{ color: "#4A5568" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)",
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Member Form Component
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
    if (!name.trim()) return;
    onSave({ name: name.trim(), role: role.trim() || undefined });
    onCancel();
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-8" style={{ color: "#1A202C" }}>
        Add Team Member
      </h3>

      <div className="space-y-6">
        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#2D3748" }}
          >
            Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 font-medium"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#2D3748",
              } as React.CSSProperties
            }
            placeholder="Enter full name..."
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "#2D3748" }}
          >
            Role <span style={{ color: "#A0AEC0" }}>(optional)</span>
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 font-medium"
            style={
              {
                "--tw-ring-color": "#FF6B6B",
                color: "#2D3748",
              } as React.CSSProperties
            }
            placeholder="e.g. Frontend Developer, Designer..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200 font-semibold backdrop-blur-sm"
            style={{ color: "#4A5568" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-8 py-3 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{
              background: "linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)",
            }}
          >
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}
