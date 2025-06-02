import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ColorPaletteShowcase() {
  const colors = [
    { name: "Indigo Primary", hex: "#4F46E5", tailwind: "bg-indigoPrimary", textClass: "text-white" },
    { name: "Purple Accent", hex: "#9D5CFF", tailwind: "bg-purpleAccent", textClass: "text-white" },
    { name: "Blue Secondary", hex: "#3B82F6", tailwind: "bg-blueSecondary", textClass: "text-white" },
    { name: "Pearl White", hex: "#F1F5FF", tailwind: "bg-pearlWhite", textClass: "text-black" },
    { name: "Dark Blue Black", hex: "#050914", tailwind: "bg-black", textClass: "text-white" },
    { name: "Cool Gray", hex: "#E5E7EB", tailwind: "bg-grayCool", textClass: "text-black" },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="heading-2 mb-6">SewaBazaar Color Palette</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {colors.map((color) => (
          <Card key={color.name} className="overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className={`h-24 ${color.tailwind}`}></div>
            <CardContent className="p-4">
              <h3 className="font-semibold">{color.name}</h3>
              <p className="text-sm text-muted-foreground">{color.hex}</p>
              <p className="text-xs text-muted-foreground mt-1">{color.tailwind}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="heading-2 mt-12 mb-6">UI Components with New Colors</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Button components with the new color palette</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="default" className="bg-indigoPrimary hover:bg-indigoPrimary/90">Primary</Button>
            <Button variant="secondary" className="bg-blueSecondary hover:bg-blueSecondary/90">Secondary</Button>
            <Button variant="outline" className="border-indigoPrimary text-indigoPrimary hover:bg-indigoPrimary/10">Outline</Button>
            <Button variant="ghost" className="text-indigoPrimary hover:bg-indigoPrimary/10">Ghost</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gradients & Text</CardTitle>
            <CardDescription>Gradient and text styles with the new colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-16 bg-gradient-to-r from-indigoPrimary to-purpleAccent rounded-lg"></div>
            <div className="h-16 bg-gradient-to-r from-blueSecondary to-purpleAccent rounded-lg"></div>
            <p className="text-indigoPrimary font-semibold">Primary Text Color</p>
            <p className="text-blueSecondary font-semibold">Secondary Text Color</p>
            <p className="bg-clip-text text-transparent bg-gradient-to-r from-indigoPrimary to-purpleAccent font-bold text-lg">
              Gradient Text Effect
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
