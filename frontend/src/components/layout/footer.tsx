import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-background to-background/80 border-t border-primary/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:to-[#1E3377]">SewaBazaar</h3>
            <p className="text-muted-foreground">
              Your trusted marketplace for local services in Nepal.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://facebook.com"
                className="text-primary/60 hover:text-primary transition-colors"
              >
                <Facebook size={20} />
              </Link>
              <Link
                href="https://twitter.com"
                className="text-primary/60 hover:text-primary transition-colors"
              >
                <Twitter size={20} />
              </Link>
              <Link
                href="https://instagram.com"
                className="text-primary/60 hover:text-primary transition-colors"
              >
                <Instagram size={20} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:to-[#1E3377] mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/providers"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Service Providers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:to-[#1E3377] mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/services/plumbing"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Plumbing
                </Link>
              </li>
              <li>
                <Link
                  href="/services/cleaning"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Cleaning
                </Link>
              </li>
              <li>
                <Link
                  href="/services/electrical"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Electrical
                </Link>
              </li>
              <li>
                <Link
                  href="/services/beauty"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Beauty & Spa
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:to-[#1E3377] mb-4">Contact Us</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>Kathmandu, Nepal</li>
              <li>Phone: +977 1234567890</li>
              <li>Email: info@sewabazaar.com</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary/10 mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SewaBazaar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
} 