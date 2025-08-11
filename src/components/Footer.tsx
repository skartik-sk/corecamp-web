import { Github, Twitter, Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-camp-dark to-cool-1 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg shadow-lg flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="CoreCamp Logo" 
                className="w-6 h-6 rounded-lg"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="text-xl font-bold text-gradient">
                CoreCamp
              </span>
              <p className="text-xs text-camp-gray">
                IP Marketplace powered by Camp Network
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-6 text-sm">
            <a href="/marketplace" className="text-camp-gray hover:text-white transition-colors">Marketplace</a>
            <a href="/auctions" className="text-camp-gray hover:text-white transition-colors">Auctions</a>
            <a href="/create" className="text-camp-gray hover:text-white transition-colors">Create IP</a>
            <a href="https://campnetwork.xyz" className="text-camp-gray hover:text-white transition-colors">Camp Network</a>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="https://github.com" className="text-camp-gray hover:text-camp-orange transition-colors p-2">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://twitter.com/campnetworkxyz" className="text-camp-gray hover:text-camp-orange transition-colors p-2">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="https://campnetwork.xyz" className="text-camp-gray hover:text-camp-orange transition-colors p-2">
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="border-t border-camp-gray/20 pt-4 mt-6">
          <p className="text-center text-camp-gray text-xs">
            © 2025 CoreCamp. Built for Camp Network Hackathon.
          </p>
        </div>

  {/* Removed duplicate/corrupted copyright and social links */}
      </div>
    </footer>
  )
}
