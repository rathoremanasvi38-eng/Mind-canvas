import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  Flame,
  LogOut,
  Loader2,
  Save,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { generateReflection, type AIReflection } from "@/lib/journal.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type MoodKey = "happy" | "calm" | "neutral" | "sad" | "anxious" | "frustrated" | "exhausted";
const MOODS: { key: MoodKey; label: string; emoji: string; score: number }[] = [
  { key: "happy", label: "Happy", emoji: "😊", score: 6 },
  { key: "calm", label: "Calm", emoji: "🙂", score: 5 },
  { key: "neutral", label: "Neutral", emoji: "😐", score: 4 },
  { key: "sad", label: "Sad", emoji: "😔", score: 2 },
  { key: "anxious", label: "Anxious", emoji: "😰", score: 2 },
  { key: "frustrated", label: "Frustrated", emoji: "😡", score: 2 },
  { key: "exhausted", label: "Exhausted", emoji: "😴", score: 3 },
];

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  while (true) {
    const s = d.toISOString().slice(0, 10);
    if (set.has(s)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const genFn = useServerFn(generateReflection);

  const [journal, setJournal] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", u.user.id)
        .maybeSingle();
      return { email: u.user.email ?? "", ...(data ?? {}) };
    },
  });

  const moodsQ = useQuery({
    queryKey: ["moods"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 29);
      const { data, error } = await supabase
        .from("mood_entries")
        .select("mood, entry_date")
        .gte("entry_date", since.toISOString().slice(0, 10))
        .order("entry_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const todayJournalQ = useQuery({
    queryKey: ["journal", today()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("content, ai_reflection")
        .eq("entry_date", today())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (todayJournalQ.data?.content && !journal) {
      setJournal(todayJournalQ.data.content);
    }
  }, [todayJournalQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const todayMood = useMemo(
    () => moodsQ.data?.find((m) => m.entry_date === today())?.mood as MoodKey | undefined,
    [moodsQ.data],
  );
  const streak = useMemo(() => computeStreak((moodsQ.data ?? []).map((m) => m.entry_date)), [moodsQ.data]);

  const setMood = useMutation({
    mutationFn: async (mood: MoodKey) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("mood_entries")
        .upsert(
          { user_id: u.user.id, mood, entry_date: today() },
          { onConflict: "user_id,entry_date" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mood saved");
      qc.invalidateQueries({ queryKey: ["moods"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save mood"),
  });

  // Autosave journal (debounced)
  useEffect(() => {
    if (!journal) return;
    if (journal === (todayJournalQ.data?.content ?? "")) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      await supabase.from("journal_entries").upsert(
        { user_id: u.user.id, entry_date: today(), content: journal },
        { onConflict: "user_id,entry_date" },
      );
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    }, 900);
    return () => clearTimeout(t);
  }, [journal]); // eslint-disable-line react-hooks/exhaustive-deps

  const reflectM = useMutation({
    mutationFn: async () => {
      if (!journal.trim()) throw new Error("Write a little first.");
      return await genFn({
        data: { content: journal, entryDate: today(), mood: todayMood },
      });
    },
    onSuccess: () => {
      toast.success("Reflection ready");
      qc.invalidateQueries({ queryKey: ["journal", today()] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not generate reflection"),
  });

  const chartData = useMemo(() => {
    const map = new Map(
      (moodsQ.data ?? []).map((m) => [
        m.entry_date,
        MOODS.find((x) => x.key === m.mood)?.score ?? 4,
      ]),
    );
    const arr: { date: string; score: number | null }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push({
        date: d.toLocaleDateString(undefined, { weekday: "short" }),
        score: map.get(key) ?? null,
      });
    }
    return arr;
  }, [moodsQ.data]);

  const reflection = todayJournalQ.data?.ai_reflection as AIReflection | null | undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-xl">MindCanvas</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await qc.cancelQueries();
              qc.clear();
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
          >
            <LogOut className="mr-1 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="mt-1 font-display text-4xl md:text-5xl">
              {greet()},{" "}
              <span className="text-primary">
                {profileQ.data?.full_name?.split(" ")[0] ?? "friend"}
              </span>
              .
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <Flame className="h-4 w-4 text-primary" />
            <span className="font-medium">{streak}</span>
            <span className="text-muted-foreground">day streak</span>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Mood check-in */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border bg-card p-6 lg:col-span-2"
          >
            <h2 className="font-display text-2xl">How are you today?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick the one closest to how you feel right now.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const selected = todayMood === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setMood.mutate(m.key)}
                    disabled={setMood.isPending}
                    className={`flex items-center gap-2 rounded-2xl border px-4 py-3 transition-all ${
                      selected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-sm font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.section>

          {/* Weekly chart */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-3xl border border-border bg-card p-6"
          >
            <h2 className="font-display text-xl">Last 14 days</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Higher = calmer, happier days.
            </p>
            <div className="mt-4 h-40">
              {moodsQ.isLoading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                    <YAxis domain={[1, 6]} hide />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "var(--primary)" }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.section>

          {/* Journal */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-border bg-card p-6 lg:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl">How was your day?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A sentence is enough. Autosaves as you write.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {saveState === "saving" && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                  </>
                )}
                {saveState === "saved" && (
                  <>
                    <Save className="h-3 w-3" /> Saved
                  </>
                )}
              </div>
            </div>
            <Textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Today I…"
              rows={8}
              className="mt-4 resize-none rounded-2xl border-border bg-background text-base leading-relaxed"
            />
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => reflectM.mutate()}
                disabled={reflectM.isPending || !journal.trim()}
                className="rounded-full"
              >
                {reflectM.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reflecting…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Get AI reflection
                  </>
                )}
              </Button>
            </div>
          </motion.section>

          {/* AI reflection */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/10 p-6"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs uppercase tracking-widest text-primary">Today's Reflection</p>
            </div>
            <AnimatePresence mode="wait">
              {reflection ? (
                <motion.div
                  key="reflection"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-4"
                >
                  <p className="font-display text-lg leading-snug">{reflection.summary}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {reflection.reflection}
                  </p>
                  {reflection.possibleTrigger && (
                    <div className="rounded-2xl bg-background/60 p-3 text-sm">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Possible trigger
                      </p>
                      <p className="mt-1">{reflection.possibleTrigger}</p>
                    </div>
                  )}
                  {reflection.suggestion && (
                    <div className="rounded-2xl bg-background/60 p-3 text-sm">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Try tonight
                      </p>
                      <p className="mt-1">{reflection.suggestion}</p>
                    </div>
                  )}
                  {reflection.studyTip && (
                    <div className="rounded-2xl bg-background/60 p-3 text-sm">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Study tip
                      </p>
                      <p className="mt-1">{reflection.studyTip}</p>
                    </div>
                  )}
                  {reflection.safetyNote && (
                    <div className="rounded-2xl border border-terracotta/40 bg-terracotta/10 p-3 text-sm">
                      <p className="text-xs uppercase tracking-widest text-terracotta">
                        A gentle note
                      </p>
                      <p className="mt-1 text-foreground">{reflection.safetyNote}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-sm text-muted-foreground"
                >
                  Write a few lines and tap "Get AI reflection" — MindCanvas will
                  read your day and offer a calm perspective.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.section>
        </div>

        <p className="mt-16 text-center text-xs text-muted-foreground">
          MindCanvas is not medical advice. If you feel overwhelmed, please
          reach out to someone you trust.
        </p>
      </main>
    </div>
  );
}