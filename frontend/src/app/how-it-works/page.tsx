import { Card, CardContent } from "@/components/ui/card"
import { Search, Calendar, Star, UserCheck, Shield } from "lucide-react"

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      title: "Search for Services",
      description: "Browse through our extensive catalog of services or use our smart search to find exactly what you need.",
    },
    {
      icon: Calendar,
      title: "Book an Appointment",
      description: "Choose your preferred date and time slot that works best for you. Our real-time booking system ensures instant confirmation.",
    },
    {
      icon: UserCheck,
      title: "Get Service Delivered",
      description: "Our verified service provider will arrive at your location on time and deliver quality service as per your requirements.",
    },
    {
      icon: Star,
      title: "Rate and Review",
      description: "Share your experience by rating the service and providing feedback to help other users make informed decisions.",
    },
  ]

  const features = [
    {
      icon: Shield,
      title: "Verified Providers",
      description: "All our service providers undergo thorough background checks and verification process.",
    },
    {
      icon: Star,
      title: "Quality Assurance",
      description: "We maintain high service standards through regular quality checks and customer feedback.",
    },
    {
      icon: Calendar,
      title: "Flexible Scheduling",
      description: "Book services at your convenience with our 24/7 booking system.",
    },
  ]

  return (
    <div className="min-h-screen bg-pearlWhite dark:bg-black">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4 dark:text-white">How It Works</h1>
          <p className="text-center text-gray-500 dark:text-indigo-200/60 mb-12">
            Get the services you need in four simple steps
          </p>

          <div className="space-y-8 mb-16">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:via-[#2B2483] dark:to-[#1E3377] flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">{step.title}</h3>
                  <p className="text-gray-500 dark:text-indigo-200/60">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">Why Choose SewaBazaar?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 dark:border-indigo-950 border border-[#E9E5FF]/20">
                <CardContent className="p-6 text-center">
                  <feature.icon className="w-12 h-12 mx-auto mb-4 text-[#4776E6] dark:text-indigo-400" />
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-indigo-200/60">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Ready to Get Started?</h2>
            <p className="text-gray-500 dark:text-indigo-200/60 mb-8">
              Join thousands of satisfied customers who trust SewaBazaar for their service needs.
            </p>
            <a
              href="/services"
              className="inline-block bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:via-[#2B2483] dark:to-[#1E3377] hover:opacity-90 text-white px-8 py-3 rounded-lg font-medium"
            >
              Browse Services
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 