"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { BadgeCheck, Copy, ShieldCheck, Church, BookOpen, Users, Sparkles } from "lucide-react";

// Christianity StackExchange Annual Survey — Vercel-ready React page
// ------------------------------------------------------------------
// This is the front-end page. For production, wire `submitSurvey()` to a
// Vercel serverless API route that:
//   1. Generates/stores an annual token per christianity.SE user id.
//   2. Verifies the token exists on that user's public christianity.SE profile/about page.
//   3. Stores only a salted hash of `${year}:${siteUserId}` for uniqueness.
//   4. Rejects duplicate submissions for the same hash/year.
//   5. Stores survey answers without names, emails, IP addresses, or free-form text.
//
// Suggested API contract:
//   POST /api/token { siteUserId } -> { year, token }
//   POST /api/submit { siteUserId, token, year, answers } -> { ok: true }

const CURRENT_YEAR = new Date().getFullYear();

const selectQuestions = [
  {
    id: "region",
    section: "Demographics",
    label: "Broad region",
    options: ["Africa", "Asia", "Europe", "Latin America / Caribbean", "Middle East", "North America", "Oceania", "Prefer not to say"],
  },
  {
    id: "ageBand",
    section: "Demographics",
    label: "Age range",
    options: ["Under 18", "18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Prefer not to say"],
  },
  {
    id: "christianIdentity",
    section: "Demographics",
    label: "Religious self-identification",
    options: [
      "Christian",
      "Not Christian, interested in Christianity",
      "Former Christian",
      "No religious affiliation",
      "Another religious tradition",
      "Prefer not to say",
    ],
  },
  {
    id: "traditionFamily",
    section: "Tradition",
    label: "Primary Christian tradition or background",
    options: [
      "Roman Catholic",
      "Eastern Orthodox / Oriental Orthodox",
      "Mainline Protestant",
      "Evangelical Protestant",
      "Pentecostal / Charismatic",
      "Reformed / Presbyterian",
      "Anglican / Episcopal",
      "Lutheran",
      "Baptist",
      "Methodist / Wesleyan",
      "Anabaptist",
      "Restorationist / Stone-Campbell",
      "Latter-day Saint",
      "Jehovah's Witness",
      "Multiple / mixed Christian background",
      "Not listed / prefer not to say",
    ],
  },
  {
    id: "scriptureUse",
    section: "Scripture",
    label: "How often do you personally read or study scripture?",
    options: ["Daily", "Several times per week", "Weekly", "Monthly", "A few times per year", "Rarely or never", "Prefer not to say"],
  },
  {
    id: "primaryBibleTradition",
    section: "Scripture",
    label: "Which scripture tradition do you most often use when discussing Christianity?",
    options: [
      "Protestant canon",
      "Catholic canon",
      "Orthodox canon",
      "Multiple canons depending on context",
      "I do not regularly use scripture in answers",
      "Prefer not to say",
    ],
  },
  {
    id: "siteRole",
    section: "Christianity.SE Use",
    label: "How do you mostly use Christianity StackExchange?",
    options: ["Ask questions", "Answer questions", "Read only", "Review / moderate", "A mix of asking, answering, and reading"],
  },
  {
    id: "visitFrequency",
    section: "Christianity.SE Use",
    label: "How often do you visit Christianity.SE?",
    options: ["Daily", "Several times per week", "Weekly", "Monthly", "A few times per year", "Rarely"],
  },
  {
    id: "accountAge",
    section: "Christianity.SE Use",
    label: "How long have you used Christianity.SE?",
    options: ["Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "More than 10 years", "Prefer not to say"],
  },
  {
    id: "otherSites",
    section: "Other Sites and Tools",
    label: "Where else do you most often look for Christianity-related Q&A or explanations?",
    options: [
      "Other StackExchange sites",
      "Reddit or forum communities",
      "Official church or denominational sites",
      "Bible study / commentary sites",
      "Academic or library resources",
      "AI assistants",
      "General web search",
      "I mostly use Christianity.SE",
    ],
  },
  {
    id: "aiUsage",
    section: "Other Sites and Tools",
    label: "How do you use AI tools for Christianity-related topics?",
    options: [
      "I do not use AI tools for these topics",
      "Brainstorming questions",
      "Checking clarity or grammar",
      "Finding background context",
      "Comparing interpretations",
      "Drafting answers before verifying sources",
      "General learning",
    ],
  },
];

const opinionQuestions = [
  { id: "welcome", icon: Users, section: "Site Experience", label: "Christianity.SE feels welcoming to careful, good-faith participants." },
  { id: "clarity", icon: BadgeCheck, section: "Site Experience", label: "The site rules and expectations are clear." },
  { id: "denomFairness", icon: Church, section: "Site Experience", label: "The site handles different Christian traditions fairly." },
  { id: "sourceQuality", icon: BookOpen, section: "Scripture and Sources", label: "Answers usually provide useful scripture, tradition, or source support." },
  { id: "traditionSpecific", icon: Church, section: "Scripture and Sources", label: "Questions are usually clear about which tradition or doctrinal scope they are asking from." },
  { id: "modTrust", icon: ShieldCheck, section: "Moderation", label: "Moderation decisions are understandable and consistent." },
  { id: "closeReasons", icon: ShieldCheck, section: "Moderation", label: "Close reasons help users improve questions rather than merely stop discussion." },
  { id: "newUserGuidance", icon: Users, section: "Features", label: "New users would benefit from stronger guided question templates." },
  { id: "traditionTags", icon: Church, section: "Features", label: "Tradition, denomination, and doctrinal-scope tags are useful for finding good answers." },
  { id: "citationPrompts", icon: BookOpen, section: "Features", label: "Answer prompts should more strongly encourage citations or source context." },
  { id: "aiDisclosure", icon: Sparkles, section: "AI and Other Sites", label: "AI-assisted answers should be disclosed when AI was used materially." },
  { id: "aiConcern", icon: Sparkles, section: "AI and Other Sites", label: "I am concerned that AI-generated content could reduce answer quality on the site." },
  { id: "qaCompetition", icon: Users, section: "AI and Other Sites", label: "Other Q&A sites, forums, search engines, or AI tools are reducing my need to use Christianity.SE." },
  { id: "overallValue", icon: BadgeCheck, section: "Overall", label: "Christianity.SE remains valuable as a public archive of Christian Q&A." },
];

function makeToken(year: number, userId: string) {
  const rand = crypto.getRandomValues(new Uint8Array(12));
  const randomPart = Array.from(rand, (b) => b.toString(16).padStart(2, "0")).join("");
  return `cse-survey-${year}-${userId}-${randomPart}`;
}

export default function ChristianityStackExchangeSurvey() {
  const [siteUserId, setSiteUserId] = useState("");
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [answers, setAnswers] = useState(() => {
    const initial: Record<string, string | number> = {};
    selectQuestions.forEach((q) => (initial[q.id] = ""));
    opinionQuestions.forEach((q) => (initial[q.id] = 5));
    return initial;
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const groupedSelects = useMemo(() => groupBy(selectQuestions, "section"), []);
  const groupedOpinions = useMemo(() => groupBy(opinionQuestions, "section"), []);

  const completion = useMemo(() => {
    const total = selectQuestions.length + opinionQuestions.length;
    const done = selectQuestions.filter((q) => answers[q.id]).length + opinionQuestions.length;
    return Math.round((done / total) * 100);
  }, [answers]);

  function generateToken() {
    const trimmed = siteUserId.trim();
    if (!/^\d+$/.test(trimmed)) {
      setError("Enter your numeric Christianity.SE user id first.");
      return;
    }
    setError("");
    setToken(makeToken(CURRENT_YEAR, trimmed));
  }

  async function copyToken() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function updateAnswer(id: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function submitSurvey() {
    setError("");
    if (!/^\d+$/.test(siteUserId.trim())) {
      setError("Enter your numeric Christianity.SE user id.");
      return;
    }
    if (!token) {
      setError("Generate your annual token and place it on your public Christianity.SE profile before submitting.");
      return;
    }
    const missing = selectQuestions.filter((q) => !answers[q.id]);
    if (missing.length) {
      setError(`Please answer all fixed-choice questions. Missing: ${missing[0].label}`);
      return;
    }

    // Production replacement:
    // await fetch('/api/submit', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ year: CURRENT_YEAR, siteUserId, token, answers })
    // });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <section className="mx-auto max-w-3xl">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-8 text-center">
              <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
              <h1 className="text-3xl font-semibold tracking-tight">Survey submitted</h1>
              <p className="mt-3 text-slate-600">
                Thank you. In production this confirmation appears only after the server verifies your annual token on your public Christianity.SE profile and confirms that this user id has not already submitted for {CURRENT_YEAR}.
              </p>
              <Button className="mt-6 rounded-2xl" onClick={() => setSubmitted(false)}>Review responses</Button>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <section className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Christianity StackExchange</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{CURRENT_YEAR} Community Survey</h1>
              <p className="mt-3 max-w-3xl text-slate-600">
                A fixed-choice annual survey about community demographics, scripture and tradition, site use, other Q&A/AI tools, and feature preferences. No names, emails, contact info, IP display, or free-form answers are requested.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-center">
              <div className="text-2xl font-semibold">{completion}%</div>
              <div className="text-xs text-slate-500">complete</div>
            </div>
          </div>
        </header>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-6 w-6 text-emerald-600" />
              <div>
                <h2 className="text-xl font-semibold">Annual non-PII verification</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Enter your numeric Christianity.SE user id, generate a token, and place the token somewhere on your public StackExchange user page/profile for this year. The production submit endpoint should verify the token publicly and store only a salted hash of your user id plus survey year to prevent duplicate submissions.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="siteUserId">Christianity.SE numeric user id</Label>
                <Input id="siteUserId" inputMode="numeric" value={siteUserId} onChange={(e) => setSiteUserId(e.target.value.replace(/\D/g, ""))} placeholder="Example: 12345" className="rounded-2xl" />
              </div>
              <Button onClick={generateToken} className="rounded-2xl">Generate annual token</Button>
            </div>

            {token && (
              <div className="rounded-2xl border bg-slate-50 p-4">
                <Label>Place this token on your public Christianity.SE user page/profile</Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <code className="flex-1 overflow-x-auto rounded-xl bg-white p-3 text-sm text-slate-800">{token}</code>
                  <Button variant="secondary" onClick={copyToken} className="rounded-2xl"><Copy className="mr-2 h-4 w-4" />{copied ? "Copied" : "Copy"}</Button>
                </div>
                <p className="mt-2 text-xs text-slate-500">Token validity: {CURRENT_YEAR}. One verified submission is allowed per Christianity.SE user id per year.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {Object.entries(groupedSelects).map(([section, questions]) => (
          <Card key={section} className="rounded-2xl shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold">{section}</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <Label>{q.label}</Label>
                    <Select value={answers[q.id] as string} onValueChange={(value) => updateAnswer(q.id, value)}>
                      <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Select one" /></SelectTrigger>
                      <SelectContent>
                        {q.options.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {Object.entries(groupedOpinions).map(([section, questions]) => (
          <Card key={section} className="rounded-2xl shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold">{section}</h2>
              <p className="mt-1 text-sm text-slate-500">Sliding scale: 1 = low / strongly disagree, 10 = high / strongly agree.</p>
              <div className="mt-6 space-y-7">
                {questions.map((q) => {
                  const Icon = q.icon;
                  return (
                    <div key={q.id} className="rounded-2xl border bg-white p-4">
                      <div className="flex gap-3">
                        <Icon className="mt-0.5 h-5 w-5 text-slate-500" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <Label className="text-base leading-snug">{q.label}</Label>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">{answers[q.id]}</span>
                          </div>
                          <Slider className="mt-4" min={1} max={10} step={1} value={[answers[q.id] as number]} onValueChange={([value]) => updateAnswer(q.id, value)} />
                          <div className="mt-2 flex justify-between text-xs text-slate-400"><span>1 low</span><span>10 high</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <footer className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">No free-form responses. All opinion questions use a 1–10 scale.</p>
          <Button onClick={submitSurvey} className="rounded-2xl px-6">Submit verified survey</Button>
        </footer>
      </section>
    </main>
  );
}

function groupBy<T extends { section: string }>(
  items: T[],
  key: keyof T
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const group = item[key] as string;
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

