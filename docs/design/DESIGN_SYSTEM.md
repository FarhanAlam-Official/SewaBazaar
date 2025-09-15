# SewaBazaar Design System

## Overview

This document outlines the enhanced design system implemented for SewaBazaar's How It Works, About, and Contact pages. The redesign focuses on modern, responsive design with smooth animations and enhanced user experience.

## Design Principles

### 1. Modern & Responsive Design

- **Consistent Brand Identity**: Maintains existing color scheme and brand elements
- **Professional Layout**: Clean typography, proper spacing, and visual hierarchy
- **Full Responsiveness**: Optimized for mobile, tablet, and desktop experiences
- **Accessibility First**: WCAG compliant with proper focus management and screen reader support

### 2. Animations & Interactivity

- **Smooth Hover Effects**: Subtle animations for buttons, links, and cards
- **Scroll-based Animations**: Content reveals on scroll for engaging storytelling
- **Staggered Elements**: Sequential animations for lists and grids
- **Performance Optimized**: Hardware-accelerated CSS animations

### 3. Enhanced User Experience

- **Interactive Elements**: Hover states, focus indicators, and feedback
- **Progressive Enhancement**: Works without JavaScript, enhanced with it
- **Loading States**: Clear feedback during form submissions and data loading
- **Error Handling**: Inline validation with helpful error messages

## Color System

The design system maintains SewaBazaar's existing color palette while introducing new gradient combinations:

```css
/* Primary Colors */
--indigo-primary: 236 72% 50%;  /* #4F46E5 */
--purple-accent: 265 89% 70%;   /* #9D5CFF */
--blue-secondary: 217 91% 60%;  /* #3B82F6 */
--pearl-white: 226 100% 97%;    /* #F1F5FF */

/* Gradient Combinations */
from-[#8E54E9] to-[#4776E6]     /* Primary gradient */
from-blue-500 to-cyan-500       /* Feature accent */
from-green-500 to-emerald-500   /* Success states */
from-purple-500 to-violet-500   /* Special highlights */
```

## Typography Scale

### Headings

- **Hero (H1)**: `text-5xl lg:text-7xl` (48px-72px)
- **Section (H2)**: `text-4xl lg:text-5xl` (36px-48px)
- **Subsection (H3)**: `text-2xl lg:text-3xl` (24px-30px)
- **Card Title**: `text-xl` (20px)

### Body Text

- **Large Text**: `text-xl lg:text-2xl` (20px-24px)
- **Regular Text**: `text-base` (16px)
- **Small Text**: `text-sm` (14px)
- **Caption**: `text-xs` (12px)

### Font Weights

- **Bold**: `font-bold` (700)
- **Semibold**: `font-semibold` (600)
- **Medium**: `font-medium` (500)
- **Regular**: `font-normal` (400)

## Component Library

### Core Components

#### AnimatedCard

Enhanced card component with built-in hover animations and visual effects.

```tsx
<AnimatedCard 
  hoverEffect=\"lift\" 
  glowOnHover={true}
  delay={200}
  className=\"custom-styles\"
>
  <AnimatedCardContent>
    {/* Content */}
  </AnimatedCardContent>
</AnimatedCard>
```

**Props:**

- `hoverEffect`: 'lift' | 'scale' | 'glow'
- `glowOnHover`: boolean
- `delay`: number (animation delay in ms)
- `onClick`: function

#### AnimatedSection

Container component for scroll-based animations.

```tsx
<AnimatedSection 
  animation=\"fadeInUp\" 
  delay={300}
  threshold={0.1}
>
  {/* Content */}
</AnimatedSection>
```

**Props:**

- `animation`: 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn'
- `delay`: number (ms)
- `threshold`: number (0-1)
- `once`: boolean (animate only once)

#### FloatingLabelInput

Modern input with floating label animation.

```tsx
<FloatingLabelInput
  label=\"Full Name\"
  error={errors.name}
  helperText=\"Enter your complete name\"
  onChange={handleChange}
/>
```

**Props:**

- `label`: string (required)
- `error`: string
- `helperText`: string
- `type`: string ('text', 'email', etc.)

#### InteractiveIcon

Animated icon wrapper with hover effects.

```tsx
<InteractiveIcon 
  size=\"lg\" 
  variant=\"primary\" 
  hoverEffect=\"bounce\"
  onClick={handleClick}
>
  <SearchIcon />
</InteractiveIcon>
```

**Props:**

- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `variant`: 'default' | 'primary' | 'secondary' | 'accent'
- `hoverEffect`: 'scale' | 'bounce' | 'glow' | 'rotate'

#### StaggeredContainer

Container for sequential child animations.

```tsx
<StaggeredContainer 
  staggerDelay={150}
  animation=\"fadeInUp\"
  startDelay={100}
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</StaggeredContainer>
```

## Animation System

### CSS Keyframes

New keyframe animations added to the global stylesheet:

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes bounce-in {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}
```

### Utility Classes

```css
.animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
.animate-scale-in { animation: scale-in 0.4s ease-out; }
.animate-bounce-in { animation: bounce-in 0.6s ease-out; }

/* Animation delays */
.animate-delay-100 { animation-delay: 100ms; }
.animate-delay-200 { animation-delay: 200ms; }
.animate-delay-300 { animation-delay: 300ms; }

/* Hover effects */
.hover-lift { transition: transform 0.3s ease-out; }
.hover-lift:hover { transform: translateY(-4px); }
```

### JavaScript Intersection Observer

For scroll-based animations:

```javascript
const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      setIsVisible(true);
    }
  },
  {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }
);
```

## Layout Patterns

### Hero Section

```tsx
<section className=\"relative py-20 lg:py-32\">
  <div className=\"absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5\" />
  <div className=\"container mx-auto px-4 relative\">
    <div className=\"max-w-4xl mx-auto text-center\">
      {/* Hero content */}
    </div>
  </div>
</section>
```

### Two-Column Layout

```tsx
<div className=\"grid lg:grid-cols-2 gap-12 items-center\">
  <div>{/* Content */}</div>
  <div>{/* Image/Visual */}</div>
</div>
```

### Card Grid

```tsx
<div className=\"grid lg:grid-cols-3 gap-8\">
  {items.map((item, index) => (
    <AnimatedCard key={index} delay={index * 150}>
      {/* Card content */}
    </AnimatedCard>
  ))}
</div>
```

## Responsive Design

### Breakpoints

- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px` (`md:`)
- **Desktop**: `> 1024px` (`lg:`)
- **Large Desktop**: `> 1280px` (`xl:`)

### Grid Patterns

```css
/* Mobile-first approach */
.grid {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .md\\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .lg\\:grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Typography Scaling

```css
.text-responsive {
  font-size: 1rem;      /* 16px mobile */
}

@media (min-width: 1024px) {
  .text-responsive {
    font-size: 1.25rem;  /* 20px desktop */
  }
}
```

## Form Design

### Floating Label Pattern

The floating label input provides enhanced UX with visual feedback:

1. **Default State**: Label inside input field
2. **Focus State**: Label animates to top, changes color
3. **Filled State**: Label remains at top
4. **Error State**: Red border and error message

### Validation States

```tsx
// Success state
<FloatingLabelInput 
  label=\"Email\" 
  className=\"border-green-500 focus:ring-green-500\"
/>

// Error state
<FloatingLabelInput 
  label=\"Email\" 
  error=\"Email is required\"
  className=\"border-red-500 focus:ring-red-500\"
/>
```

## Accessibility Guidelines

### Focus Management

- Visible focus indicators on all interactive elements
- Proper tab order for keyboard navigation
- Skip links for main content

### Screen Reader Support

- Semantic HTML structure (h1, h2, h3 hierarchy)
- ARIA labels for complex interactive elements
- Alt text for all images and icons

### Color Contrast

- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Color information supplemented with icons/text

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-up {
    animation: none;
  }
  
  .hover-lift {
    transition: none;
  }
}
```

## Performance Considerations

### Animation Performance

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating layout properties (`width`, `height`, `top`, `left`)
- Use `will-change` property sparingly and remove after animation

### Image Optimization

- Next.js Image component for automatic optimization
- Responsive images with appropriate sizes
- Lazy loading for below-the-fold content

### Code Splitting

- Animation components are imported only when needed
- Intersection Observer polyfill loaded conditionally

## Testing Strategy

### Unit Tests

- Component rendering and prop handling
- Animation trigger conditions
- Form validation logic
- Accessibility features

### Integration Tests

- Page layout and responsive behavior
- Form submission workflows
- Navigation between pages
- Error handling scenarios

### E2E Tests

- Complete user journeys
- Cross-browser compatibility
- Performance benchmarks
- Mobile device testing

## Browser Support

### Modern Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Fallbacks

- CSS Grid with Flexbox fallback
- Animation with reduced motion support
- Form validation with native HTML5 validation

## Deployment Considerations

### Build Optimization

- CSS purging to remove unused styles
- Animation library tree-shaking
- Component lazy loading

### CDN Configuration

- Static asset caching
- Image optimization service
- Font loading optimization

## Future Enhancements

### Planned Features

- Dark mode theme toggle
- Advanced animation library integration
- Component documentation site
- Design token management system

### Maintenance

- Regular accessibility audits
- Performance monitoring
- Component usage analytics
- User feedback integration

---

*This documentation should be updated as the design system evolves. For questions or contributions, please refer to the project's contributing guidelines.*
