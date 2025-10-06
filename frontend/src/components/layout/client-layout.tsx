/**
 * @fileoverview Client-Side Layout Component for SewaBazaar Platform
 * 
 * This file contains the main layout component that provides the structural foundation
 * for all client-facing pages in the SewaBazaar application. It orchestrates the
 * arrangement of navigation, main content, and footer components with accessibility
 * features and smooth page transitions.
 * 
 * @component ClientLayout
 * @version 1.0.0
 * @author SewaBazaar Development Team
 * @created 2024
 * @lastModified 2024
 * 
 * Key Features:
 * - Responsive flexbox layout with proper min-height viewport coverage
 * - Integrated keyboard focus management for accessibility
 * - Smooth page transitions with animation support
 * - Memoized main content component for performance optimization
 * - Consistent header (navbar) and footer across all pages
 * - Mobile-first responsive design approach
 * - Accessibility compliance with WCAG guidelines
 * 
 * Layout Structure:
 * ```
 * ┌─────────────────────────────────┐
 * │          Navbar                 │ ← Fixed header navigation
 * ├─────────────────────────────────┤
 * │                                 │
 * │        Main Content             │ ← Flexible content area
 * │     (with transitions)          │   (grows to fill space)
 * │                                 │
 * ├─────────────────────────────────┤
 * │          Footer                 │ ← Site footer
 * └─────────────────────────────────┘
 * ```
 * 
 * Dependencies:
 * - React: Component composition and memoization
 * - Next.js: Client-side routing and page management
 * - PageTransition: Custom animation component for route changes
 * - KeyboardFocus: Accessibility enhancement for keyboard navigation
 * - Navbar: Main site navigation component
 * - Footer: Site-wide footer component
 * 
 * @requires React
 * @requires Next.js
 * @requires PageTransition
 * @requires KeyboardFocus
 * @requires Navbar
 * @requires Footer
 */

"use client"

import { PageTransition } from "@/components/page-transition"
import { KeyboardFocus } from "@/components/keyboard-focus"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ErrorPageRenderer } from "@/components/ErrorPageRenderer"
import { useError } from "@/contexts/ErrorContext"
import { memo } from "react"

/**
 * Memoized Main Content Wrapper Component
 * 
 * Wraps the main page content with PageTransition for smooth route changes.
 * Uses React.memo for performance optimization to prevent unnecessary re-renders
 * when parent components update but children prop remains the same.
 * 
 * @component MainContent
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to be rendered
 * @returns {JSX.Element} Memoized main content wrapper with transitions
 * 
 * @example
 * ```tsx
 * <MainContent>
 *   <div>Your page content here</div>
 * </MainContent>
 * ```
 * 
 * Performance Benefits:
 * - Prevents re-rendering when layout props change but content stays same
 * - Reduces computational overhead during navigation
 * - Maintains smooth animation performance
 * - Optimizes React's reconciliation process
 */
const MainContent = memo(({ children }: { children: React.ReactNode }) => (
  <main className="flex-1">
    <PageTransition>{children}</PageTransition>
  </main>
))
MainContent.displayName = "MainContent"

/**
 * Client Layout Component
 * 
 * The primary layout component that provides the structural foundation for all
 * client-facing pages. It creates a consistent layout with navigation, content
 * area, and footer, while integrating accessibility features and page transitions.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to be rendered within the layout
 * @returns {JSX.Element} Complete layout structure with navigation, content, and footer
 * 
 * @example
 * ```tsx
 * // Usage in a page component
 * import { ClientLayout } from '@/components/layout/client-layout'
 * 
 * export default function HomePage() {
 *   return (
 *     <ClientLayout>
 *       <div>
 *         <h1>Welcome to SewaBazaar</h1>
 *         <p>Your content here...</p>
 *       </div>
 *     </ClientLayout>
 *   )
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Usage in app layout
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ClientLayout>
 *           {children}
 *         </ClientLayout>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 * 
 * Layout Features:
 * - **Responsive Design**: Flexbox layout that adapts to all screen sizes
 * - **Accessibility**: Keyboard focus management and proper semantic structure
 * - **Performance**: Memoized components for optimal rendering
 * - **Transitions**: Smooth page changes with animation support
 * - **Consistency**: Unified header and footer across all pages
 * - **Mobile-First**: Responsive design approach starting from mobile
 * 
 * Accessibility Features:
 * - Keyboard navigation support through KeyboardFocus component
 * - Proper semantic HTML structure with main, header, and footer landmarks
 * - Screen reader friendly layout with logical content flow
 * - Focus management during page transitions
 * 
 * CSS Classes Explained:
 * - `flex min-h-screen flex-col`: Creates full-height flexbox container
 * - `flex-1`: Allows main content to expand and fill available space
 * - Ensures footer stays at bottom regardless of content height
 */

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { error } = useError()

  return (
    <>
      {/* Keyboard accessibility enhancement for better navigation */}
      <KeyboardFocus />
      
      {/* Error page renderer - shows custom error pages with header/footer when needed */}
      <ErrorPageRenderer />
      
      {/* Only show normal layout when there's no error */}
      {!error && (
        <div className="flex min-h-screen flex-col">
          {/* Site navigation header - consistent across all pages */}
          <Navbar />
          
          {/* Main content area - expands to fill available space between header and footer */}
          <MainContent>{children}</MainContent>
          
          {/* Site footer - stays at bottom of viewport */}
          <Footer />
        </div>
      )}
    </>
  )
}

/**
 * Export the ClientLayout component as default export
 * This layout should be used as the wrapper for all client-facing pages
 * to ensure consistent structure and functionality
 * 
 * @example
 * ```tsx
 * // In your app layout or page wrapper
 * import { ClientLayout } from '@/components/layout/client-layout'
 * 
 * export default function App({ children }) {
 *   return (
 *     <ClientLayout>
 *       {children}
 *     </ClientLayout>
 *   )
 * }
 * ```
 * 
 * Layout Benefits:
 * - Provides consistent user experience across all pages
 * - Handles complex responsive behavior automatically
 * - Integrates accessibility features seamlessly
 * - Optimizes performance through component memoization
 * - Enables smooth page transitions throughout the application
 * - Maintains proper semantic HTML structure for SEO and accessibility
 */ 