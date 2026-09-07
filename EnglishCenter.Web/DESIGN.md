# Design System & Visual Architecture: EnglishCenter.Web

## 1. Incumbent Visual Baseline & Critique
The legacy interface suffered from several critical visual and architectural deficiencies:
1. **Contaminated Global Styles**: `index.css` still enforced default Vite template styles (`#root` width constrained to 1126px, centered layout, purple branding lines, negative tracking `letter-spacing: -0.05em`).
2. **Missing App Shell**: Navigation was fragmented. Topbars only existed on dashboards; management list and detail pages lacked sidebars and had inconsistent breadcrumb/back links.
3. **Arbitrary Color Swatches**: Each dashboard used a completely different hardcoded brand color without system coherence (`#1e293b` for Admin, `#0f766e` for Staff, `#1d4ed8` for Teacher, `#7c3aed` for Student).
4. **Style Duplication**: Every page and component defined private, repeated `React.CSSProperties` objects with slight variations in radii, shadows, and paddings.
5. **Numeric Presentation**: Currency and durations lacked dedicated alignment rules; monospace was either overused or absent.

## 2. Target Visual Direction: Modern Education Management SaaS
- **Tone**: Authoritative, clean, educational, trustworthy, and focused on operational clarity.
- **Philosophy**: Low cognitive load, high information density without visual clutter, zero gratuitous AI styling (no random glowing gradients or decorative cards).

## 3. Design Tokens (CSS Variables)

```css
:root {
  /* Surfaces & Backgrounds */
  --color-canvas: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-subtle: #f1f5f9;
  --color-surface-hover: #f8fafc;
  
  /* Borders */
  --color-border: #e2e8f0;
  --color-border-subtle: #f1f5f9;
  --color-border-strong: #cbd5e1;
  
  /* Typography */
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;
  
  /* Brand / Primary */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-subtle: #eff6ff;
  --color-primary-border: #bfdbfe;
  
  /* Semantic Statuses */
  --status-active-text: #15803d;
  --status-active-bg: #dcfce7;
  --status-active-border: #bbf7d0;

  --status-inactive-text: #475569;
  --status-inactive-bg: #f1f5f9;
  --status-inactive-border: #e2e8f0;

  --status-warning-text: #b45309;
  --status-warning-bg: #fef3c7;
  --status-warning-border: #fde68a;

  --status-danger-text: #b91c1c;
  --status-danger-bg: #fee2e2;
  --status-danger-border: #fecaca;
  
  /* Roles */
  --role-admin-text: #7e22ce;
  --role-admin-bg: #f3e8ff;
  --role-staff-text: #0f766e;
  --role-staff-bg: #ccfbf1;
  --role-teacher-text: #1d4ed8;
  --role-teacher-bg: #dbeafe;
  --role-student-text: #b45309;
  --role-student-bg: #fef3c7;

  /* Elevation & Shadows */
  --shadow-xs: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.1), 0 1px 2px -1px rgba(15, 23, 42, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.1);

  /* Radii */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;
}
```

## 4. Typography & Numeric Guidelines
- **Typography Stack**: Standard system sans-serif with native Vietnamese diacritics support (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`).
- **Tracking Rule**: Avoid extreme negative letter-spacing (`letter-spacing: -0.05em` is forbidden). Headings use normal or slightly optical `-0.015em`.
- **Numbers & Currency**: All currency values (`TuitionFee`), financial figures, and numeric columns use `font-variant-numeric: tabular-nums` to ensure columnar alignment. Never render currency in monospace.
- **Monospace Usage**: Monospace (`ui-monospace, SFMono-Regular, Consolas, monospace`) is strictly reserved for technical code identifiers (`StudentCode`, `TeacherCode`, `CourseCode`).

## 5. Layout & Shell Architecture
- **AppShell**: Single-level layout wrapping authenticated screens. Contains:
  - Sidebar: fixed/collapsible with clean dark or crisp light surface, clear active route highlighting.
  - Topbar: sticky header displaying active role badge, user identity (`FullName`, `Email`), breadcrumb tracker, password change link, and sign out button.
  - Workspace: responsive container with comfortable horizontal padding and maximum readable width.
- **Zero Nested Shells**: Exactly one shell per authenticated screen.
- **Presentation Isolation**: Sidebar links reflect visibility rules only; actual access control is guarded by `RoleRoute` and backend authorization.

## 6. Data Presentation & Forms
- **Tables**: Clean border-collapse layout, subtle hover state on rows, right-aligned numbers with `tabular-nums`, left-aligned text, center/right-aligned actions.
- **Forms**: Clean vertical rhythm (1rem - 1.25rem gap), distinct section cards, explicit required markers (`*`), clear input focus rings (`#2563eb`), disabled styling for immutable fields.
- **Modals & Dialogs**: Centered overlay, clear danger/confirmation button hierarchy, non-optimistic mutation feedback.
