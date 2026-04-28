# Mobile Job Board Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the mobile Job Board view by making job cards more compact and adding an expand/collapse toggle to reveal hidden contextual notes.

**Architecture:** We will modify the `JobCard` component to introduce local state (`isExpanded`) to handle the visibility of the notes section on mobile (`< md` screens). We will also add responsive classes to adjust the spacing and font-size of the tags to save vertical space. The notes section will change its visibility classes from `hidden 2xl:block` to `hidden md:block`, or visible if `isExpanded` is true.

**Tech Stack:** React, Tailwind CSS, Lucide React

---

### Task 1: Add Expandable State & Responsive Notes to JobCard

**Files:**
- Modify: `src/components/JobCard.tsx`

- [x] **Step 1: Add state to track expansion**
```tsx
// Inside JobCard component:
const [isExpanded, setIsExpanded] = useState(false);
```

- [x] **Step 2: Update notes container visibility**
Change the `div` wrapping the notes from:
```tsx
<div className="hidden 2xl:block mb-2 2xl:mb-3">
```
To:
```tsx
<div className={`mb-2 2xl:mb-3 ${isExpanded ? 'block' : 'hidden md:block'}`}>
```

- [x] **Step 3: Add an expand/collapse toggle button for mobile**
Add this button right before the "View Details" button, visible only on small screens:
```tsx
{job.notes && (
    <button
        onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
        }}
        className="md:hidden w-full flex items-center justify-center py-1 mb-1 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary transition-colors"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse notes" : "Expand notes"}
    >
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
)}
```

### Task 2: Optimize Tag Sizes for Mobile

**Files:**
- Modify: `src/components/JobCard.tsx`

- [x] **Step 1: Reduce padding and font size for the Salary tag on mobile**
Change the salary `span` className from:
```tsx
className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded"
```
To:
```tsx
className="px-1.5 py-0.5 md:px-2 md:py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider rounded"
```

- [x] **Step 2: Reduce padding and font size for the Remote tag on mobile**
Change the remote `span` className from:
```tsx
className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded dark:border dark:border-primary/20"
```
To:
```tsx
className="px-1.5 py-0.5 md:px-2 md:py-1 bg-primary/10 text-primary text-[9px] md:text-[10px] font-bold uppercase tracking-wider rounded dark:border dark:border-primary/20"
```
