import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
  Send,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../../api/client";
import ProjectNav from "../../components/layout/ProjectNav";

function Tutor() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, asking]);

  async function loadProject() {
    try {
      setLoadingProject(true);
      setError("");

      const response = await api.get(`/api/projects/${projectId}`);

      setProject(response.data);
    } catch (error) {
      console.error("Failed to load project:", error);

      setError(error.response?.data?.detail || "Unable to load this project.");
    } finally {
      setLoadingProject(false);
    }
  }

  async function handleAsk(event) {
    event?.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || asking) {
      return;
    }

    setError("");

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);

    setQuestion("");
    setAsking(true);

    try {
      const response = await api.post(`/api/projects/${projectId}/tutor`, {
        question: trimmedQuestion,
        top_k: 5,
      });

      const tutorResponse = response.data;

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: tutorResponse.answer,
        grounded: tutorResponse.grounded,
        sources: tutorResponse.sources || [],
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      console.error("Tutor request failed:", error);

      const detail =
        error.response?.data?.detail || "The Tutor could not answer right now.";

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "error",
          content: detail,
        },
      ]);
    } finally {
      setAsking(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAsk(event);
    }
  }

  if (loadingProject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-2 text-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading Tutor...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-sm text-slate-500">Project not found.</p>

          <Link
            to="/home"
            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to project
        </Link>

        <header className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-400/10">
              <MessageSquareText className="h-6 w-6 text-indigo-400" />
            </div>

            <div>
              <p className="text-sm font-medium text-indigo-400">
                {project.name}
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                AI Tutor
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Ask questions about your project material. The Tutor retrieves
                relevant evidence before generating an answer.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-8">
          <ProjectNav projectId={projectId} />
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="border-b border-slate-800 bg-slate-900/60 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Bot className="h-5 w-5 text-indigo-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold">Project Tutor</p>

                  <p className="text-xs text-slate-600">
                    Grounded in your project materials
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 sm:flex">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Grounded answers
              </div>
            </div>
          </div>

          <div className="min-h-[520px] max-h-[620px] overflow-y-auto px-5 py-6">
            {messages.length === 0 ? (
              <EmptyTutorState />
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {asking && (
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
                      <Bot className="h-4 w-4 text-indigo-400" />
                    </div>

                    <div className="rounded-2xl rounded-tl-md border border-slate-800 bg-slate-900 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Searching your material and thinking...
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 bg-slate-950/60 p-4">
            <form onSubmit={handleAsk}>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 transition focus-within:border-indigo-500/40">
                <textarea
                  ref={inputRef}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={asking}
                  rows={3}
                  placeholder="Ask something about your learning material..."
                  className="w-full resize-none bg-transparent px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed"
                />

                <div className="flex items-center justify-between border-t border-slate-800 px-3 py-2">
                  <p className="hidden text-xs text-slate-600 sm:block">
                    Press Enter to ask · Shift + Enter for a new line
                  </p>

                  <button
                    type="submit"
                    disabled={!question.trim() || asking}
                    className="ml-auto inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
                  >
                    {asking ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Thinking
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Ask Tutor
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

function EmptyTutorState() {
  return (
    <div className="flex min-h-[430px] items-center justify-center">
      <div className="max-w-2xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-400/10">
          <MessageSquareText className="h-7 w-7 text-indigo-400" />
        </div>

        <h2 className="mt-6 text-xl font-semibold">Ask your Tutor</h2>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          Ask any question about your project materials. The Tutor will search
          your learning material and use relevant evidence to answer.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isError = message.role === "error";

  if (isError) {
    return (
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
        </div>

        <div className="max-w-3xl rounded-2xl rounded-tl-md border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm leading-7 text-red-300">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
          <Bot className="h-4 w-4 text-indigo-400" />
        </div>
      )}

      <div
        className={`max-w-3xl ${
          isUser
            ? "rounded-2xl rounded-tr-md bg-indigo-500 px-4 py-3 text-white"
            : "rounded-2xl rounded-tl-md border border-slate-800 bg-slate-900 px-4 py-4 text-slate-300"
        }`}
      >
        {isUser ? (
          <div className="flex items-start gap-3">
            <User className="mt-1 h-4 w-4 shrink-0 text-indigo-200" />

            <p className="whitespace-pre-wrap text-sm leading-6">
              {message.content}
            </p>
          </div>
        ) : (
          <>
            <div className="whitespace-pre-wrap text-sm leading-7">
              {message.content}
            </div>

            {message.grounded && (
              <div className="mt-5 border-t border-slate-800 pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-400" />

                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sources
                  </span>
                </div>

                <div className="space-y-2">
                  {message.sources?.map((source, index) => (
                    <div
                      key={`${source.material_id}-${source.page_number}-${index}`}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5"
                    >
                      <p className="text-xs font-medium text-slate-300">
                        {source.source}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Page {source.page_number}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!message.grounded && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/15 bg-amber-500/5 px-3 py-2.5 text-xs leading-5 text-amber-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                <span>
                  The Tutor could not find enough evidence in this project's
                  materials to support a reliable answer.
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800">
          <User className="h-4 w-4 text-slate-400" />
        </div>
      )}
    </div>
  );
}

export default Tutor;
