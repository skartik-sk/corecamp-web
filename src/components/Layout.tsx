import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import IntegrationStatus from './IntegrationStatus'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-camp-orange/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warm-2/5 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cool-2/5 rounded-full blur-3xl animate-float"></div>
      </div>
      
      <Header />
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>
      <Footer />
      
      {/* Integration Status */}
      <IntegrationStatus />
    </div>
  )
}
