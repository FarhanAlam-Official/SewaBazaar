"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign,
  Shield,
  Award,
  Calendar,
  Loader2,
  Check,
  ChevronsUpDown
} from "lucide-react"
import { debounce } from "lodash"
import { servicesApi } from "@/services/api"

// Types
export interface FilterState {
  search: string
  categories: string[]
  cities: string[]
  priceRange: [number, number]
  minRating: number
  verifiedOnly: boolean
  instantBooking: boolean
  availableToday: boolean
  sortBy: string
  tags: string[]
}

interface FilterOption {
  id: string
  label: string
  count?: number
}

interface EnhancedServiceFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  loading?: boolean
  resultCount?: number
}

export function EnhancedServiceFilters({
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  loading = false,
  resultCount = 0
}: EnhancedServiceFiltersProps) {
  // State for filter options
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [cities, setCities] = useState<FilterOption[]>([])
  const [tags, setTags] = useState<FilterOption[]>([])
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // State for collapsible sections
  const [openSections, setOpenSections] = useState({
    categories: true,
    location: true,
    price: true,
    rating: true,
    features: true,
    tags: false
  })

  // State for multi-select popovers
  const [openPopovers, setOpenPopovers] = useState({
    categories: false,
    cities: false,
    tags: false
  })

  // Debounced search function with reduced delay
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length > 2) {
        try {
          // Mock search suggestions - replace with actual API call
          const suggestions = [
            `${searchTerm} cleaning`,
            `${searchTerm} repair`,
            `${searchTerm} installation`,
            `${searchTerm} maintenance`
          ].filter(s => s !== searchTerm)
          setSearchSuggestions(suggestions)
        } catch (error) {
          console.error('Error fetching search suggestions:', error)
        }
      } else {
        setSearchSuggestions([])
      }
    }, 150), // Reduced from 300ms to 150ms
    []
  )

  // Fetch filter options with caching
  const fetchFilterOptions = async () => {
    try {
      // Check if we already have data to avoid unnecessary API calls
      if (categories.length > 0 && cities.length > 0) {
        return;
      }

      const [categoriesData, citiesData] = await Promise.all([
        servicesApi.getCategories(),
        servicesApi.getCities()
      ])

      // Process categories
      const categoryOptions = (Array.isArray(categoriesData) ? categoriesData : categoriesData.results || [])
        .map((cat: any) => ({
          id: cat.slug || cat.title.toLowerCase(),
          label: cat.title,
          count: cat.services_count || 0
        }))

      // Process cities
      const cityOptions = (Array.isArray(citiesData) ? citiesData : citiesData.results || [])
        .map((city: any) => ({
          id: city.name.toLowerCase(),
          label: city.name,
          count: city.services_count || 0
        }))

      // Mock tags - replace with actual API call
      const tagOptions = [
        { id: 'eco-friendly', label: 'Eco-Friendly', count: 45 },
        { id: 'same-day', label: 'Same Day Service', count: 32 },
        { id: 'emergency', label: 'Emergency Service', count: 28 },
        { id: 'warranty', label: 'Warranty Included', count: 67 },
        { id: 'licensed', label: 'Licensed Professional', count: 89 },
        { id: 'insured', label: 'Insured', count: 76 }
      ]

      setCategories(categoryOptions)
      setCities(cityOptions)
      setTags(tagOptions)
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  // Handle search input change
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
    debouncedSearch(value)
    setShowSuggestions(value.length > 0)
  }

  // Handle search suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    onFiltersChange({ ...filters, search: suggestion })
    setShowSuggestions(false)
    onApplyFilters()
  }

  // Handle multi-select changes
  const handleMultiSelectChange = (
    field: 'categories' | 'cities' | 'tags',
    value: string,
    checked: boolean
  ) => {
    const currentValues = filters[field] as string[]
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value)
    
    onFiltersChange({ ...filters, [field]: newValues })
  }

  // Handle single filter changes
  const handleFilterChange = (field: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [field]: value })
  }

  // Toggle collapsible sections
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.categories.length > 0) count++
    if (filters.cities.length > 0) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++
    if (filters.minRating > 0) count++
    if (filters.verifiedOnly) count++
    if (filters.instantBooking) count++
    if (filters.availableToday) count++
    if (filters.tags.length > 0) count++
    return count
  }

  // Effects
  useEffect(() => {
    fetchFilterOptions()
  }, [])

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onResetFilters}
              disabled={getActiveFilterCount() === 0}
            >
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button 
              size="sm" 
              onClick={onApplyFilters}
              disabled={loading}
              className="bg-gradient-to-r from-[#8E54E9] to-[#4776E6] hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-1" />
              )}
              Apply
            </Button>
          </div>
        </div>
        
        {resultCount > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {resultCount.toLocaleString()} services found
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enhanced Search */}
        <div className="relative">
          <Label htmlFor="search" className="text-sm font-medium mb-2 block">
            Search Services
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="What service do you need?"
              className="pl-10"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(filters.search.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            
            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border rounded-md shadow-lg">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-sm"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <Search className="h-3 w-3 inline mr-2 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Categories Filter */}
        <Collapsible open={openSections.categories} onOpenChange={() => toggleSection('categories')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Award className="h-4 w-4" />
                Categories
                {filters.categories.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.categories.length}
                  </Badge>
                )}
              </Label>
              {openSections.categories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <Popover open={openPopovers.categories} onOpenChange={(open) => 
              setOpenPopovers(prev => ({ ...prev, categories: open }))
            }>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {filters.categories.length === 0 
                    ? "Select categories..." 
                    : `${filters.categories.length} selected`
                  }
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search categories..." />
                  <CommandList>
                    <CommandEmpty>No categories found.</CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          onSelect={() => {
                            const isSelected = filters.categories.includes(category.id)
                            handleMultiSelectChange('categories', category.id, !isSelected)
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              filters.categories.includes(category.id) ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex-1 flex items-center justify-between">
                            <span>{category.label}</span>
                            {category.count && (
                              <Badge variant="outline" className="ml-2">
                                {category.count}
                              </Badge>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Selected Categories */}
            {filters.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.categories.map((categoryId) => {
                  const category = categories.find(c => c.id === categoryId)
                  return category ? (
                    <Badge key={categoryId} variant="secondary" className="text-xs">
                      {category.label}
                      <button
                        onClick={() => handleMultiSelectChange('categories', categoryId, false)}
                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </Badge>
                  ) : null
                })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Location Filter */}
        <Collapsible open={openSections.location} onOpenChange={() => toggleSection('location')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <Label className="flex items-center gap-2 cursor-pointer">
                <MapPin className="h-4 w-4" />
                Location
                {filters.cities.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.cities.length}
                  </Badge>
                )}
              </Label>
              {openSections.location ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <Popover open={openPopovers.cities} onOpenChange={(open) => 
              setOpenPopovers(prev => ({ ...prev, cities: open }))
            }>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {filters.cities.length === 0 
                    ? "Select cities..." 
                    : `${filters.cities.length} selected`
                  }
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search cities..." />
                  <CommandList>
                    <CommandEmpty>No cities found.</CommandEmpty>
                    <CommandGroup>
                      {cities.map((city) => (
                        <CommandItem
                          key={city.id}
                          onSelect={() => {
                            const isSelected = filters.cities.includes(city.id)
                            handleMultiSelectChange('cities', city.id, !isSelected)
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              filters.cities.includes(city.id) ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex-1 flex items-center justify-between">
                            <span>{city.label}</span>
                            {city.count && (
                              <Badge variant="outline" className="ml-2">
                                {city.count}
                              </Badge>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Selected Cities */}
            {filters.cities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.cities.map((cityId) => {
                  const city = cities.find(c => c.id === cityId)
                  return city ? (
                    <Badge key={cityId} variant="secondary" className="text-xs">
                      {city.label}
                      <button
                        onClick={() => handleMultiSelectChange('cities', cityId, false)}
                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </Badge>
                  ) : null
                })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Price Range Filter */}
        <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <Label className="flex items-center gap-2 cursor-pointer">
                <DollarSign className="h-4 w-4" />
                Price Range
              </Label>
              {openSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => handleFilterChange('priceRange', value as [number, number])}
                min={0}
                max={10000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-300">
                <span>NPR {filters.priceRange[0].toLocaleString()}</span>
                <span>NPR {filters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Rating Filter */}
        <Collapsible open={openSections.rating} onOpenChange={() => toggleSection('rating')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Star className="h-4 w-4" />
                Minimum Rating
              </Label>
              {openSections.rating ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={filters.minRating === rating}
                    onCheckedChange={(checked) => 
                      handleFilterChange('minRating', checked ? rating : 0)
                    }
                  />
                  <Label htmlFor={`rating-${rating}`} className="flex items-center cursor-pointer">
                    {rating}+ 
                    <div className="flex ml-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${
                            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Features Filter */}
        <Collapsible open={openSections.features} onOpenChange={() => toggleSection('features')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4" />
                Features
              </Label>
              {openSections.features ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={filters.verifiedOnly}
                  onCheckedChange={(checked) => handleFilterChange('verifiedOnly', checked)}
                />
                <Label htmlFor="verified" className="flex items-center cursor-pointer">
                  <Shield className="h-4 w-4 mr-1 text-green-600" />
                  Verified Providers Only
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="instant"
                  checked={filters.instantBooking}
                  onCheckedChange={(checked) => handleFilterChange('instantBooking', checked)}
                />
                <Label htmlFor="instant" className="flex items-center cursor-pointer">
                  <Clock className="h-4 w-4 mr-1 text-blue-600" />
                  Instant Booking
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="today"
                  checked={filters.availableToday}
                  onCheckedChange={(checked) => handleFilterChange('availableToday', checked)}
                />
                <Label htmlFor="today" className="flex items-center cursor-pointer">
                  <Calendar className="h-4 w-4 mr-1 text-orange-600" />
                  Available Today
                </Label>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Tags Filter */}
        <Collapsible open={openSections.tags} onOpenChange={() => toggleSection('tags')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Award className="h-4 w-4" />
                Service Tags
                {filters.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.tags.length}
                  </Badge>
                )}
              </Label>
              {openSections.tags ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={filters.tags.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                  onClick={() => {
                    const isSelected = filters.tags.includes(tag.id)
                    handleMultiSelectChange('tags', tag.id, !isSelected)
                  }}
                >
                  {tag.label}
                  {tag.count && (
                    <span className="ml-1 text-xs opacity-70">
                      ({tag.count})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}