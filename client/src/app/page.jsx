import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Stats from '@/components/landing/Stats';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-900 overflow-x-hidden">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
