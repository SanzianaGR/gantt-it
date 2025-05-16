# Ganttit Implementation Guide

## Core Principles

### 1. Apple-Inspired Minimalism + shadcn/ui Sleekness
- Single responsibility for each component
- No feature flags or toggles
- No settings or preferences
- No configuration options
- Immediate visual feedback
- Zero state management complexity
- Use shadcn/ui for all interactive elements (buttons, dialogs, inputs) for a modern, accessible, and ultra-sleek look

### 2. Performance Targets
- First meaningful paint: < 1s
- Time to interactive: < 2s
- Task creation: < 100ms
- Task movement: < 16ms (60fps)
- Export generation: < 3s
- Share link generation: < 1s

## Technical Architecture

### 1. Frontend Structure
```
src/
├── app/
│   ├── page.tsx              # Main page
│   └── layout.tsx            # Root layout
├── components/
│   ├── GanttChart.tsx        # Main chart component
│   ├── Task.tsx             # Task component
│   ├── Timeline.tsx         # Timeline grid
│   ├── Controls.tsx         # Minimal controls (use shadcn/ui Button, Dialog)
│   └── ExportDialog.tsx     # Export modal (shadcn/ui Dialog)
├── hooks/
│   ├── useDrag.ts           # Drag and drop
│   ├── useTimeline.ts       # Timeline calculations
│   └── useExport.ts         # Export functionality
└── utils/
    ├── date.ts              # Date utilities
    └── export.ts            # Export utilities
```

### 2. State Management
```typescript
// Minimal state structure
interface Task {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  assignee?: string;
}

interface Chart {
  tasks: Task[];
  startDate: Date;
  endDate: Date;
}
```

## Component Implementation

### 1. GanttChart Component
- Use shadcn/ui Card for the main chart container for subtle elevation and sleekness.
- Use shadcn/ui Button for all actions (add, export, share).
- Use shadcn/ui Dialog for export/share modals.

### 2. Controls Component
```tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function Controls({ onExport, onShare }) {
  return (
    <div className="controls flex gap-2">
      <Button onClick={onExport}>Export</Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Share</Button>
        </DialogTrigger>
        <DialogContent>
          {/* Share link UI here */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### 3. Task Component
- Use shadcn/ui Card or Sheet for task popovers if editing is needed.
- Keep the task bar itself minimal, but use shadcn/ui Tooltip for title on hover (if you want a little extra polish).

### 4. Export Dialog
- Use shadcn/ui Dialog for a modal that appears when exporting, with a progress indicator (shadcn/ui Progress).

## Styling Implementation
- Use Tailwind for layout, spacing, and color.
- Use shadcn/ui for all interactive and feedback elements.
- Use Apple-inspired color palette and spacing.

## Animations
- Use shadcn/ui's built-in transitions for dialogs and buttons.
- Use CSS transform for drag-and-drop (60fps, hardware-accelerated).
- No extra decorative animations.

## Accessibility
- shadcn/ui provides accessible components out of the box (focus rings, keyboard navigation, ARIA attributes).
- High contrast, large touch targets, clear text.

## Example: Minimal Export Dialog
```tsx
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function ExportDialog({ onExport, progress }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Export</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-4">
          <span>Exporting your Gantt chart...</span>
          <Progress value={progress} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Summary of Apple + shadcn/ui Approach
- Use shadcn/ui for all interactive elements for a modern, accessible, and ultra-sleek look
- Keep the UI minimal, with only essential controls visible
- Use Apple-inspired color palette, spacing, and typography
- Use smooth, hardware-accelerated transitions for all movement
- No configuration, no settings, no distractions
- All dialogs, buttons, and feedback use shadcn/ui for consistency and polish

## Drag and Drop Implementation

### 1. Custom Hook
```typescript
// useDrag.ts
const useDrag = (element: HTMLElement) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartY(e.clientY);
    
    // Immediate visual feedback
    element.style.transform = 'scale(1.02)';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    // Smooth movement
    element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.02)`;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    element.style.transform = '';
  };

  return {
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
```

## Export Implementation

### 1. PDF Export
```typescript
// useExport.ts
const useExport = () => {
  const exportToPDF = async () => {
    const chart = document.querySelector('.gantt-chart');
    if (!chart) return;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [chart.offsetWidth, chart.offsetHeight]
    });

    // Convert to canvas
    const canvas = await html2canvas(chart);
    
    // Add to PDF
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      0,
      chart.offsetWidth,
      chart.offsetHeight
    );

    // Download
    pdf.save('gantt-chart.pdf');
  };

  return { exportToPDF };
};
```

## Real-time Collaboration

### 1. WebSocket Implementation
```typescript
// useCollaboration.ts
const useCollaboration = (chartId: string) => {
  const socket = useSocket();

  useEffect(() => {
    socket.emit('join', chartId);
    
    socket.on('taskUpdate', (task: Task) => {
      // Update task immediately
      setTasks(prev => prev.map(t => 
        t.id === task.id ? task : t
      ));
    });

    return () => {
      socket.emit('leave', chartId);
    };
  }, [chartId]);

  return { socket };
};
```

## Performance Optimizations

### 1. Rendering Optimization
```typescript
// GanttChart.tsx
const GanttChart = () => {
  // Use React.memo for static components
  const Timeline = React.memo(() => (
    <div className="timeline">
      {/* Timeline content */}
    </div>
  ));

  // Virtualize tasks for large datasets
  const visibleTasks = useVirtualization(tasks, {
    itemHeight: 32,
    overscan: 5
  });

  return (
    <div className="gantt-chart">
      <Timeline />
      {visibleTasks.map(task => (
        <Task key={task.id} task={task} />
      ))}
    </div>
  );
};
```

### 2. Animation Optimization
```typescript
// Task.tsx
const Task = ({ task }) => {
  // Use CSS transforms for smooth animations
  const style = {
    transform: `translateX(${calculatePosition(task.startDate)}px)`,
    width: `${calculateWidth(task.startDate, task.endDate)}px`,
    willChange: 'transform',
  };

  return (
    <div
      className="task"
      style={style}
    >
      {task.title}
    </div>
  );
};
```

## Error Handling

### 1. Graceful Degradation
```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error">
          <p>Something went wrong.</p>
          <button onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Strategy

### 1. Unit Tests
```typescript
// Task.test.tsx
describe('Task', () => {
  it('renders task with correct position', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-02')
    };

    render(<Task task={task} />);
    
    const element = screen.getByText('Test Task');
    expect(element).toHaveStyle({
      left: '0px',
      width: '100px'
    });
  });
});
```

## Deployment Configuration

### 1. Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

This implementation guide focuses on:
1. Absolute minimalism in code and features
2. Apple-inspired performance and UX
3. Zero configuration approach
4. Immediate visual feedback
5. Smooth animations and transitions
6. Efficient real-time collaboration
7. Optimized rendering and performance
8. Graceful error handling
9. Comprehensive testing
10. Simple deployment

Would you like me to elaborate on any specific aspect of the implementation? 