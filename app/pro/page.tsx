import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Sparkles, Palette, TrendingUp, Zap, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function ProPage() {
  const features = [
    {
      icon: <CheckCircle className="h-8 w-8 text-blue-500" />,
      title: "Verified Badge",
      description:
        "Get the exclusive verified checkmark badge on your profile and posts, showing you're a valued member of the Peeak community.",
    },
    {
      icon: <Palette className="h-8 w-8 text-purple-500" />,
      title: "Customized Profile Themes",
      description:
        "Stand out with custom profile themes. Choose unique color schemes and layouts to personalize your profile and express your style.",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
      title: "Boosted Visibility",
      description:
        "Your posts get priority placement in feeds, helping you reach more people and grow your audience faster.",
    },
    {
      icon: <Zap className="h-8 w-8 text-orange-500" />,
      title: "Early Access to Features",
      description:
        "Be the first to try new features before they're released to everyone. Shape the future of Peeak with your feedback.",
    },
  ]

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 flex justify-center bg-background">
        <div className="flex-1 max-w-[800px] p-6 space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 pt-8">
            <Badge className="mb-2" variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              Premium Membership
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Peeak Pro
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock exclusive features and take your Peeak experience to the next level
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 pt-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Ready to upgrade?</CardTitle>
              <CardDescription className="text-base">
                Join Peeak Pro today and support the platform while unlocking exclusive features
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="https://www.patreon.com/15085349/join" target="_blank" rel="noopener noreferrer">
                  Upgrade to Pro
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="text-center text-sm text-muted-foreground space-y-2 pt-4">
            <p>After subscribing on Patreon, contact an admin to activate your Pro features.</p>
            <p>Pro membership supports the development and maintenance of Peeak.</p>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
