"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Star,
  Download,
  TrendingUp,
  Award,
  CheckCircle,
  Play,
  ArrowRight,
  Smartphone,
  Monitor,
  Tablet,
  BarChart3,
  Calendar,
  Target,
  Shield,
  Zap,
  Heart,
} from "lucide-react"

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Smart Attendance Tracking",
      description: "Effortlessly track your class attendance with intelligent goal setting and progress monitoring.",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Grade Analytics",
      description: "Visualize your academic performance with detailed charts and trend analysis.",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Goal Management",
      description: "Set and track academic goals with personalized recommendations and insights.",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Performance Insights",
      description: "Get actionable insights to improve your academic performance and stay on track.",
      image: "/placeholder.svg?height=400&width=600",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science Student",
      university: "MIT",
      rating: 5,
      text: "GradeIT completely transformed how I track my academic progress. The attendance tracking feature helped me maintain above 90% attendance across all subjects!",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Michael Rodriguez",
      role: "Engineering Student",
      university: "Stanford University",
      rating: 5,
      text: "The grade analytics are incredible. I can see exactly where I need to improve and the goal tracking keeps me motivated. My GPA improved by 0.8 points!",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Priya Patel",
      role: "MBA Student",
      university: "Harvard Business School",
      rating: 5,
      text: "As an MBA student juggling multiple commitments, GradeIT's insights help me prioritize my studies effectively. The PDF reports are perfect for academic planning.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ]

  const stats = [
    { number: "50K+", label: "Active Students" },
    { number: "95%", label: "Improved Grades" },
    { number: "4.9", label: "App Store Rating" },
    { number: "200+", label: "Universities" },
  ]

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg">school</span>
                </div>
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">GradeIT</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Reviews
              </a>
              <a
                href="#pricing"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Pricing
              </a>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <button
                className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === "light" ? "bg-primary-100" : ""}`}
                onClick={() => setTheme("light")}
              >
                <span className="material-symbols-outlined text-yellow-500 text-sm">light_mode</span>
              </button>
              <button
                className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-primary-100" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <span className="material-symbols-outlined text-indigo-400 text-sm">dark_mode</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Now Available - Free for Students
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Transform Your
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Academic Journey
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              GradeIT is the ultimate academic companion that helps students track attendance, monitor grades, and
              achieve their educational goals with intelligent insights and beautiful analytics.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/login">
                <Button size="lg" className="px-8 py-4 text-lg">
                  <Download className="w-5 h-5 mr-2" />
                  Start Free Today
                </Button>
              </Link>

              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Beautiful, Intuitive Interface
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Experience academic tracking like never before with our clean, modern interface designed
                    specifically for students.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300">Real-time attendance tracking</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300">Interactive grade analytics</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300">Personalized insights</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-1">
                    <img
                      src="/placeholder.svg?height=500&width=400"
                      alt="GradeIT App Interface"
                      className="w-full rounded-xl"
                    />
                  </div>

                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">95% Attendance</span>
                    </div>
                  </div>

                  <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">GPA: 8.7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to help students track, analyze, and improve their academic performance.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-300 ${
                    activeFeature === index ? "border-primary-500 shadow-lg scale-105" : "hover:shadow-md"
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`p-3 rounded-lg ${
                          activeFeature === index
                            ? "bg-primary-500 text-white"
                            : "bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
                        }`}
                      >
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-2xl p-8">
                <img
                  src={features[activeFeature].image || "/placeholder.svg"}
                  alt={features[activeFeature].title}
                  className="w-full rounded-xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Students Love GradeIT
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Secure & Private</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Your academic data is encrypted and stored securely. We never share your information with third
                  parties.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Lightning Fast</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Built with modern technology for instant loading and real-time updates across all your devices.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Student-Focused</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Designed by students, for students. Every feature is crafted to solve real academic challenges.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Students Worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of students who have transformed their academic journey with GradeIT.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent>
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-6 italic">"{testimonial.text}"</p>

                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                      <div className="text-sm text-primary-600 dark:text-primary-400">{testimonial.university}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Device Compatibility */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Access Anywhere, Anytime
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            GradeIT works seamlessly across all your devices with automatic sync.
          </p>

          <div className="flex justify-center items-center space-x-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-gray-600 dark:text-gray-300">Mobile</span>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tablet className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-gray-600 dark:text-gray-300">Tablet</span>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-gray-600 dark:text-gray-300">Desktop</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Academic Journey?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students who are already achieving their academic goals with GradeIT.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
                  <Download className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-primary-600"
              >
                Try Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <p className="text-sm mt-6 opacity-75">No credit card required • Free forever for students</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg">school</span>
                </div>
                <span className="text-xl font-bold">GradeIT</span>
              </div>
              <p className="text-gray-400">
                Empowering students to achieve academic excellence through intelligent tracking and insights.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Demo
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Discord
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GradeIT. Made with ❤️ for students everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
