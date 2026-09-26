# PERSONAL DESIGN SYSTEM — UNIVERSAL UI BLUEPRINT

This design system must be reused for ANY type of project or module. Do NOT assume specific functionality.

## Core Directives
1. **Visual Language**: Minimal, modern, clean, compact, professional, calm. Low visual noise.
2. **Typography**: Use Google Sans (Regular and Medium). **Never use Bold, Italic, or Bold Italic**. Replace heavy fonts with `font-medium` or `font-normal`.
3. **Colors**: Neutral gray foundation. Light mode uses soft neutral backgrounds, Dark mode uses deep neutral backgrounds. One configurable accent color.
4. **NO DECORATIONS**: Avoid gradients (`bg-gradient-`, `from-`, `to-`), glassmorphism, glowing effects, neon effects, excessive shadows, and heavy borders.
5. **Shapes**: Soft default corner radius (8–12px, e.g., `rounded-lg`). Do not make everything extremely rounded (no excessive `rounded-full` pills except where highly functional).
6. **Spacing**: Default to compact. Consistent layout scaling.
7. **Borders & Dividers**: Subtle solid 1px borders (`border border-neutral-200`). Use sparingly.
8. **Shadows**: Soft/subtle. Use `shadow-sm` or `shadow-md` max. Avoid dramatic shadows.
9. **Icons**: Lucide SVG outline icons only.
10. **Buttons & States**: Primary (Solid accent), Secondary (Outline), Minor (Ghost). States include hover/focus/disabled. No scaling effects (`hover:scale-` is banned).
11. **Animations**: Minimal. No bouncing, large scaling, or decorative movement.

Always ensure responsive layout and high readability. Ensure any new UI aligns precisely with these rules.
