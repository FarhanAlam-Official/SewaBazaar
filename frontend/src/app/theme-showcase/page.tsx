import { ColorPaletteShowcase } from "@/components/ui/color-palette-showcase"
import { TestProviderProfile } from "@/components/TestProviderProfile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ThemeShowcasePage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">SewaBazaar Development Showcase</h1>
        <p className="text-lg mb-12">
          This page demonstrates the theme system and Phase 2 integration testing for SewaBazaar.
        </p>

        <Tabs defaultValue="theme" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="theme">Theme Showcase</TabsTrigger>
            <TabsTrigger value="phase2">Phase 2 Integration Test</TabsTrigger>
          </TabsList>

          <TabsContent value="theme">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Color Palette & Theme</h2>
                <p className="text-gray-600 mb-6">
                  Toggle between light and dark mode using the button in the navbar.
                </p>
              </div>
              <ColorPaletteShowcase />
            </div>
          </TabsContent>

          <TabsContent value="phase2">
            <TestProviderProfile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
