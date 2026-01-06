import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Menu, Users, ChefHat, QrCode, Sparkles } from "lucide-react"

export default function HomePage() {
  const features = [
    {
      icon: QrCode,
      title: "QR Menu Ordering",
      description: "Contactless ordering with QR codes at each table for modern dining experiences",
    },
    {
      icon: ChefHat,
      title: "Kitchen Management",
      description: "Real-time order tracking and kitchen display system for efficient operations",
    },
    {
      icon: Users,
      title: "Multi-Location Support",
      description: "Manage multiple restaurant locations from a single, unified platform",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Menu className="h-5 w-5" />
            </div>
            <span>InstaDine</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
          <div className="container relative mx-auto px-4 py-24 text-center md:py-32">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Modern Restaurant Management Platform</span>
            </div>
            <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
              Restaurant Operations,
              <br />
              <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                Simplified & Streamlined
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
              InstaDine is a comprehensive multi-tenant platform for managing your restaurant operations. From QR menu
              ordering to kitchen management, everything you need in one place.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/signup">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t py-20 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-balance text-center text-3xl font-bold md:text-4xl">
              Everything you need to run your restaurant
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-center text-muted-foreground">
              Built for modern restaurants with powerful features that help you serve better and grow faster
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative flex flex-col items-center rounded-xl border bg-card p-8 text-center transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="mb-4 rounded-xl bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-pretty text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-chart-2 p-12 text-center text-primary-foreground shadow-2xl md:p-16">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
            <div className="relative">
              <h2 className="text-balance text-3xl font-bold md:text-4xl">Ready to get started?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-pretty text-primary-foreground/90">
                Join hundreds of restaurants using InstaDine to streamline their operations and delight their customers.
              </p>
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="mt-8 shadow-lg">
                  Create Your Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 InstaDine. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
