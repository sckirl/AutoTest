# Corporate Application Design System & UX Guidelines

**Prepared by:** Senior PM & UX Designer AI
**Project:** Secret Enterprise Automation Platform
**Objective:** Define the unified visual language and component architecture for the application. This guide translates Figma designs into a systematic framework that ensures high-fidelity consistency across all modules, emphasizing data density and professional ergonomics.

---

## 1. Design Philosophy
The application embodies a **Modern Enterprise Corporate** aesthetic. The design priorities are:
- **Clarity & Data Density:** High contrast and structured hierarchy for managing complex datasets.
- **Hierarchical Depth:** Clear visual distinction between primary, secondary, and tertiary navigation levels.
- **State-Driven UI:** Semantic coloring (Red, Yellow, Blue) to indicate approval flows, status changes, and critical warnings.

---

## 2. Global Tokens

### 2.1 Color Palette
- **Primary Brand (Blues):**
  - `Primary Action`: **#0D5CAB** (Used for primary buttons, active states, search boxes, inactive tab backgrounds).
  - `Deep Corporate`: **#0F549F** / **#014C8B** (Used for high-emphasis text, active tab text, branding).
  - `Sidebar Base`: **#156DB8** (Used for the navigation rail and multi-level sidebar).
- **Neutrals & Backgrounds:**
  - `App Background`: **#F5F5F5** (Provides neutral contrast against white content cards).
  - `Surface/Card`: **#FFFFFF** (Main content surfaces, active tabs, modals).
  - `Disabled Field`: **#E0E0E0** (Gray background for read-only or locked input fields).
  - `Table Alternate Row`: **#E2E2EB** (Soft grayish-blue for row readability).
- **Semantic & Status Colors:**
  - `Alert/Danger (Red)`: **#C8463F** / **#FF6058** (Warnings, "Hapus" actions, high-priority badges).
  - `Warning (Yellow)`: **#896709** / **#FFF0C8** (Approval pending, informational alerts).
  - `Success/Info (Blue)`: **#0D5CAB** / **#86C7FF** (Mapped states, table headers).

### 2.2 Typography
- **Display & UI Elements:** `Montserrat`
  - Weights: Bold (700) for headers/badges, SemiBold (600) for labels/buttons, Medium/Regular (500/400) for standard UI.
- **Data & Numeric Elements:** `Open Sans`
  - Prioritized for tabular data, pagination, and dense numeric fields to ensure legibility.

---

## 3. Component Specifications

### 3.1 Multi-Level Navigation
- **Sidebar Width:** Standard 80px rail or expanded 387px drawer for deep nesting.
- **Nesting Logic:** 
  - `Parent`: Montserrat Bold, 20px, white or light gray.
  - `Sub-menu`: Montserrat Medium, 18px.
  - `Sub-sub-menu`: Montserrat Medium, 16px, increased left padding (indentation).
- **Status Badges:** Circular or pill-shaped, solid `#FF6058` background with white Bold text (e.g., notification counts).

### 3.2 Tab Navigation
Tabs indicate module-level context switching.
- **Active State:** White background, anchored by an **8px top border** in `#0D5CAB`. Text: 20px, Bold, Deep Blue.
- **Inactive State:** Solid `#0D5CAB` background. Text: 20px, SemiBold, White.

### 3.3 Popup Modals (The "Overlay" Pattern)
Used for creating or editing data without losing page context.
- **Overlay:** Semi-transparent dark gray (`rgba(51,51,51,0.46)`).
- **Container:** White background, 8px border radius, centered on viewport.
- **Header:** Montserrat SemiBold, 24px, `#0D5CAB`. Features a top-right 'X' close icon.
- **Footer/Actions:** Right-aligned buttons. Primary action (solid blue), Secondary/Cancel action (blue outline).

### 3.4 Data Entry & Forms
- **Field Layout:** Labels placed strictly **above** input fields.
- **Labels:** Montserrat SemiBold, 16px, `#65748B`.
- **States:**
  - `Default`: White background, subtle border.
  - `Disabled/Read-Only`: `#E0E0E0` background, `#8D8D8D` text.
  - `Value Text`: Montserrat SemiBold/Medium, 16px, `#333333`.

### 3.5 Semantic Chips & Badges
Small UI elements for status indication.
- **Status Chips:** 
  - `Red`: Background `#FFE1E1`, Text `#A11515`.
  - `Yellow`: Background `#FFF0C8`, Text `#896709`.
  - `Blue`: Background `#86C7FF`, Text `#333333`.
- **Action Chips:** Smaller version (e.g., email tags) in soft gray `#F0EBEB`.

### 3.6 Data Tables
- **Header:** 48px-55px height, `#86C7FF` background. Montserrat SemiBold, 14px.
- **Rows:** 51px height. Alternating zebra stripes using `#E2E2EB`. Montserrat Regular, 16px.
- **Action Icons:** 24px size, centered, using gray or blue depending on state.

---

## 4. Implementation Guidelines
- **Zero-Copy Rule:** Grasp the spacing and hierarchy logic (e.g., consistent 8px/24px/30px gaps) rather than copying absolute pixel positions.
- **Zebra Pattern:** Always use `nth-child(odd)` logic for table backgrounds to maintain readability in dense datasets.
- **CSS Hierarchy:** Prioritize `Montserrat` for all UI branding and `Open Sans` for all business data.

*This document is the single source of truth for the application's visual identity. All new modules must adhere to these tokens to ensure an elite corporate user experience.*