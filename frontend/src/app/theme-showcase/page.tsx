"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AnimatedCard, AnimatedCardContent } from "@/components/ui/animated-card"
import { StaggeredContainer, InteractiveIcon, ScrollProgressBar } from "@/components/ui/animation-components"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  Palette, 
  Sparkles, 
  Zap, 
  Heart, 
  Star, 
  Users, 
  Settings, 
  Code, 
  Eye,
  Moon,
  Sun,
  Monitor,
  Download,
  Share2,
  Bookmark,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Loader2,
  Copy,
  Check,
  ThumbsUp,
  MessageCircle,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Search,
  Filter,
  Grid,
  List,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Edit,
  Save,
  Eye as EyeIcon,
  EyeOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalZero
} from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { showToast } from "@/components/ui/enhanced-toast"

export default function ThemeShowcasePage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [progress, setProgress] = useState(0)
  
  // Interactive states
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [likes, setLikes] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [copiedText, setCopiedText] = useState<string>("")
  const [animationSpeed, setAnimationSpeed] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
    
    // Simulate progress for demo
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 10))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Interactive functions
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
        showToast.info({ title: "Removed from favorites" })
      } else {
        newSet.add(id)
        showToast.success({ title: "Added to favorites" })
      }
      return newSet
    })
  }

  const toggleLike = (id: string) => {
    setLikes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
        showToast.info({ title: "Unliked" })
      } else {
        newSet.add(id)
        showToast.success({ title: "Liked!" })
      }
      return newSet
    })
  }

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
        showToast.info({ title: "Removed bookmark" })
      } else {
        newSet.add(id)
        showToast.success({ title: "Bookmarked" })
      }
      return newSet
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    showToast.success({ title: `Copied ${label} to clipboard` })
    setTimeout(() => setCopiedText(""), 2000)
  }

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const animationVariants = [
    { name: "Fade In Up", class: "animate-fade-in-up" },
    { name: "Fade In Down", class: "animate-fade-in-down" },
    { name: "Fade In Left", class: "animate-fade-in-left" },
    { name: "Fade In Right", class: "animate-fade-in-right" },
    { name: "Scale In", class: "animate-scale-in" },
    { name: "Bounce In", class: "animate-bounce-in" },
    { name: "Slide Up", class: "animate-slide-up" }
  ]

  const colorSchemes = [
    { name: "Light", value: "light", icon: Sun },
    { name: "Dark", value: "dark", icon: Moon },
    { name: "System", value: "system", icon: Monitor }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <ScrollProgressBar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-primary/10">
              <Palette className="w-8 h-8 text-primary" />
            </div>
            <h1 className="heading-1 gradient-text">
              SewaBazaar Design System
            </h1>
            <div className="p-3 rounded-full bg-accent/10">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
          </div>
          <p className="large-text text-muted-foreground max-w-3xl mx-auto mb-8">
            A comprehensive showcase of our modern design system, featuring beautiful animations, 
            interactive components, and a cohesive color palette that adapts seamlessly across themes.
          </p>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="text-sm font-medium">Theme:</span>
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              {colorSchemes.map((scheme) => (
                <Button
                  key={scheme.value}
                  variant={theme === scheme.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTheme(scheme.value)}
                  className="flex items-center gap-2"
                >
                  <scheme.icon className="w-4 h-4" />
                  {scheme.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="colors" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 bg-muted/50 p-1">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Components
            </TabsTrigger>
            <TabsTrigger value="animations" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Animations
            </TabsTrigger>
            <TabsTrigger value="interactions" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Interactions
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="utilities" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Utilities
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-8">
            <div className="space-y-8">
              <h2 className="heading-2">SewaBazaar Color Palette</h2>
              
              {/* Main Color Palette */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { name: "Primary", hex: "#4F46E5", bg: "bg-[#4F46E5]", text: "text-white" },
                  { name: "Secondary", hex: "#3B82F6", bg: "bg-[#3B82F6]", text: "text-white" },
                  { name: "Accent", hex: "#9D5CFF", bg: "bg-[#9D5CFF]", text: "text-white" },
                  { name: "Destructive", hex: "#EF4444", bg: "bg-[#EF4444]", text: "text-white" },
                  { name: "Success", hex: "#10B981", bg: "bg-[#10B981]", text: "text-white" },
                  { name: "Warning", hex: "#F59E0B", bg: "bg-[#F59E0B]", text: "text-white" }
                ].map((color, index) => (
                  <AnimatedCard key={color.name} hoverEffect="lift" delay={index * 100}>
                    <div className={`h-24 ${color.bg} rounded-t-lg flex items-center justify-center`}>
                      <Palette className="w-8 h-8 text-white/80" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{color.name}</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(color.hex, color.name)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedText === color.hex ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">{color.hex}</p>
                      <p className="text-xs text-muted-foreground mt-1">Click to copy</p>
                    </CardContent>
                  </AnimatedCard>
                ))}
              </div>

              {/* Color Usage Examples */}
              <div className="space-y-6">
                <h2 className="heading-2">Color Usage Examples</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatedCard hoverEffect="lift" delay={0}>
                    <AnimatedCardContent>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Primary Usage</h3>
                          <p className="text-sm text-muted-foreground">Main brand colors</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-primary rounded-full"></div>
                        <div className="h-2 bg-primary/60 rounded-full"></div>
                        <div className="h-2 bg-primary/30 rounded-full"></div>
                      </div>
                    </AnimatedCardContent>
                  </AnimatedCard>

                  <AnimatedCard hoverEffect="lift" delay={100}>
                    <AnimatedCardContent>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Star className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Secondary Usage</h3>
                          <p className="text-sm text-muted-foreground">Supporting colors</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-secondary rounded-full"></div>
                        <div className="h-2 bg-secondary/60 rounded-full"></div>
                        <div className="h-2 bg-secondary/30 rounded-full"></div>
                      </div>
                    </AnimatedCardContent>
                  </AnimatedCard>

                  <AnimatedCard hoverEffect="lift" delay={200}>
                    <AnimatedCardContent>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Accent Usage</h3>
                          <p className="text-sm text-muted-foreground">Highlight colors</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-accent rounded-full"></div>
                        <div className="h-2 bg-accent/60 rounded-full"></div>
                        <div className="h-2 bg-accent/30 rounded-full"></div>
                      </div>
                    </AnimatedCardContent>
                  </AnimatedCard>
                </div>
              </div>

              {/* Interactive Color Picker */}
              <div className="space-y-6">
                <h2 className="heading-2">Interactive Color Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Color Generator</CardTitle>
                      <CardDescription>Generate color variations and gradients</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-16 bg-gradient-to-r from-primary to-secondary rounded-lg"></div>
                        <div className="h-16 bg-gradient-to-r from-secondary to-accent rounded-lg"></div>
                        <div className="h-16 bg-gradient-to-r from-accent to-primary rounded-lg"></div>
                      </div>
                      <div className="space-y-2">
                        <Label>Animation Speed</Label>
                        <Slider
                          value={[animationSpeed]}
                          onValueChange={(value) => setAnimationSpeed(value[0])}
                          max={3}
                          min={0.1}
                          step={0.1}
                          className="w-full"
                        />
                        <p className="text-sm text-muted-foreground">Speed: {animationSpeed}x</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Theme Controls</CardTitle>
                      <CardDescription>Control theme and display settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sound-toggle">Sound Effects</Label>
                        <Switch
                          id="sound-toggle"
                          checked={soundEnabled}
                          onCheckedChange={setSoundEnabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="notifications-toggle">Notifications</Label>
                        <Switch
                          id="notifications-toggle"
                          checked={notifications}
                          onCheckedChange={setNotifications}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>View Mode</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={viewMode === "grid" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                          >
                            <Grid className="w-4 h-4 mr-2" />
                            Grid
                          </Button>
                          <Button
                            variant={viewMode === "list" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                          >
                            <List className="w-4 h-4 mr-2" />
                            List
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">
            <div className="space-y-8">
              <h2 className="heading-2">UI Components Showcase</h2>
              
              {/* Buttons Section */}
              <div className="space-y-6">
                <h3 className="heading-3">Buttons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Button Variants</CardTitle>
                      <CardDescription>Different button styles and states</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        <Button>Default</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Destructive</Button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button size="sm">Small</Button>
                        <Button size="default">Default</Button>
                        <Button size="lg">Large</Button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button disabled>Disabled</Button>
                        <Button>
                          <Download className="w-4 h-4 mr-2" />
                          With Icon
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Interactive Buttons</CardTitle>
                      <CardDescription>Buttons with hover effects and animations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        <Button className="hover-lift">Hover Lift</Button>
                        <Button className="hover-glow">Hover Glow</Button>
                        <Button className="animate-bounce-in">Bounce In</Button>
                        <Button className="transition-all duration-300 hover:scale-105">
                          Scale On Hover
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Cards Section */}
              <div className="space-y-6">
                <h3 className="heading-3">Cards & Layouts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatedCard hoverEffect="lift" delay={0}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        Animated Card
                      </CardTitle>
                      <CardDescription>Card with built-in animations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        This card demonstrates the animated card component with hover effects.
                      </p>
                    </CardContent>
                  </AnimatedCard>

                  <AnimatedCard hoverEffect="glow" delay={100}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Glow Effect
                      </CardTitle>
                      <CardDescription>Card with glow hover effect</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Hover over this card to see the glow effect in action.
                      </p>
                    </CardContent>
                  </AnimatedCard>

                  <AnimatedCard hoverEffect="scale" delay={200}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-500" />
                        Scale Effect
                      </CardTitle>
                      <CardDescription>Card with scale hover effect</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        This card scales slightly on hover for a subtle interaction.
                      </p>
                    </CardContent>
                  </AnimatedCard>
                </div>
              </div>

              {/* Progress & Status */}
              <div className="space-y-6">
                <h3 className="heading-3">Progress & Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Progress Indicators</CardTitle>
                      <CardDescription>Various progress states and animations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Loading Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Animated Progress</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} className="h-2 bg-gradient-to-r from-primary to-accent" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Status Indicators</CardTitle>
                      <CardDescription>Different status and alert types</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Success message</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">Warning message</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Error message</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Info message</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Animations Tab */}
          <TabsContent value="animations" className="space-y-8">
            <div className="space-y-8">
              <h2 className="heading-2">Animation Showcase</h2>
              
              {/* Animation Variants */}
              <div className="space-y-6">
                <h3 className="heading-3">Animation Variants</h3>
                <StaggeredContainer staggerDelay={150} animation="fadeInUp">
                  {animationVariants.map((variant, index) => (
                    <AnimatedCard key={variant.name} hoverEffect="lift" delay={index * 100}>
                      <AnimatedCardContent>
                        <div className="flex items-center justify-between">
              <div>
                            <h4 className="font-semibold">{variant.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Class: {variant.class}
                </p>
              </div>
                          <Badge variant="outline">Ready</Badge>
                        </div>
                      </AnimatedCardContent>
                    </AnimatedCard>
                  ))}
                </StaggeredContainer>
              </div>

              {/* Interactive Icons */}
              <div className="space-y-6">
                <h3 className="heading-3">Interactive Icons</h3>
                <Card>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      <div className="text-center space-y-2">
                        <InteractiveIcon size="lg" hoverEffect="scale" variant="primary">
                          <Heart className="w-8 h-8" />
                        </InteractiveIcon>
                        <div>
                          <p className="font-medium text-sm">Scale</p>
                          <p className="text-xs text-muted-foreground">Scale transformation</p>
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <InteractiveIcon size="lg" hoverEffect="bounce" variant="secondary">
                          <Star className="w-8 h-8" />
                        </InteractiveIcon>
                        <div>
                          <p className="font-medium text-sm">Bounce</p>
                          <p className="text-xs text-muted-foreground">Bounce animation</p>
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <InteractiveIcon size="lg" hoverEffect="glow" variant="accent">
                          <Zap className="w-8 h-8" />
                        </InteractiveIcon>
                        <div>
                          <p className="font-medium text-sm">Glow</p>
                          <p className="text-xs text-muted-foreground">Glow effect</p>
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <InteractiveIcon size="lg" hoverEffect="rotate" variant="primary">
                          <Settings className="w-8 h-8" />
                        </InteractiveIcon>
                        <div>
                          <p className="font-medium text-sm">Rotate</p>
                          <p className="text-xs text-muted-foreground">Rotation effect</p>
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <InteractiveIcon size="lg" hoverEffect="scale" variant="secondary">
                          <Bell className="w-8 h-8" />
                        </InteractiveIcon>
                        <div>
                          <p className="font-medium text-sm">Default</p>
                          <p className="text-xs text-muted-foreground">Default effect</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent value="interactions" className="space-y-8">
            <div className="space-y-8">
              <h2 className="heading-2">Interactive Elements</h2>
              
              {/* Search and Filter */}
              <div className="space-y-6">
                <h3 className="heading-3">Search & Filter</h3>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="search">Search Components</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="search"
                            placeholder="Search for components..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Interactive Cards with Actions */}
              <div className="space-y-6">
                <h3 className="heading-3">Interactive Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: "card-1", title: "Design System", description: "Modern UI components", icon: Palette, color: "text-blue-500" },
                    { id: "card-2", title: "Animations", description: "Smooth transitions", icon: Zap, color: "text-purple-500" },
                    { id: "card-3", title: "Interactions", description: "User engagement", icon: Heart, color: "text-red-500" },
                    { id: "card-4", title: "Typography", description: "Beautiful text", icon: Eye, color: "text-green-500" },
                    { id: "card-5", title: "Colors", description: "Vibrant palette", icon: Sparkles, color: "text-yellow-500" },
                    { id: "card-6", title: "Utilities", description: "Helper classes", icon: Settings, color: "text-indigo-500" }
                  ].map((item, index) => (
                    <AnimatedCard key={item.id} hoverEffect="lift" delay={index * 100}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-${item.color.split('-')[1]}-100 flex items-center justify-center`}>
                              <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold">{item.title}</h4>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleFavorite(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Heart 
                                className={`w-4 h-4 ${
                                  favorites.has(item.id) 
                                    ? 'fill-red-500 text-red-500' 
                                    : 'text-muted-foreground hover:text-red-500'
                                }`} 
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleBookmark(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Bookmark 
                                className={`w-4 h-4 ${
                                  bookmarks.has(item.id) 
                                    ? 'fill-blue-500 text-blue-500' 
                                    : 'text-muted-foreground hover:text-blue-500'
                                }`} 
                              />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleLike(item.id)}
                              className="h-8 px-2"
                            >
                              <ThumbsUp 
                                className={`w-4 h-4 mr-1 ${
                                  likes.has(item.id) 
                                    ? 'fill-green-500 text-green-500' 
                                    : 'text-muted-foreground hover:text-green-500'
                                }`} 
                              />
                              {likes.has(item.id) ? 'Liked' : 'Like'}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 px-2">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Comment
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleSelection(item.id)}
                            className={`h-8 ${
                              selectedItems.has(item.id) 
                                ? 'bg-primary text-primary-foreground' 
                                : ''
                            }`}
                          >
                            {selectedItems.has(item.id) ? 'Selected' : 'Select'}
                          </Button>
                        </div>
                      </CardContent>
                    </AnimatedCard>
                  ))}
                </div>
              </div>

              {/* Interactive Buttons */}
              <div className="space-y-6">
                <h3 className="heading-3">Interactive Buttons</h3>
                <Card>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        className="hover-lift"
                        onClick={() => toggleLike("demo-like")}
                      >
                        <Heart className={`w-4 h-4 mr-2 ${
                          likes.has("demo-like") ? 'fill-red-500 text-red-500' : ''
                        }`} />
                        {likes.has("demo-like") ? 'Liked' : 'Like'}
                      </Button>
                      <Button 
                        variant="secondary" 
                        className="hover-glow"
                        onClick={() => toggleBookmark("demo-bookmark")}
                      >
                        <Bookmark className={`w-4 h-4 mr-2 ${
                          bookmarks.has("demo-bookmark") ? 'fill-blue-500 text-blue-500' : ''
                        }`} />
                        {bookmarks.has("demo-bookmark") ? 'Saved' : 'Save'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="transition-all duration-300 hover:scale-105"
                        onClick={() => copyToClipboard("Design System", "component")}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="animate-bounce-in"
                        onClick={() => showToast.success({ title: "Notification sent!" })}
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Notify
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Indicators */}
              <div className="space-y-6">
                <h3 className="heading-3">Status Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="hover-lift cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Wifi className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium">Online</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Connected</p>
                    </CardContent>
                  </Card>

                  <Card className="hover-lift cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Battery className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium">85%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Battery</p>
                    </CardContent>
                  </Card>

                  <Card className="hover-lift cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Signal className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium">Strong</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Signal</p>
                    </CardContent>
                  </Card>

                  <Card className="hover-lift cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Volume2 className="w-5 h-5 text-purple-500" />
                        <span className="text-sm font-medium">On</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Sound</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-8">
            <div className="space-y-8">
              <h2 className="heading-2">Typography System</h2>
              
              {/* Headings */}
              <div className="space-y-6">
                <h3 className="heading-3">Heading Styles</h3>
                <Card>
                  <CardContent className="p-8 space-y-6">
                    <div>
                      <h1 className="heading-1 gradient-text">Heading 1</h1>
                      <p className="text-sm text-muted-foreground">Large display heading with gradient text</p>
                    </div>
                    <div>
                      <h2 className="heading-2">Heading 2</h2>
                      <p className="text-sm text-muted-foreground">Section heading with proper hierarchy</p>
                    </div>
                    <div>
                      <h3 className="heading-3">Heading 3</h3>
                      <p className="text-sm text-muted-foreground">Subsection heading</p>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">Heading 4</h4>
                      <p className="text-sm text-muted-foreground">Smaller heading</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Text Styles */}
              <div className="space-y-6">
                <h3 className="heading-3">Text Styles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Body Text</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="large-text">
                        This is large text used for important content and descriptions.
                      </p>
                      <p>
                        This is regular body text that provides good readability and spacing.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This is small text used for captions and secondary information.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Special Text</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="font-bold">Bold text for emphasis</p>
                      <p className="italic">Italic text for style</p>
                      <p className="underline">Underlined text for links</p>
                      <p className="line-through">Strikethrough text</p>
                      <p className="gradient-text font-bold">
                        Gradient text for special effects
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Utilities Tab */}
          <TabsContent value="utilities" className="space-y-8">
            <div className="space-y-8">
              <h2 className="heading-2">Utility Classes</h2>
              
              {/* Spacing & Layout */}
              <div className="space-y-6">
                <h3 className="heading-3">Spacing & Layout</h3>
                <Card>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Spacing Examples</h4>
                        <div className="space-y-2">
                          <div className="h-4 bg-primary rounded"></div>
                          <div className="h-4 bg-secondary rounded"></div>
                          <div className="h-4 bg-accent rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold">Layout Examples</h4>
                        <div className="flex gap-2">
                          <div className="w-8 h-8 bg-primary rounded"></div>
                          <div className="w-8 h-8 bg-secondary rounded"></div>
                          <div className="w-8 h-8 bg-accent rounded"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Animation Utilities */}
              <div className="space-y-6">
                <h3 className="heading-3">Animation Utilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Animation Classes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-primary rounded animate-pulse"></div>
                        <span className="text-sm">animate-pulse</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-secondary rounded animate-bounce"></div>
                        <span className="text-sm">animate-bounce</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-accent rounded animate-spin"></div>
                        <span className="text-sm">animate-spin</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Transition Classes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-primary rounded transition-colors duration-300 hover:bg-secondary"></div>
                        <span className="text-sm">transition-colors</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-secondary rounded transition-transform duration-300 hover:scale-110"></div>
                        <span className="text-sm">transition-transform</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-accent rounded transition-all duration-300 hover:rotate-45"></div>
                        <span className="text-sm">transition-all</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="text-center space-y-4">
            <h3 className="heading-3">SewaBazaar Design System</h3>
            <p className="text-muted-foreground">
              Built with modern web technologies and designed for accessibility, performance, and beauty.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const url = window.location.href
                    if (navigator.share) {
                      await navigator.share({
                        title: 'SewaBazaar Design System',
                        text: 'Check out the SewaBazaar Design System showcase.',
                        url
                      })
                      showToast.success({ title: 'Shared successfully' })
                    } else {
                      await navigator.clipboard.writeText(url)
                      showToast.success({ title: 'Link copied to clipboard' })
                    }
                  } catch (e) {
                    showToast.error({ title: 'Share cancelled' })
                  }
                }}
              >
                <Code className="w-4 h-4 mr-2" />
                Share Page
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const blob = new Blob([
                      JSON.stringify({
                        page: 'Theme Showcase',
                        exportedAt: new Date().toISOString(),
                        theme,
                      }, null, 2)
                    ], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'sewabazaar-theme-showcase.json'
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(url)
                    showToast.success({ title: 'Download started' })
                  } catch (e) {
                    showToast.error({ title: 'Download failed' })
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const url = window.location.href
                    if (navigator.share) {
                      await navigator.share({
                        title: 'SewaBazaar Design System',
                        text: 'Check out the SewaBazaar Design System showcase.',
                        url
                      })
                      showToast.success({ title: 'Shared successfully' })
                    } else {
                      await navigator.clipboard.writeText(url)
                      showToast.success({ title: 'Link copied to clipboard' })
                    }
                  } catch (e) {
                    showToast.error({ title: 'Share cancelled' })
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
