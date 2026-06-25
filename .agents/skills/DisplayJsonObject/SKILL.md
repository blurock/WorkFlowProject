---
name: Display of JSON Objects
description: Principles for displaying complex JSON catalog objects on a single preview line with a toggleable eye button for full editing, specifically for ParameterSpecification and JThermodynamicMolarQuantities.
---

# My Skill

This skill governs the visual representation of complex JSON catalog objects in the frontend, defining a consistent pattern for preview/edit toggle functionality.

## Core Principles

1. **Default Preview State**:
   Complex JSON objects (such as those representing thermodynamic properties or specifications) should be rendered by default on a single, read-only line showing typical summary details, alongside a toggle button with an "eye" icon (`visibility` or `visibility_off`).
2. **Toggle to Expanded State**:
   Clicking the eye icon button transitions the component to its expanded state, showing the detailed, fully editable form fields.
3. **Subclasses of `ParameterSpecification`**:
   - Single line preview shows: `<Label> (<Units>)` (e.g., `Enthalpy (kcal/mol)`).
   - Differentiate each subclass to extract its subclass-specific label and unit identifier.
4. **Subclasses of `JThermodynamicMolarQuantities`**:
   - Single line preview shows: `<Label>: <Value> <Units>` (e.g., `Standard Enthalpy: 9.19 kcal/mol`).
   - The value is derived from the `dataset:ValueAsString` property.
   - Differentiate subclasses to extract subclass-specific labels and units.
   - Detailed expanded view displays the nested `qb:ComponentSpecification` property (using `ParameterSpecificationComponent`) along with inputs for `ValueAsString` and `standardUncertainty`.
5. **Full Line Width Layout**:
   - A JSON object component (both in its collapsed preview state and its expanded detailed state) must always occupy the full width of its container (a full line). 
   - This ensures the single-line summary reads clearly from left to right and aligned controls (like the eye icon button) sit properly on the right margin. This is achieved by defining `:host { display: block; width: 100% !important; }` in the component's CSS.

## How to Use It

- Differentiate class templates based on ontology properties (e.g. `dataset:objectype` or class name).
- Register custom visualization components in [interfaces.registry.ts](file:///Users/edwardblurock/git/WorkFlowProject/manager-frontend/src/app/features/catalog/interfaces/interfaces.registry.ts) so `<app-dynamic-primitive>` automatically resolves them.
