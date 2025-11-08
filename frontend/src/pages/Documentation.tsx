import Navigation from "@/components/Navigation";
import TeamSection from "@/components/team/TeamSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Figma,
  Github,
  Layers,
  Presentation,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/LogoMark";

type ResourceIcon = "system" | "figma" | "notion" | "deck";

interface DocumentationLink {
  key: string;
  title: string;
  description: string;
  owner: string;
  icon: ResourceIcon;
  url?: string;
  instructions?: string;
  example?: string;
}

interface CredentialEntry {
  key: string;
  role: string;
  environment: string;
  email?: string;
  password?: string;
  notes?: string;
  instructions?: string;
}

type ChecklistStatus = "done" | "pending" | "in-progress";

interface ChecklistItem {
  key: string;
  title: string;
  description: string;
  status: ChecklistStatus;
}

const env = import.meta.env;
const fromEnv = (value?: string) => (value?.trim() ? value.trim() : undefined);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "—";

const FRONTEND_BASE_URL =
  import.meta.env.VITE_FRONTEND_BASE_URL ||
  "https://style-genie-frontend.vercel.app";

const documentationLinks: DocumentationLink[] = [
  {
    key: "system-design",
    title: "System Design (LLD + HLD)",
    description:
      "Service-by-service architecture for onboarding, wardrobe digitization, and AI recommendations.",
    owner: "Engineering",
    icon: "system",
    url: "https://pricey-canary-2bc.notion.site/StyleGenie-AI-Powered-Personal-Styling-Ecosystem-System-Design-HLD-LLD-29e5687bd06a8002bc55d7135414c59c?pvs=74",
    instructions:
      "Set VITE_SYSTEM_DESIGN_URL in your .env file to expose the latest diagram.",
    example: "https://www.eraser.io/workspace/stylegenie-system-design",
  },
  {
    key: "pitch",
    title: "Pitch / Executive Deck",
    description:
      "External-facing deck summarizing vision, traction, and roadmap.",
    owner: "Leadership",
    icon: "deck",
    url: fromEnv(env.VITE_PITCH_DECK_URL),
    instructions:
      "Set VITE_PITCH_DECK_URL so the story stays in-sync with delivery.",
    example: "https://drive.google.com/file/d/stylegenie-pitch/view",
  },
];

const members = [
  {
    id: "1",
    name: "EKRAMUL ISLAM SHADIK",
    role: "Backend Engineer | Team Lead",
    team: "Engineering",
    email: "shadik293@gmail.com",
    university: "University of Rajshahi",
    subject: "Information and Communication Engineering",
    skills: ["Django", "Redis", "Postgres"],
    responsibilities: [
      "Builds backend APIs and manages deployments",
      "Integrates chat and payment systems",
    ],
    links: {
      github: "https://github.com/shadikhasan",
      linkedin: "https://www.linkedin.com/in/shadikhasan/",
    },
  },
  {
    id: "2",
    name: "MD HASNAIN ALI",
    role: "ML Engineer",
    team: "Engineering",
    email: "mdhasnainali.01@gmail.com",
    university: "University of Rajshahi",
    subject: "Computer Science and Engineering",
    skills: ["Django", "Redis", "Postgres"],
    responsibilities: [
      "Builds backend APIs and manages deployments",
      "Integrates chat and payment systems",
    ],
    links: {
      github: "https://github.com/mdhasnainali/",
      linkedin: "https://www.linkedin.com/in/mdhasnainali/",
    },
  },
  {
    id: "3",
    name: "HM SAZZAD KADIR",
    role: "Frontend Engineer",
    team: "Engineering",
    email: "sazzad@example.com",
    university: "University of Rajshahi",
    subject: "Information and Communication Engineering",
    skills: ["Figma", "Prototyping", "UI/UX"],
    responsibilities: ["Designs the product UI", "Creates interactive flows"],
    links: { 
      github: "https://github.com/byrthokobi",
      linkedin: "https://linkedin.com/in/hm-sazzad-kadir" },
  },
  {
    id: "4",
    name: "MAIMOONA PRITY",
    role: "Product Designer",
    team: "Design",
    email: "maimoonaprity@gmail.com",
    university: "Islamic University",
    subject: "Information and Communication Engineering",
    skills: ["Figma", "Prototyping", "UI/UX"],
    responsibilities: ["Designs the product UI", "Creates interactive flows"],
    links: {
      github: "https://github.com/maimoonaprity ",
      linkedin: "https://www.linkedin.com/in/maimoona-prity-1312b6299/",
    },
  },
];

const credentialEntries: CredentialEntry[] = [
  {
    key: "client-staging",
    role: "Client / Normal User",
    environment: "Frontend",
    email: "testuser@gmail.com",
    password: "Test@1234",
    notes:
      "Use to walkthrough onboarding, wardrobe management, and AI recommendations.",
  },
  {
    key: "stylist-staging",
    role: "Stylist",
    environment: "Frontend",
    email: "hasnain@gmail.com",
    password: "has@1234",
    notes: "Covers stylist availability, bookings, and payout flows.",
  },
];

const handoffChecklist: ChecklistItem[] = [
  {
    key: "pitch-deck",
    title: "Create Pitch Deck",
    description:
      "Prepare and finalize a clear, concise presentation outlining your solution concept.",
    status: "done",
  },
  {
    key: "video-demo",
    title: "Create Video Demo",
    description:
      "Record and upload a YouTube video demonstrating your project and its core features.",
    status: "done",
  },
];

const iconMap: Record<ResourceIcon, LucideIcon> = {
  system: Layers,
  figma: Figma,
  notion: BookOpen,
  deck: Presentation,
};

const statusStyles: Record<
  ChecklistItem["status"],
  { label: string; icon: LucideIcon; className: string }
> = {
  done: {
    label: "Done",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  "in-progress": {
    label: "In Progress",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700 border-amber-100",
  },
  pending: {
    label: "Pending",
    icon: AlertCircle,
    className: "bg-rose-50 text-rose-700 border-rose-100",
  },
};

const Documentation = () => {
  const heroLinks = documentationLinks.filter((link) =>
    ["system-design", "figma"].includes(link.key)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-8xl pt-24 pb-16 space-y-10">
        <HeroSection links={heroLinks} />
        <TeamSection members={members} />
        <section className="grid gap-6 lg:grid-cols-3">
          <LinksOverview links={documentationLinks} />
          <ChecklistPanel items={handoffChecklist} />
        </section>

        <CredentialsSection entries={credentialEntries} />
      </main>
    </div>
  );
};

interface HeroSectionProps {
  links: DocumentationLink[];
}

const HeroSection = ({ links }: HeroSectionProps) => (
  <section className="bg-gradient-card border border-border/70 rounded-3xl p-8 shadow-large space-y-6">
    <div className="space-y-4">
      <Badge variant="secondary" className="uppercase tracking-wide w-fit">
        Delivery Source of Truth
      </Badge>
      <h1 className="text-4xl md:text-5xl font-bold leading-tight">
        Documentation & Launch Pad
      </h1>
      <p className="text-lg text-muted-foreground max-w-3xl">
        Keep every stakeholder in-sync with the same set of links, demo logins,
        and handoff expectations. Update the env vars referenced on this page to
        refresh the live data.
      </p>
    </div>

    <div className="flex flex-wrap gap-3">
      {links.map((link) =>
        link.url ? (
          <Button key={link.key} asChild size="lg" className="gap-2">
            <a href={link.url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              {link.title}
            </a>
          </Button>
        ) : (
          <Button
            key={link.key}
            size="lg"
            variant="outline"
            className="gap-2"
            disabled
          >
            <ShieldCheck className="h-4 w-4" />
            {link.title} (add link)
          </Button>
        )
      )}
    </div>

    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {/* API Base */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Live API base:</span>
          <a
            href="https://stylegenie-backend.up.railway.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-xs hover:border-primary/50 hover:text-primary transition-colors"
          >
            https://stylegenie-backend.up.railway.app/
          </a>
        </div>

        {/* Frontend Base */}
        <div className="flex items-center gap-2">
          <LogoMark className="h-4 w-4" />
          <span>Frontend URL:</span>
          <a
            href="{FRONTEND_BASE_URL}"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-xs hover:border-primary/50 hover:text-primary transition-colors"
          >
            {FRONTEND_BASE_URL}
          </a>
        </div>
        {/* Repository */}
        <div className="flex items-center gap-2">
          <Github className="h-4 w-4 text-primary" />
          <span>Repository:</span>
          <a
            href={"https://github.com/shadikhasan/StyleGenie"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-xs hover:border-primary/50 hover:text-primary transition-colors"
          >
            https://github.com/shadikhasan/StyleGenie
          </a>
        </div>
      </div>
    </div>
  </section>
);

const LinksOverview = ({ links }: { links: DocumentationLink[] }) => (
  <Card className="lg:col-span-2 shadow-medium">
    <CardHeader>
      <CardTitle>Design & Product Links</CardTitle>
      <CardDescription>
        Main artifacts for architecture, research, and stakeholder reviews.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {links.map((link) => (
        <LinkCard key={link.key} link={link} />
      ))}
    </CardContent>
  </Card>
);

const LinkCard = ({ link }: { link: DocumentationLink }) => {
  const Icon = iconMap[link.icon];

  return (
    <div className="rounded-2xl border border-border/70 p-4 flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 justify-between">
        <div className="flex gap-3 items-start">
          <div
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center text-white",
              {
                "bg-gradient-hero": link.icon === "system",
                "bg-secondary": link.icon === "figma",
                "bg-primary": link.icon === "notion",
                "bg-accent": link.icon === "deck",
              }
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{link.title}</h3>
            <p className="text-sm text-muted-foreground">{link.description}</p>
          </div>
        </div>
        <Badge variant="outline" className="h-fit">
          Owner: {link.owner}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        {link.url ? (
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={link.url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open artifact
            </a>
          </Button>
        ) : (
          <Badge variant="secondary" className="text-destructive">
            Missing link
          </Badge>
        )}
      </div>

      {!link.url && (
        <div className="text-xs text-muted-foreground space-y-1">
          {link.instructions && <p>{link.instructions}</p>}
          {link.example && (
            <p className="text-[11px] text-muted-foreground/70">
              Example: {link.example}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const ChecklistPanel = ({ items }: { items: ChecklistItem[] }) => (
  <Card className="shadow-medium">
    <CardHeader>
      <CardTitle>Handoff Checklist</CardTitle>
      <CardDescription>
        Track what’s ready before demos or go-live.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {items.map((item) => (
        <ChecklistItemCard key={item.key} item={item} />
      ))}
    </CardContent>
  </Card>
);

const ChecklistItemCard = ({ item }: { item: ChecklistItem }) => {
  const { label, icon: StatusIcon, className } = statusStyles[item.status];

  return (
    <div className="rounded-2xl border border-border/70 p-4 space-y-2 bg-muted/30">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{item.title}</h3>
        <Badge variant="outline" className={cn("gap-1", className)}>
          <StatusIcon className="h-3.5 w-3.5" />
          {label}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{item.description}</p>
    </div>
  );
};

const CredentialsSection = ({ entries }: { entries: CredentialEntry[] }) => (
  <section>
    <Card className="shadow-medium bg-primary/15 border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Demo Credentials
        </CardTitle>
        <CardDescription>
          Shared logins for QA, stakeholders, and investors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map((entry) => (
          <CredentialCard key={entry.key} entry={entry} />
        ))}
      </CardContent>
    </Card>
  </section>
);

const CredentialCard = ({ entry }: { entry: CredentialEntry }) => (
  <div className="border border-border/70 rounded-2xl p-4 space-y-4 bg-muted/20">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold">{entry.role}</h3>
        <p className="text-sm text-muted-foreground">{entry.notes}</p>
      </div>
      <Badge className="bg-primary text-white">{entry.environment}</Badge>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 text-sm">
      <CredentialField
        label="Email"
        value={entry.email}
        copyLabel={`${entry.role} email`}
      />
      <CredentialField
        label="Password"
        value={entry.password}
        copyLabel={`${entry.role} password`}
      />
    </div>

    {entry.instructions && (
      <p className="text-xs text-muted-foreground">{entry.instructions}</p>
    )}
  </div>
);

interface CredentialFieldProps {
  label: string;
  value?: string;
  copyLabel: string;
}

const CredentialField = ({ label, value, copyLabel }: CredentialFieldProps) => (
  <div className="space-y-1">
    <p className="text-xs uppercase text-muted-foreground tracking-wide">
      {label}
    </p>
    <div className="flex items-center gap-2">
      <code className="px-2 py-1 rounded-md bg-background border border-border text-xs flex-1">
        {value ?? "Set VITE_* env"}
      </code>
      <CopyButton value={value} label={copyLabel} />
    </div>
  </div>
);

const CopyButton = ({ value, label }: { value?: string; label: string }) => {
  const handleCopy = () => {
    if (!value) {
      toast.error("Nothing to copy yet. Add the missing value first.");
      return;
    }

    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        toast.success(`${label} copied to clipboard`);
      })
      .catch(() => {
        toast.error("Clipboard is not available in this browser.");
      });
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleCopy}
      disabled={!value}
      aria-label={`Copy ${label}`}
    >
      <Copy className="h-4 w-4" />
    </Button>
  );
};

export default Documentation;
