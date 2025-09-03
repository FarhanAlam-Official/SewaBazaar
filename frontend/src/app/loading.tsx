import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="space-y-16">
        {/* Hero Section Loading - Glassmorphism & Floating Elements */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            {/* Primary Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-blue-600/15 to-cyan-500/20 dark:from-violet-800/30 dark:via-blue-800/25 dark:to-cyan-700/30" />
            
            {/* Floating Orbs - Glassmorphism Effect */}
            <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-gradient-to-br from-violet-400/30 to-pink-400/30 backdrop-blur-3xl border border-white/20 dark:border-white/10" />
            <div className="absolute top-40 right-20 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/25 to-cyan-400/25 backdrop-blur-3xl border border-white/20 dark:border-white/10" />
            <div className="absolute bottom-20 left-1/3 w-64 h-64 rounded-full bg-gradient-to-br from-violet-400/20 to-blue-400/20 backdrop-blur-3xl border border-white/20 dark:border-white/10" />
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
              {/* Left Content - Enhanced Typography */}
              <div className="space-y-8 text-center lg:text-left">
                {/* Enhanced Floating Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-violet-200/50 dark:border-violet-700/50 shadow-lg">
                  <div className="relative">
                    <div className="w-4 h-4 bg-violet-600 dark:bg-violet-400 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>

                {/* Hero Title */}
                <div className="space-y-4">
                  <Skeleton className="h-16 w-3/4" />
                  <Skeleton className="h-16 w-4/5" />
                  <Skeleton className="h-16 w-3/4" />
                  
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-6 w-1/2 mt-2" />
                </div>

                {/* CTA Buttons - Glassmorphism */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Skeleton className="h-16 w-64 rounded-2xl" />
                  <Skeleton className="h-16 w-64 rounded-2xl" />
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-8">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-violet-500 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>

              {/* Right Content - Enhanced 3D Scene */}
              <div className="relative h-[600px] lg:h-[700px] hidden lg:block">
                {/* Glassmorphism Frame */}
                <div className="absolute inset-0 bg-white/10 dark:bg-slate-800/10 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-700/30 shadow-2xl" />
                
                {/* Floating Stats */}
                <div className="absolute -left-6 top-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 dark:border-slate-700/50 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg" />
                    <div>
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                </div>
                
                <div className="absolute -right-6 bottom-32 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 dark:border-slate-700/50 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg" />
                    <div>
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Search Section - Glassmorphism */}
        <section className="relative z-20 -mt-32">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto relative">
              {/* Glassmorphism Container */}
              <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-700/30 shadow-2xl">
                <div className="relative p-8 md:p-12">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <Skeleton className="h-10 w-80 mx-auto mb-4" />
                    <Skeleton className="h-6 w-96 mx-auto" />
                  </div>
                  
                  {/* Search Form */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Service Search */}
                    <div className="md:col-span-5 relative">
                      <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-400 dark:bg-slate-500 rounded-full" />
                        <Skeleton className="h-14 pl-12 pr-4" />
                      </div>
                    </div>
                    
                    {/* Location Search */}
                    <div className="md:col-span-4 relative">
                      <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-400 dark:bg-slate-500 rounded-full" />
                        <Skeleton className="h-14 pl-12 pr-4" />
                      </div>
                    </div>
                    
                    {/* Search Button */}
                    <div className="md:col-span-3">
                      <Skeleton className="w-full h-14 rounded-2xl" />
                    </div>
                  </div>
                  
                  {/* Quick Search Tags */}
                  <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                    <Skeleton className="h-4 w-32" />
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-24 rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section - Enhanced with Micro-interactions */}
        <section className="py-24 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-transparent to-blue-50/30 dark:from-slate-900/50 dark:via-transparent dark:to-slate-800/30" />
            
            {/* Floating Geometric Shapes */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-violet-200/30 to-blue-200/30 dark:from-violet-800/20 dark:to-blue-800/20 rounded-3xl backdrop-blur-sm" />
            <div className="absolute bottom-32 right-16 w-24 h-24 bg-gradient-to-br from-cyan-200/30 to-emerald-200/30 dark:from-cyan-800/20 dark:to-emerald-800/20 rounded-full backdrop-blur-sm" />
          </div>
          
          <div className="container mx-auto px-4 relative">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 rounded-full mb-6 border border-violet-200/50 dark:border-violet-700/50">
                <div className="w-4 h-4 bg-violet-600 dark:bg-violet-400 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              
              <Skeleton className="h-16 w-96 mx-auto mb-6" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            
            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="group h-full relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-xl">
                  <div className="flex flex-col items-center justify-center p-8 h-full min-h-[200px]">
                    {/* Icon */}
                    <div className="relative mb-6">
                      <Skeleton className="h-16 w-16 rounded-full" />
                    </div>
                    
                    {/* Content */}
                    <div className="text-center space-y-3">
                      <Skeleton className="h-6 w-32 mx-auto" />
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 bg-slate-400 dark:bg-slate-500 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* View All Button */}
            <div className="text-center mt-12">
              <Skeleton className="h-12 w-64 rounded-2xl mx-auto" />
            </div>
          </div>
        </section>

        {/* How It Works Section - Interactive Process Flow */}
        <section className="py-24 relative overflow-hidden">
          {/* Background with Parallax Effect */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-blue-50/30 to-cyan-50/50 dark:from-violet-950/30 dark:via-blue-950/20 dark:to-cyan-950/30" />
          </div>
          
          <div className="container mx-auto px-4 relative">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full mb-6 border border-blue-200/50 dark:border-blue-700/50">
                <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              
              <Skeleton className="h-16 w-80 mx-auto mb-6" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            
            {/* Process Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="relative group">
                  {/* Step Card */}
                  <div className="relative h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-xl">
                    {/* Step Number */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full" />
                    
                    {/* Icon */}
                    <div className="relative mb-6 flex justify-center">
                      <div className="relative w-20 h-20 bg-gradient-to-br from-violet-500 to-blue-500 rounded-2xl flex items-center justify-center">
                        <div className="w-10 h-10 bg-white rounded-full" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-4 p-8">
                      <Skeleton className="h-6 w-32 mx-auto" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Call to Action */}
            <div className="text-center mt-16">
              <Skeleton className="h-12 w-80 rounded-2xl mx-auto" />
            </div>
          </div>
        </section>

        {/* Enhanced Testimonials Section - Social Proof */}
        <section className="py-24 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 via-transparent to-blue-50/30 dark:from-violet-950/20 dark:via-transparent dark:to-blue-950/20" />
            
            {/* Floating Testimonial Bubbles */}
            <div className="absolute top-16 left-10 w-24 h-24 bg-violet-200/20 dark:bg-violet-800/20 rounded-full backdrop-blur-sm" />
            <div className="absolute bottom-20 right-16 w-32 h-32 bg-blue-200/20 dark:bg-blue-800/20 rounded-3xl backdrop-blur-sm" />
          </div>
          
          <div className="container mx-auto px-4 relative">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 rounded-full mb-6 border border-violet-200/50 dark:border-violet-700/50">
                <div className="w-4 h-4 bg-violet-600 dark:bg-violet-400 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              
              <Skeleton className="h-16 w-96 mx-auto mb-6" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            
            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="group">
                  <div className="h-full relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-xl">
                    {/* Quote Background */}
                    <div className="absolute top-6 right-6 text-6xl text-violet-100 dark:text-violet-900/30 font-serif">
                      "
                    </div>
                    
                    {/* User Info */}
                    <div className="flex items-center p-8">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-blue-500 rounded-full" />
                        <Skeleton className="absolute inset-1 rounded-full" />
                      </div>
                      
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-40" />
                        <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-violet-100 dark:bg-violet-900/30 rounded-full">
                          <div className="w-3 h-3 bg-violet-600 dark:bg-violet-400 rounded-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Testimonial Content */}
                    <div className="px-8 pb-8">
                      <div className="mb-6">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6 mb-2" />
                        <Skeleton className="h-4 w-4/6" />
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {Array(5).fill(0).map((_, j) => (
                            <div key={j} className="w-5 h-5 bg-yellow-400 rounded-full" />
                          ))}
                        </div>
                        
                        <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-16 pt-12 border-t border-slate-200/50 dark:border-slate-700/50">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/30">
                  <div className="relative">
                    <div className="w-6 h-6 bg-violet-600 dark:bg-violet-400 rounded-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}