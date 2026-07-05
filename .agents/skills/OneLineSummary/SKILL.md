---
name: One-Line Summary Styles and Layouts
description: Principles, markup patterns, and shared global CSS classes for displaying catalog objects as a consistent one-line summary preview that can be toggled/expanded into a detailed card or section card.
---

# One-Line Summary Styles and Layouts

This skill governs the presentation of collapsible summaries and sectioned panels in frontend catalog interfaces, ensuring high-density layouts and visual uniformity across the application.

## Core CSS Classes (Global)

All components implementing a collapsible one-line summary or nested cards must use the shared CSS classes defined in [styles.css](file:///Users/edwardblurock/git/WorkFlowProject/manager-frontend/src/styles.css):

### 1. One-Line Collapsible Bar
- **`.one-line-summary-row`**: The container row for the collapsed state. It features a flex alignment, subtle hover transitions, rounded corners, and spacing.
- **`.one-line-summary-text`**: Container wrapper for badge and title text, aligned left with flex wrapping.
- **`.one-line-summary-badge`**: Rounded pill badge specifying the class name or type. Supported color modifiers:
  - `.badge-green`: Green pill for activity records (`badge-green`).
  - `.badge-indigo`: Purple pill for transaction events (`badge-indigo`).
  - `.badge-blue`: Blue pill for metadata attributes (`badge-blue`).
  - `.badge-gray`: Slate pill for general attributes (`badge-gray`).
- **`.one-line-summary-title`**: Semibold title text for the row.
- **`.one-line-summary-placeholder`**: Italic gray text used when the primary title or name is missing/empty.

### 2. Expanded Card Panels
- **`.one-line-summary-card`**: The container card for the expanded view.
- **`.one-line-summary-card-header`**: Header block separating the title and collapse toggle buttons.
- **`.one-line-summary-card-title`**: Title text displaying block details in bold uppercase.

### 3. Nested Section Cards
- **`.summary-section-card`**: Small, zero-elevation card wrapping nested sub-sections (using `<mat-card>`).
- **`.summary-section-card-header`**: Compact gray background header separating titles and icons (applied directly to `<mat-card-header>`).
- **`.summary-section-card-title`**: Uppercase metadata sub-headings (applied directly to `<mat-card-title>`).
- **`.summary-section-card-content`**: Small padding content wrapper (applied directly to `<mat-card-content>`).

---

## Standard Template Pattern

When implementing a new custom catalog interface, follow this markup structure:

```html
<div class="metadata-container">
  <!-- 1. Collapsed State -->
  <div class="one-line-summary-row" *ngIf="!expanded">
    <div class="one-line-summary-text">
      <mat-icon color="primary">settings</mat-icon>
      <span class="one-line-summary-badge badge-blue">Transaction Metadata</span>
      <span class="one-line-summary-title" *ngIf="value?.['dcterms:creator']">Owner: {{ value?.['dcterms:creator'] }}</span>
      <span class="one-line-summary-placeholder" *ngIf="!value?.['dcterms:creator']">No Creator Info</span>
    </div>
    <button mat-icon-button (click)="toggleExpand()" matTooltip="View details" type="button">
      <mat-icon>visibility</mat-icon>
    </button>
  </div>

  <!-- 2. Expanded State -->
  <div class="one-line-summary-card" *ngIf="expanded">
    <div class="one-line-summary-card-header">
      <div class="one-line-summary-card-title">
        <mat-icon color="primary">settings</mat-icon>
        <span>Transaction Metadata Details</span>
      </div>
      <button mat-icon-button (click)="toggleExpand()" matTooltip="Collapse details" type="button">
        <mat-icon>visibility_off</mat-icon>
      </button>
    </div>
    
    <mat-divider style="margin-bottom: 12px;"></mat-divider>
    
    <div class="grid-section metadata-section">
      <!-- Detailed form field structures / grids go here -->
    </div>
  </div>
</div>
```

---

## Spacing & Density Rules

1. **Host Element Width**:
   Every custom layout component must define the following block display rules in its styles configuration:
   ```css
   :host {
     display: block;
     width: 100% !important;
   }
   ```
2. **Form Field Density & Subscripts**:
   To reduce the padding/margin between rows to the absolute minimum, components containing form fields should hide the subscript wrappers (reserved spaces for errors) in their local stylesheet using `::ng-deep`:
   ```css
   ::ng-deep .metadata-section .mat-mdc-form-field-subscript-wrapper {
     display: none !important;
   }
   ::ng-deep .metadata-section .mat-mdc-form-field {
     margin-bottom: 0px !important;
   }
   ```
