import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles,
  HeartPulse,
  BookOpenText,
  LineChart,
  Leaf,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const features = [
  {
    icon: HeartPulse,
    title: "Daily mood check-in",
    body: "One tap. Seven honest emotions. A quiet ritual to know how you're really feeling today.",
  },
  {
    icon: BookOpenText,
    title: "Journal that listens",
    body: "Write freely — MindCanvas autosaves and turns your day into a private, searchable diary.",
  },
  {
    icon: Sparkles,
    title: "AI reflections",
    body: "A calm, non-judgmental read on your day: a summary, a stress trigger, and one gentle next step.",
  },
  {
    icon: LineChart,
    title: "Patterns that matter",
    body: "See how sleep, subjects and weekends shape your mood — no dashboards, just quiet insight.",
  },
  {
    icon: Leaf,
    title: "Grow a mood garden",
    body: "Every check-in grows a tiny plant. Skip a day? Growth just pauses — never punishes.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Your entries are yours. AI never diagnoses, never shares, never replaces a real person.",
  },
];

const steps = [
  { n: "01", t: "Check in", d: "Pick the emoji that matches today. Takes 5 seconds." },
  { n: "02", t: "Write a little", d: "Answer one gentle prompt. A sentence is enough." },
  { n: "03", t: "Get reflection", d: "AI offers a summary, a possible trigger, and one small win." },
  { n: "04", t: "See yourself", d: "Weekly charts and patterns reveal what actually helps you thrive." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(1200px 500px at 15% -10%, color-mix(in oklab, var(--sage) 22%, transparent), transparent 60%), radial-gradient(900px 400px at 100% 10%, color-mix(in oklab, var(--terracotta) 18%, transparent), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Built for Class 11 & 12 students
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
              Your AI study companion for the toughest school years.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Track your emotions, understand your stress, and build healthier
              study habits — with a calm AI that listens more than it talks.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link to="/auth">
                  Get Started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <a href="#how-it-works">Learn more</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free while in early access • Private by design • No diagnosing, ever
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="glass soft-shadow mt-16 rounded-3xl p-6 md:p-8"
          >
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-card p-5">
                <p className="text-sm text-muted-foreground">Today, 8:14 am</p>
                <p className="mt-2 font-display text-2xl">How's your morning?</p>
                <div className="mt-4 flex flex-wrap gap-2 text-2xl">
                  {["😊", "🙂", "😐", "😔", "😰", "😡", "😴"].map((e, i) => (
                    <span
                      key={e}
                      className={`rounded-full border border-border px-3 py-1 ${i === 4 ? "bg-primary/10 border-primary" : ""}`}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-card p-5 md:col-span-2">
                <p className="text-xs uppercase tracking-widest text-primary">AI Reflection</p>
                <p className="mt-3 font-display text-xl leading-snug">
                  "You sound tired but proud of how much Chem you covered.
                  Anxiety showed up around mock tests — that's normal, not a
                  verdict on you."
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>• Try 20 min of walk before revising tonight</li>
                  <li>• Sleep before 11:30 — your best mood days follow good sleep</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-widest text-primary">Features</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">
            A quiet companion, not another app to survive.
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-widest text-primary">How it works</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">
              Four small steps. Two minutes a day.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-3xl bg-card p-6">
                <p className="font-display text-4xl text-primary/70">{s.n}</p>
                <p className="mt-4 font-display text-xl">{s.t}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="glass soft-shadow rounded-3xl p-10 text-center md:p-16">
          <h2 className="font-display text-4xl md:text-5xl">
            Feel less overwhelmed. Stay in control.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
            MindCanvas turns daily mood check-ins and short journal entries into
            clear, private insights — so you can spot stress early, build healthier
            study habits, and move through Class 11 & 12 with more confidence.
          </p>
          <ul className="mx-auto mt-8 flex max-w-xl flex-col gap-3 text-left text-sm text-muted-foreground md:flex-row md:justify-center md:text-center">
            <li className="flex items-center gap-2 md:block">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              Free during early access
            </li>
            <li className="flex items-center gap-2 md:block">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              Private, encrypted journal
            </li>
            <li className="flex items-center gap-2 md:block">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              No diagnosing, ever
            </li>
          </ul>
          <Button asChild size="lg" className="mt-10 rounded-full px-10 text-base">
            <Link to="/auth">Sign up free</Link>
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Already journaling?{" "}
            <Link to="/auth" className="underline underline-offset-2 hover:text-foreground">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} MindCanvas. Made for students.</p>
          <p>
            MindCanvas is a reflection tool, not medical advice. If you feel
            overwhelmed, please talk to someone you trust.
          </p>
        </div>
      </footer>
    </div>
  );
}