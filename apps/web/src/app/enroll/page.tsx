'use client';

import { useState } from 'react';
import { CheckCircle, Phone, MapPin, Clock, Award, Heart, Shield, Users, MessageCircle } from 'lucide-react';

const WHATSAPP_LINK = 'https://wa.me/2760782238?text=Hi%2C%20I%27m%20interested%20in%20the%20Caregiver%20Course';

interface FormData {
  fullName: string;
  phone: string;
  location: string;
  courseInterest: string;
}

export default function EnrollPage() {
  const [form, setForm] = useState<FormData>({
    fullName: '',
    phone: '',
    location: '',
    courseInterest: 'Caregiver Programme',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">New Skills Academy</h2>
              <p className="text-emerald-200 text-sm">Accredited Training Provider</p>
            </div>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
          </div>

          <div className="text-center py-8 md:py-16">
            <div className="inline-block bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
              LIMITED TIME — R2,000 (Save R3,500!)
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
              Certified Caregiver Course
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100 mb-2">
              Job-ready healthcare skills in 3 months
            </p>
            <p className="text-emerald-200 mb-8">
              No matric required — Start earning R4,000–R8,000/month
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-colors shadow-lg"
              >
                <MessageCircle className="w-6 h-6" />
                WhatsApp Now
              </a>
              <a
                href="#apply"
                className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-colors shadow-lg"
              >
                Apply Now
              </a>
            </div>
            <p className="mt-4 text-emerald-200 text-sm">
              Only <span className="font-bold text-yellow-300">30 spots</span> available at this price
            </p>
          </div>
        </div>
      </header>

      {/* What You Get */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">What You Get for R2,000</h2>
          <p className="text-center text-gray-500 mb-12">Normally R5,500 — Save R3,500 this week only</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                title: 'Home-Based Care',
                description: 'Complete module on providing professional care in home environments',
                included: true,
              },
              {
                icon: Shield,
                title: 'Health Care Assistant',
                description: 'Full training on assisting healthcare professionals',
                included: true,
              },
              {
                icon: CheckCircle,
                title: 'First Aid & Life Support',
                description: 'Emergency response and CPR certification',
                included: true,
                free: true,
                value: 'R1,200',
              },
              {
                icon: Users,
                title: 'HIV & AIDS Counselling',
                description: 'Certified counselling skills for patient support',
                included: true,
                free: true,
                value: 'R800',
              },
              {
                icon: Award,
                title: 'TB Management',
                description: 'Tuberculosis awareness and patient care protocols',
                included: true,
              },
              {
                icon: Award,
                title: 'Certificate of Completion',
                description: 'Accredited certificate upon finishing all modules',
                included: true,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-100 p-3 rounded-lg">
                    <item.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    {item.free && (
                      <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded mt-1">
                        FREE — Worth {item.value}
                      </span>
                    )}
                    <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Why New Skills Academy?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: 'Start Immediately',
                description: 'No waiting. Enrol today and begin your journey right away.',
              },
              {
                icon: MapPin,
                title: 'No Matric Required',
                description: 'Open to everyone. All you need is the desire to learn.',
              },
              {
                icon: Phone,
                title: 'Direct Support',
                description: 'WhatsApp support throughout your studies. Never feel alone.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-emerald-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Student Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Thandi M.',
                location: 'Johannesburg',
                quote: 'I was unemployed for over a year. After completing my caregiver course, I found a job within 2 weeks. Best decision I ever made.',
              },
              {
                name: 'Sipho K.',
                location: 'Durban',
                quote: 'The course was thorough and practical. Now I earn R6,000/month working at a care facility. My family is proud.',
              },
              {
                name: 'Nomsa D.',
                location: 'Cape Town',
                quote: 'I thought R2,000 was too good to be true, but it was real. The certificate opened doors I never thought possible.',
              },
            ].map((item) => (
              <div key={item.name} className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-gray-600 italic mb-4">&ldquo;{item.quote}&rdquo;</p>
                <p className="font-bold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-400">{item.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-16 px-4 bg-white">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">Apply Now</h2>
          <p className="text-center text-gray-500 mb-8">Fill in your details and we&apos;ll contact you within 24 hours</p>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-800 mb-2">Application Received!</h3>
              <p className="text-green-700 mb-6">
                We&apos;ll contact you shortly. For faster service, message us on WhatsApp:
              </p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                  placeholder="e.g. Thandi Mokoena"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                  placeholder="e.g. 076 123 4567"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  id="location"
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                  placeholder="e.g. Johannesburg, Soweto"
                />
              </div>

              <div>
                <label htmlFor="courseInterest" className="block text-sm font-semibold text-gray-700 mb-1">
                  Course Interest *
                </label>
                <select
                  id="courseInterest"
                  required
                  value={form.courseInterest}
                  onChange={(e) => setForm({ ...form, courseInterest: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow bg-white"
                >
                  <option value="Caregiver Programme">Caregiver Programme — R2,000</option>
                  <option value="Home-Based Care">Home-Based Care</option>
                  <option value="Health Care Assistant">Health Care Assistant</option>
                  <option value="First Aid">First Aid & Life Support</option>
                  <option value="HIV Counselling">HIV & AIDS Counselling</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white py-4 rounded-xl text-lg font-bold transition-colors shadow-lg"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>

              <p className="text-center text-xs text-gray-400">
                By submitting, you agree to be contacted about enrollment.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Urgency Footer */}
      <section className="bg-emerald-700 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Don&apos;t Miss Out</h2>
          <p className="text-emerald-200 mb-6">
            Only <span className="font-bold text-yellow-300">30 spots</span> at the R2,000 special price.
            Normal price is R5,500. Enrol now before it&apos;s too late.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              WhatsApp Now
            </a>
            <a
              href="tel:0760782238"
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Call 076 078 2238
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-semibold text-white mb-1">New Skills Academy</p>
          <p className="text-sm">Accredited Training Provider — Empowering South Africa</p>
          <p className="text-sm mt-2">WhatsApp: 076 078 2238</p>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-400 text-white p-4 rounded-full shadow-2xl z-50 transition-colors"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
