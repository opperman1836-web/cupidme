import Link from 'next/link';
import { Heart, Sparkles, Shield, MapPin } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cupid-50 via-white to-cupid-50">
      {/* Hero */}
      <header className="max-w-6xl mx-auto px-4 pt-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-cupid-500 fill-cupid-500" />
            <span className="text-2xl font-bold text-dark-900">
              Cupid<span className="text-cupid-500">Me</span>
            </span>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-dark-700 hover:text-cupid-500">
              Login
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-cupid-500 text-white rounded-xl text-sm font-semibold hover:bg-cupid-600 transition">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <section className="py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-dark-900 leading-tight">
            Where Love Is<br />
            <span className="text-cupid-500">Earned</span>
          </h1>
          <p className="mt-6 text-xl text-dark-500 max-w-2xl mx-auto">
            No swiping. No shallow games. Prove you care through challenges,
            build real connections, and unlock sponsored dates at amazing venues.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-4 bg-cupid-500 text-white rounded-2xl text-lg font-bold hover:bg-cupid-600 transition shadow-lg shadow-cupid-200">
              Start Your Journey
            </Link>
            <Link href="#how-it-works" className="px-8 py-4 bg-white text-dark-700 rounded-2xl text-lg font-bold hover:bg-dark-50 transition border border-dark-200">
              How It Works
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20">
          <h2 className="text-3xl font-bold text-center text-dark-900 mb-16">
            Dating, Reimagined
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles className="w-8 h-8 text-cupid-500" />}
              title="Effort-Based Matching"
              description="Express genuine interest. When it's mutual, both complete a challenge to prove you're serious. No mindless swiping."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-cupid-500" />}
              title="Challenge Unlocking"
              description="Answer thoughtful questions evaluated by AI. Pass the challenge to unlock 48-hour chat sessions with your match."
            />
            <FeatureCard
              icon={<MapPin className="w-8 h-8 text-cupid-500" />}
              title="Real-World Dates"
              description="As your connection grows, unlock exclusive offers from partner venues — coffee shops, restaurants, and experiences."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="bg-dark-900 rounded-3xl p-12 md:p-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to earn real love?
            </h2>
            <p className="text-dark-400 text-lg mb-8">
              Join thousands finding meaningful connections on CupidMe.
            </p>
            <Link href="/register" className="inline-block px-8 py-4 bg-cupid-500 text-white rounded-2xl text-lg font-bold hover:bg-cupid-600 transition">
              Create Your Profile
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-cupid-500 fill-cupid-500" />
            <span className="font-semibold text-dark-700">CupidMe.org</span>
          </div>
          <p className="text-sm text-dark-400">&copy; 2026 CupidMe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-dark-100 hover:shadow-lg transition">
      <div className="w-14 h-14 bg-cupid-50 rounded-xl flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-dark-900 mb-3">{title}</h3>
      <p className="text-dark-500 leading-relaxed">{description}</p>
    </div>
  );
}
