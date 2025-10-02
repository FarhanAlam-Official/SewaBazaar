"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  loading?: boolean
  onAddNew?: () => void
  addNewLabel?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search options...",
  emptyMessage = "No options found.",
  className,
  disabled = false,
  loading = false,
  onAddNew,
  addNewLabel = "Add new"
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) return options
    
    const searchTerm = searchValue.toLowerCase().trim()
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm) ||
      option.description?.toLowerCase().includes(searchTerm)
    )
  }, [options, searchValue])

  const handleSelect = React.useCallback((selectedValue: string) => {
    if (selectedValue === value) {
      onValueChange?.("")
    } else {
      onValueChange?.(selectedValue)
    }
    setOpen(false)
    setSearchValue("")
  }, [value, onValueChange])

  const handleAddNew = React.useCallback(() => {
    onAddNew?.()
    setOpen(false)
    setSearchValue("")
  }, [onAddNew])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[95%] justify-between text-left ml-1 font-normal h-10 px-3 py-2",
            "bg-background border border-input transition-colors rounded-md",
            "hover:bg-background hover:border-ring/50",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
            "focus:border-ring",
            "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
            "dark:hover:bg-gray-800 dark:hover:border-ring/50",
            "dark:focus:border-ring dark:focus:ring-ring",
            !selectedOption && "text-muted-foreground dark:text-gray-400",
            className
          )}
          disabled={disabled || loading}
        >
          <div className="flex items-center min-w-0 flex-1">
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : selectedOption ? (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium text-foreground dark:text-white truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.description && (
                  <span className="text-xs text-muted-foreground dark:text-gray-400 truncate">
                    {selectedOption.description}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground dark:text-gray-400">
                {placeholder}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0 dark:bg-gray-800 dark:border-gray-700 shadow-lg" 
        align="start"
        sideOffset={4}
      >
        <Command className="dark:bg-gray-800">
          <div className="p-3 border-b dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchValue}
                onValueChange={setSearchValue}
                className={cn(
                  "flex h-9 w-full rounded-md pl-10 pr-3 py-2 text-sm",
                  "bg-background border border-input transition-colors",
                  "placeholder:text-muted-foreground dark:placeholder:text-gray-400",
                  "text-foreground dark:text-white dark:bg-gray-800 dark:border-gray-600",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                  "focus:border-ring hover:border-ring/50",
                  "dark:focus:border-ring dark:hover:border-ring/50",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>
          </div>
          <CommandList>
            <ScrollArea className="max-h-[300px]">
              <CommandEmpty className="py-6 text-center text-sm">
                <div className="space-y-3">
                  <p className="text-muted-foreground dark:text-gray-400">
                    {emptyMessage}
                  </p>
                  {onAddNew && searchValue.trim() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddNew}
                      className="text-xs hover:bg-primary hover:text-primary-foreground hover:border-primary dark:border-gray-600 dark:text-gray-300 dark:hover:bg-primary dark:hover:text-primary-foreground dark:hover:border-primary"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {addNewLabel} "{searchValue.trim()}"
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label} // Use label for search matching
                    onSelect={() => handleSelect(option.value)}
                    className={cn(
                      "cursor-pointer px-3 py-3 transition-colors",
                      "hover:bg-primary hover:text-primary-foreground",
                      "focus:bg-primary focus:text-primary-foreground",
                      "data-[selected]:bg-primary data-[selected]:text-primary-foreground",
                      "dark:text-white dark:hover:bg-primary dark:hover:text-primary-foreground",
                      "dark:focus:bg-primary dark:focus:text-primary-foreground"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-3 h-4 w-4 flex-shrink-0",
                        value === option.value ? "opacity-100 text-primary-foreground" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col min-w-0 flex-1 space-y-1">
                      <span className="font-medium truncate">
                        {option.label}
                      </span>
                      {option.description && (
                        <span 
                          className="text-xs opacity-80 overflow-hidden"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.3'
                          }}
                        >
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
                {onAddNew && (
                  <CommandItem
                    onSelect={handleAddNew}
                    className={cn(
                      "cursor-pointer px-3 py-3 border-t transition-colors",
                      "hover:bg-primary hover:text-primary-foreground",
                      "focus:bg-primary focus:text-primary-foreground",
                      "dark:text-white dark:border-gray-700",
                      "dark:hover:bg-primary dark:hover:text-primary-foreground",
                      "dark:focus:bg-primary dark:focus:text-primary-foreground"
                    )}
                  >
                    <Plus className="mr-3 h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">
                      {addNewLabel}
                    </span>
                  </CommandItem>
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
