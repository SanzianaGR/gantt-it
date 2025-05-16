# Ganttit Project Tasklist

## MVP Tasks (Detailed)

### 1. Project Setup
- [ ] Initialize a new Next.js project (`npx create-next-app@latest`)
- [ ] Set up TypeScript support (if not chosen during init)
- [ ] Install TailwindCSS (`npm install -D tailwindcss postcss autoprefixer`)
- [ ] Configure TailwindCSS (`npx tailwindcss init -p`)
- [ ] Set up Tailwind in `globals.css` and `tailwind.config.js`
- [ ] Install shadcn/ui (`npx shadcn-ui@latest init`)
- [ ] Add shadcn/ui Button, Dialog, Progress, Tooltip, Card, Sheet components
- [ ] Clean up default Next.js boilerplate
- [ ] Set up a clean, minimal layout in `app/layout.tsx`
- [ ] Set up favicon and Apple-inspired meta tags

### 2. Minimal Gantt Chart Layout
- [ ] Create `GanttChart` component
- [ ] Create a horizontal timeline grid (`Timeline` component)
- [ ] Define minimal `Task` type (id, title, startDate, endDate, assignee?)
- [ ] Render tasks as simple bars on the timeline
- [ ] Use absolute positioning for tasks
- [ ] Style timeline and tasks with Tailwind for minimal, clean look
- [ ] Ensure timeline is scrollable if tasks overflow

### 3. Task Creation, Movement, and Resizing
- [ ] Add a floating shadcn/ui Button to create a new task
- [ ] Implement click-to-create task at current timeline position
- [ ] Implement drag-and-drop for moving tasks horizontally
- [ ] Implement drag handles for resizing task start/end
- [ ] Use a custom `useDrag` hook for smooth, performant dragging
- [ ] Provide immediate visual feedback during drag
- [ ] Snap tasks to timeline grid (days/weeks)
- [ ] Allow editing task title inline (shadcn/ui Input or Sheet)

### 4. Timeline Grid
- [ ] Render date markers (days/weeks) along the top
- [ ] Highlight current day
- [ ] Keep grid minimal (no extra lines or colors)
- [ ] Make timeline responsive to window size
- [ ] Allow horizontal scrolling for long timelines

### 5. Export Functionality
- [ ] Add shadcn/ui Button for export
- [ ] Use `html2canvas` to capture the chart as PNG
- [ ] Use `jsPDF` to export the chart as PDF
- [ ] Show shadcn/ui Dialog with Progress during export
- [ ] Download file automatically after export
- [ ] Handle export errors gracefully

### 6. One-Click Share Link (Ephemeral, WebSocket-Based)
- [ ] Add shadcn/ui Button for sharing
- [ ] Generate a unique, random chart ID (UUID)
- [ ] Use Next.js API route to create ephemeral session (in-memory or Redis)
- [ ] Implement WebSocket server (Socket.io or ws) for real-time sync
- [ ] On share, copy link to clipboard (shadcn/ui Dialog)
- [ ] On open via link, join the correct chart session
- [ ] Sync all task changes in real-time via WebSocket
- [ ] Support two roles: viewer and editor (based on link)
- [ ] Destroy session when all users leave or after timeout

### 7. shadcn/ui for All Interactive Elements
- [ ] Use shadcn/ui Button for all actions (add, export, share)
- [ ] Use shadcn/ui Dialog for modals (export, share)
- [ ] Use shadcn/ui Progress for export progress
- [ ] Use shadcn/ui Tooltip for task title (optional, minimal)
- [ ] Use shadcn/ui Card/Sheet for any popovers or quick edits

### 8. Responsiveness
- [ ] Test layout on mobile, tablet, and desktop
- [ ] Ensure timeline and tasks are touch-draggable on mobile
- [ ] Make controls accessible and usable on all screen sizes
- [ ] Use Tailwind responsive utilities for spacing and sizing

### 9. Apple-Inspired Minimal Styling
- [ ] Use Apple-inspired color palette (soft red, white, gray)
- [ ] Use system font stack for typography
- [ ] Keep all UI elements flat, clean, and borderless
- [ ] Use subtle shadows only where needed (e.g., dialogs)
- [ ] Avoid unnecessary gradients, icons, or decorations
- [ ] Use large touch targets and clear, readable text

### 10. Accessibility & Testing
- [ ] Ensure all buttons and controls are keyboard accessible
- [ ] Add focus rings and ARIA labels where needed
- [ ] Test with screen reader (VoiceOver, NVDA, etc.)
- [ ] Write unit tests for core components (GanttChart, Task, Timeline)
- [ ] Write integration tests for drag-and-drop and export
- [ ] Test real-time sync with multiple users

## Nice-to-Have (Post-MVP)

### 1. Task Popover for Quick Edit
- [ ] Use shadcn/ui Sheet or Dialog for editing task details
- [ ] Allow editing title, dates, and assignee inline

### 2. Tooltip for Task Title
- [ ] Use shadcn/ui Tooltip to show full title on hover

### 3. Progress Indicator for Export
- [ ] Show shadcn/ui Progress bar during export

### 4. Simple Onboarding Hint
- [ ] Show a one-time hint for first-time users (e.g., "Drag to create a task!")

### 5. Light/Dark Mode Toggle
- [ ] Add a toggle for light/dark mode (shadcn/ui Switch)
- [ ] Ensure all components look good in both modes 