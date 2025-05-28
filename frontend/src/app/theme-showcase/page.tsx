import { ColorPaletteShowcase } from "@/components/ui/color-palette-showcase"

export default function ThemeShowcasePage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">SewaBazaar Theme Showcase</h1>
        <p className="text-lg mb-12">
          This page demonstrates the custom color palette and theme support for SewaBazaar. Toggle between light and
          dark mode using the button in the navbar.
        </p>

        <ColorPaletteShowcase />
      </div>
    </div>
  )
}
