/**
 * Footer Component for SewaBazaar
 * 
 * A comprehensive footer component that provides:
 * - Brand information and logo display
 * - Quick navigation links to main pages
 * - Provider-specific resources and links
 * - Contact information with location, phone, and email
 * - Social media links (Facebook, Twitter, Instagram)
 * - Legal links (Terms, Privacy, Refund Policy)
 * - Copyright information and credits
 * 
 * Features:
 * - Responsive design that adapts from single column on mobile to 4 columns on desktop
 * - Dark/light theme support with proper contrast
 * - Animated heart icon with pulse effect and glow
 * - Hover effects and smooth transitions
 * - Accessibility features with proper sr-only labels
 * - Toast notifications for social media interactions
 */

import Link from "next/link"
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Heart } from "lucide-react"
import Image from "next/image"
import { showToast } from "@/components/ui/enhanced-toast"

/**
 * Main Footer Component
 * Renders the complete footer section with all information and links
 */
export function Footer() {
  /**
   * Handle social media link clicks
   * Shows appropriate toast messages for social media interactions
   * @param {string} platform - The social media platform name
   */
  const handleSocialClick = (platform: string) => {
    showToast.info({
      title: "Social Media",
      description: `Opening ${platform} page...`,
      duration: 2000
    })
  }

  /**
   * Handle contact info clicks
   * Provides user feedback when clicking contact information
   * @param {string} type - Type of contact (phone, email, address)
   * @param {string} value - The contact value being copied or accessed
   */
  const handleContactClick = (type: string, value: string) => {
    if (type === 'phone' || type === 'email') {
      // Copy to clipboard for phone and email
      navigator.clipboard.writeText(value).then(() => {
        showToast.success({
          title: "Copied to Clipboard",
          description: `${type === 'phone' ? 'Phone number' : 'Email address'} copied successfully`,
          duration: 3000
        })
      }).catch(() => {
        showToast.error({
          title: "Copy Failed",
          description: "Unable to copy to clipboard",
          duration: 3000
        })
      })
    } else if (type === 'address') {
      showToast.info({
        title: "Location",
        description: "Opening location in maps...",
        duration: 2000
      })
    }
  }

  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-black/95 text-gray-600 dark:text-gray-300">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Grid - 4 columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Section - Logo, description, and social media */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/favicon.png"
                alt="SewaBazaar Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                SewaBazaar
              </h3>
            </div>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Your trusted marketplace for local services in Nepal. Find skilled professionals for all your needs.
            </p>
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <button 
                onClick={() => handleSocialClick('Facebook')}
                className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </button>
              <button 
                onClick={() => handleSocialClick('Twitter')}
                className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </button>
              <button 
                onClick={() => handleSocialClick('Instagram')}
                className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </button>
            </div>
          </div>

          {/* Quick Links Section - Main navigation pages */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Provider Resources Section - Information for service providers */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">For Providers</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/register?type=provider" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  Become a Provider
                </Link>
              </li>
              <li>
                <Link href="/provider-guidelines" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  Provider Guidelines
                </Link>
              </li>
              <li>
                <Link href="/provider-faq" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  Provider FAQ
                </Link>
              </li>
              <li>
                <Link href="/provider-resources" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information Section - Address, phone, email with click interactions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 text-primary" />
                <button 
                  onClick={() => handleContactClick('address', 'Thamel, Kathmandu, Nepal')}
                  className="text-left hover:text-primary transition-colors"
                >
                  Thamel, Kathmandu, Nepal
                </button>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                <button 
                  onClick={() => handleContactClick('phone', '+977 1 4123456')}
                  className="hover:text-primary transition-colors"
                >
                  +977 1 4123456
                </button>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                <button 
                  onClick={() => handleContactClick('email', 'info@sewabazaar.com')}
                  className="hover:text-primary transition-colors"
                >
                  info@sewabazaar.com
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Section - Copyright and legal links */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} SewaBazaar. All rights reserved.</p>
          {/* Legal Links */}
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/refund" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>

        {/* Credits Section - Made with love attribution */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
            Made with{" "}
            <span className="inline-block animate-pulse">
              <Heart className="h-4 w-4 text-red-500 fill-red-500 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
            </span>
            {" "}by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Farhan Alam & Team
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
} 