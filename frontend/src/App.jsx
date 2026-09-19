import {
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import Activity from "./pages/Activity";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SpaceDetails from "./pages/SpaceDetails";

import ProjectDashboard from "./pages/project/ProjectDashboard";
import Materials from "./pages/project/Materials";
import Tutor from "./pages/project/Tutor";
import Quiz from "./pages/project/Quiz";
import Growth from "./pages/project/Growth";
import Analytics from "./pages/project/Analytics";

import AdminDashboard from "./pages/admin/AdminDashboard";

import ProtectedRoute from "./routes/ProtectedRoute";

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/20">
              <Brain className="h-5 w-5 text-indigo-400" />
            </div>

            <div>
              <p className="font-semibold tracking-tight">AI Study Companion</p>

              <p className="text-xs text-slate-500">Learn with context</p>
            </div>
          </Link>

          <Link
            to="/login"
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <section className="flex min-h-[calc(100vh-81px)] items-center justify-center py-20">
          <div className="max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/15 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-300">
              <Sparkles className="h-4 w-4" />
              Your learning, with context
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
              Turn your study material into{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                a smarter learning journey.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Upload your materials, ask questions grounded in your content,
              practice with adaptive quizzes, and see how your understanding
              grows over time.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>

              <a
                href="#how-it-works"
                className="rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3.5 font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Project-based learning
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Grounded answers
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Measurable progress
              </span>
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* HOW IT WORKS */}
        {/* ================================================= */}

        <section id="how-it-works" className="pb-20 pt-10">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium text-indigo-400">How it works</p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              One place for your learning journey
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Organize your materials, learn with context, test your
              understanding, and track your progress.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "Bring your material",
                text: "Upload PDFs and keep each learning journey organized inside its own project.",
              },
              {
                icon: MessageSquareText,
                title: "Learn with context",
                text: "Ask your Tutor questions and retrieve relevant evidence from your project material.",
              },
              {
                icon: Sparkles,
                title: "Improve continuously",
                text: "Practice, measure mastery, identify weak areas, and know what to learn next.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <Icon className="h-6 w-6 text-indigo-400" />

                  <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================================================= */}
        {/* PUBLIC */}
        {/* ================================================= */}

        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />

        {/* ================================================= */}
        {/* GENERAL PROTECTED */}
        {/* ================================================= */}

        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/spaces/:spaceId"
          element={
            <ProtectedRoute>
              <SpaceDetails />
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* PROJECT */}
        {/* ================================================= */}

        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/materials"
          element={
            <ProtectedRoute>
              <Materials />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/tutor"
          element={
            <ProtectedRoute>
              <Tutor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/quiz"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/growth"
          element={
            <ProtectedRoute>
              <Growth />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* ADMIN */}
        {/* ================================================= */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* FALLBACK */}
        {/* ================================================= */}

        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
