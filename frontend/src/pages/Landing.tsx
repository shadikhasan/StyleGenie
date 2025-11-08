import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import {
  User,
  Palette,
  TrendingUp,
  CalendarClock,
  ShieldCheck,
  UserCheck,
  UserCog,
} from "lucide-react";
import heroImage from "@/assets/hero.png";
import wardrobeImage from "@/assets/wardrobe-digital.jpg";
import stylistImage from "@/assets/stylist-work.jpg";
import { LogoMark } from "@/components/LogoMark";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Your Personal{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  AI Stylist
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Discover your perfect style with AI-powered outfit
                recommendations and connect with professional stylists for
                personalized consultations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/register")}
                  className="text-lg"
                >
                  Start Styling Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/stylists")}
                >
                  Browse Stylists
                </Button>
              </div>
            </div>
            <div className="relative animate-fade-in">
              <div className="absolute -inset-4 bg-gradient-hero opacity-20 blur-3xl rounded-full"></div>
              <img
                src={heroImage}
                alt="Fashion styling"
                className="relative rounded-2xl shadow-large w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How StyleGenie Works</h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to transform your style
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-medium transition-all bg-gradient-card border-none">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Build Your Profile</h3>
              <p className="text-muted-foreground">
                Tell us about your body type, preferences, and style goals.
                Upload your wardrobe items to get started.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-medium transition-all bg-gradient-card border-none">
              <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <LogoMark className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Get AI Recommendations</h3>
              <p className="text-muted-foreground">
                Our AI analyzes your wardrobe and preferences to suggest perfect
                outfit combinations for any occasion.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-medium transition-all bg-gradient-card border-none">
              <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <UserCheck className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Book Expert Stylists</h3>
              <p className="text-muted-foreground">
                Connect with professional stylists for personalized advice and
                exclusive styling sessions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Digital Wardrobe Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src={wardrobeImage}
                alt="Digital wardrobe"
                className="rounded-2xl shadow-large w-full"
              />
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <h2 className="text-4xl font-bold">
                Your Wardrobe,{" "}
                <span className="bg-gradient-accent bg-clip-text text-transparent">
                  Digitized
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Organize your entire wardrobe in one place. Tag items by
                category, color, and occasion. Never forget what you own again.
              </p>
              <ul className="space-y-3">
                {[
                  "Smart categorization and tagging",
                  "Mix and match outfits instantly",
                  "Track what works best for you",
                  "Get personalized recommendations",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate("/dashboard")}>
                Explore Wardrobe
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stylist Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold">
                Work with{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  Expert Stylists
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Book one-on-one sessions with verified fashion professionals.
                Get personalized advice tailored to your unique style and needs.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg mt-1">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Verified professionals</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">
                      Verified Professionals
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      All stylists are vetted and certified with proven
                      expertise
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-secondary/10 text-secondary p-2 rounded-lg mt-1">
                    <CalendarClock className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Flexible sessions</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Flexible Sessions</h4>
                    <p className="text-sm text-muted-foreground">
                      Book sessions that fit your schedule and budget
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate("/stylists")}>
                Find Your Stylist
              </Button>
            </div>
            <div>
              <img
                src={stylistImage}
                alt="Professional stylist"
                className="rounded-2xl shadow-large w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-hero rounded-3xl p-12 text-center shadow-large">
            <h2 className="text-4xl font-bold text-primary-foreground mb-4">
              Ready to Transform Your Style?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join thousands of users discovering their perfect style with AI
              and expert stylists
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/register")}
              className="text-lg"
            >
              Get Started for Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 StyleGenie. Democratizing fashion, one outfit at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
