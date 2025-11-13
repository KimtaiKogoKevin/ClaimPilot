# AI Insurance Claims Platform - Design Guidelines

## Design Approach
**Carbon Design System** - Optimized for data-heavy enterprise applications with clear information hierarchy and professional credibility essential for insurance industry trust.

## Typography System
- **Primary Font**: IBM Plex Sans (via Google Fonts CDN)
- **Headers**: 2xl-4xl font sizes, font-semibold (600)
- **Body Text**: base-lg sizes, font-normal (400)
- **Data/Numbers**: font-medium (500) for emphasis in tables and analytics
- **Labels**: text-sm, font-medium, uppercase tracking for form fields

## Layout & Spacing Framework
**Tailwind Units**: Use 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- **Page Containers**: max-w-7xl with px-6 lg:px-8
- **Section Padding**: py-8 lg:py-12
- **Card Spacing**: p-6 lg:p-8
- **Component Gaps**: gap-4 to gap-8
- **Grid Columns**: 1 column mobile, 2-3 tablet, 3-4 desktop for dashboards

## Core Components

### Dashboard Layout
**Top Navigation Bar**: Fixed header with logo, role switcher, notifications icon, user profile dropdown. Height h-16, backdrop-blur sticky positioning.

**Sidebar Navigation** (Desktop): Width w-64, collapsible to w-20 icon-only state. Hierarchical menu with parent/child relationships for multi-role access. Include role badge indicator at top.

**Main Content Area**: Grid-based dashboard cards with metric summaries (total claims, pending approvals, average processing time, settlement rates). Use 2x2 grid on desktop, stack on mobile.

### Data Tables
- Sticky headers with sort indicators
- Row hover states for interactivity
- Action buttons (View/Edit/Approve) aligned right
- Status badges with distinct styling (Pending/Approved/Rejected/In Progress)
- Pagination controls bottom-aligned
- Filters and search bar above table
- Responsive: Card-based view on mobile displaying key fields only

### Forms & Claim Submission
**Multi-Step Progress Indicator**: Linear stepper showing (1) Claim Details → (2) Documentation → (3) Review → (4) Submit

**Form Sections**: Group related fields in cards with clear section headers. Two-column layout desktop, single-column mobile.

**Image Upload Zone**: Large dropzone area with drag-and-drop support. Show thumbnails grid for uploaded images with remove option. Display file size and format requirements.

**Form Controls**: Full-width inputs with floating labels, error states below fields, required asterisks, helper text for guidance.

### Analytics Visualizations
**Chart Cards**: Use placeholder divs for chart libraries (Chart.js/Recharts). Include:
- Line charts for claims trends over time
- Bar charts for comparison by category/region
- Donut charts for status distribution
- Stat cards with percentage change indicators

**Filters Panel**: Date range picker, category dropdowns, export button positioned top-right.

### Admin Controls
**User Management Table**: Columns for name, role, status, last active, actions
**Settings Panels**: Tabbed interface (General/Users/Integrations/Security)
**Permission Matrix**: Checkbox grid showing role-based access control

## Mobile-First Responsive Patterns
- **Hamburger Menu**: Slide-out drawer navigation on mobile
- **Bottom Tab Bar**: Quick access to Home/Claims/Analytics/Profile on mobile
- **Cards Stack Vertically**: All multi-column grids collapse to single column
- **Touch Targets**: Minimum 44px height for all interactive elements
- **Horizontal Scrolling Tables**: Wrap tables in overflow-x-auto container on small screens

## Icons
**Heroicons** (via CDN) - Use outline style for navigation, solid for status indicators

## Images

**Dashboard Hero Banner** (if implementing landing/overview page): Full-width 16:9 ratio banner image showing professional insurance team or modern office environment. Height: h-64 lg:h-80. Overlay gradient from dark to transparent. CTA buttons with backdrop-blur-md background.

**Claim Documentation**: Thumbnail grids for uploaded accident photos, documents. Square aspect ratio, object-cover for consistency.

**User Profile Avatars**: Circular images (rounded-full), 40px diameter in navigation, 80px in profile pages.

**Empty States**: Illustration placeholders for "No Claims Yet" or "No Data Available" screens - use SVG illustrations from unDraw or similar.

**Trust Badges**: Display partner insurance company logos in footer or about section, grayscale filter with color on hover.

## Accessibility Standards
- WCAG AA contrast ratios minimum (4.5:1 text, 3:1 UI components)
- Focus indicators with 2px ring offset
- Screen reader labels for icon-only buttons
- Keyboard navigation support throughout
- Form validation with clear error messaging

## Component Hierarchy
1. **Containers** → 2. **Navigation** → 3. **Content Cards** → 4. **Data Tables/Forms** → 5. **Interactive Elements**

Maintain z-index layering: Navigation (50) > Modals (40) > Dropdowns (30) > Content (10)