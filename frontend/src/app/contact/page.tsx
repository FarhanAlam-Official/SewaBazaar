import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-pearlWhite dark:bg-black">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 dark:text-white">Contact Us</h1>
          <p className="text-center text-gray-500 dark:text-indigo-200/60 mb-12">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 dark:border-indigo-950 border border-[#E9E5FF]/20">
              <CardContent className="p-6 text-center">
                <Phone className="w-8 h-8 mx-auto mb-4 text-[#4776E6] dark:text-indigo-400" />
                <h3 className="font-semibold mb-2 dark:text-white">Phone</h3>
                <p className="text-gray-500 dark:text-indigo-200/60">+977-1-4XXXXXX</p>
                <p className="text-gray-500 dark:text-indigo-200/60">+977-9XXXXXXXXX</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 dark:border-indigo-950 border border-[#E9E5FF]/20">
              <CardContent className="p-6 text-center">
                <Mail className="w-8 h-8 mx-auto mb-4 text-[#4776E6] dark:text-indigo-400" />
                <h3 className="font-semibold mb-2 dark:text-white">Email</h3>
                <p className="text-gray-500 dark:text-indigo-200/60">info@sewabazaar.com</p>
                <p className="text-gray-500 dark:text-indigo-200/60">support@sewabazaar.com</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 dark:border-indigo-950 border border-[#E9E5FF]/20">
              <CardContent className="p-6 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-4 text-[#4776E6] dark:text-indigo-400" />
                <h3 className="font-semibold mb-2 dark:text-white">Location</h3>
                <p className="text-gray-500 dark:text-indigo-200/60">New Baneshwor</p>
                <p className="text-gray-500 dark:text-indigo-200/60">Kathmandu, Nepal</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 dark:border-indigo-950 border border-[#E9E5FF]/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6 dark:text-white">Send us a Message</h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">Full Name</label>
                    <Input 
                      placeholder="Your full name" 
                      className="bg-white dark:bg-[#1E2433] border-[#E9E5FF]/20 dark:border-indigo-950 dark:text-white dark:placeholder:text-indigo-200/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">Email</label>
                    <Input 
                      type="email" 
                      placeholder="your@email.com" 
                      className="bg-white dark:bg-[#1E2433] border-[#E9E5FF]/20 dark:border-indigo-950 dark:text-white dark:placeholder:text-indigo-200/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Subject</label>
                  <Input 
                    placeholder="How can we help you?" 
                    className="bg-white dark:bg-[#1E2433] border-[#E9E5FF]/20 dark:border-indigo-950 dark:text-white dark:placeholder:text-indigo-200/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Message</label>
                  <Textarea 
                    placeholder="Your message..." 
                    className="min-h-[150px] bg-white dark:bg-[#1E2433] border-[#E9E5FF]/20 dark:border-indigo-950 dark:text-white dark:placeholder:text-indigo-200/30"
                  />
                </div>
                <Button className="w-full md:w-auto bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:via-[#2B2483] dark:to-[#1E3377] hover:opacity-90 text-white">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 