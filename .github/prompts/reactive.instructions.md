# Making the Website Responsive: Comprehensive Instructions

## Overview
This document outlines the **step-by-step process, best practices, and non-negotiable requirements** for refactoring the codebase to ensure the website is fully responsive and accessible across a wide range of devices and screen sizes.

## Before you Begin
  - Document current breakpoints and layout assumptions.
  - Only use default tailwind breakpoints

## Non-negotiables
  - All responsive design must use Tailwind’s breakpoint utilities.
  - You can adjust the current tailwind classes, but don't remove them completely.
  - No fixed pixel widths or heights unless absolutely necessary and justified.
  - No hardcoded font sizes or spacing; always use Tailwind classes.
  - No horizontal scrolling or overflow.
  - Refactor only the page/part that you are explicitly asked to refactor

## Layout Refactoring
- **Turn current layout into a xl breakpoint layout:**
  - The current layout is optimized for an xl breakpoint. First, make all relvant classes apply to the xl breakpoint. Then, use tailwind's responsive classes to adjust the layout for smaller breakpoints.
  - Do not make everything prefixed by breakpoint if its not necessary. For example, `display: flex` should not be prefixed by `xl:` if it is already the default display property.
- **Adopt a mobile-first approach:**
  - Start with the smallest screen size and scale up. 
- **Replace fixed sizes with relative units:**
  - Use `%`, `vw`, `vh`, `rem`, or Tailwind’s responsive classes.
- **Utilize Tailwind’s grid and flex utilities:**
  - Prefer `flex`, `grid`, and `gap-*` for layout.

---

## Component Responsiveness

- **Apply responsive classes to all components:**
  - Use `sm:`, `md:`, `lg:`, etc. for spacing, font sizes, and layout.
- **Stack content vertically on small screens; use columns/grids on larger screens.**
- **Navigation:** Implement a mobile menu (hamburger or drawer) for small screens.
- **Images and media:** Use `max-w-full`, `h-auto`, and responsive aspect ratios.
- **Tables and data:** Stack or scroll horizontally on small screens.

---

## Typography and Spacing

- **Use responsive text and spacing utilities:**
  - Example: `text-base md:text-lg`, `p-4 md:p-8`.

---

## Performance

- **Optimize images for different screen sizes.**
- **Lazy-load non-critical assets.**

**Follow these instructions strictly to ensure a robust, maintainable, and user-friendly responsive website.**