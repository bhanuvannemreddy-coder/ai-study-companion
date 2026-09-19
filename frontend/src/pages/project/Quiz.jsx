import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleHelp,
  LoaderCircle,
  RotateCcw,
  Send,
  Trophy,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../../api/client";
import ProjectNav from "../../components/layout/ProjectNav";

const QUESTION_COUNT = 5;

function Quiz() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedOption, setSelectedOption] = useState(null);
  const [writtenAnswer, setWrittenAnswer] = useState("");

  const [answerResult, setAnswerResult] = useState(null);
  const [completedResult, setCompletedResult] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => {
    loadProject();
  }, [projectId]);

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

  async function generateQuiz() {
    try {
      setGenerating(true);
      setError("");

      setCompletedResult(null);
      setQuestions([]);
      setAttemptId(null);
      setCurrentIndex(0);
      setAnswerResult(null);
      setSelectedOption(null);
      setWrittenAnswer("");

      const response = await api.post(`/api/projects/${projectId}/quiz`, null, {
        params: {
          question_count: QUESTION_COUNT,
        },
      });

      setAttemptId(response.data.attempt_id);
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error("Quiz generation failed:", error);

      setError(error.response?.data?.detail || "Unable to generate the quiz.");
    } finally {
      setGenerating(false);
    }
  }

  function getCurrentQuestion() {
    return questions[currentIndex];
  }

  function canSubmitCurrentAnswer() {
    const question = getCurrentQuestion();

    if (!question) {
      return false;
    }

    if (question.question_type === "mcq") {
      return selectedOption !== null;
    }

    return writtenAnswer.trim().length > 0;
  }

  async function submitCurrentAnswer() {
    const question = getCurrentQuestion();

    if (!question || !attemptId) {
      return;
    }

    if (!canSubmitCurrentAnswer()) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const answerText =
        question.question_type === "mcq"
          ? String(selectedOption)
          : writtenAnswer.trim();

      const response = await api.post(
        `/api/projects/${projectId}/quiz/${attemptId}/questions/${question.id}/answer`,
        null,
        {
          params: {
            answer_text: answerText,
          },
        },
      );

      setAnswerResult(response.data);
    } catch (error) {
      console.error("Answer submission failed:", error);

      setError(error.response?.data?.detail || "Unable to submit this answer.");
    } finally {
      setSubmitting(false);
    }
  }

  async function goToNextQuestion() {
    const isLastQuestion = currentIndex === questions.length - 1;

    if (isLastQuestion) {
      await completeQuiz();
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSelectedOption(null);
    setWrittenAnswer("");
    setAnswerResult(null);
  }

  async function completeQuiz() {
    if (!attemptId) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await api.post(
        `/api/projects/${projectId}/quiz/${attemptId}/complete`,
      );

      setCompletedResult(response.data);
    } catch (error) {
      console.error("Quiz completion failed:", error);

      setError(error.response?.data?.detail || "Unable to complete the quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  function restartQuiz() {
    setAttemptId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setWrittenAnswer("");
    setAnswerResult(null);
    setCompletedResult(null);
    setError("");
  }

  if (loadingProject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-2 text-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading Quiz...
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
          <p className="text-sm font-medium text-indigo-400">{project.name}</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Adaptive Quiz
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Practice from your project material and get feedback on what you
            understand.
          </p>
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

        {!attemptId && !completedResult && (
          <QuizStart generating={generating} onStart={generateQuiz} />
        )}

        {attemptId && questions.length > 0 && !completedResult && (
          <QuizInProgress
            questions={questions}
            currentIndex={currentIndex}
            selectedOption={selectedOption}
            writtenAnswer={writtenAnswer}
            answerResult={answerResult}
            submitting={submitting}
            onSelectOption={setSelectedOption}
            onChangeWrittenAnswer={setWrittenAnswer}
            onSubmit={submitCurrentAnswer}
            onNext={goToNextQuestion}
          />
        )}

        {completedResult && (
          <QuizResult result={completedResult} onRestart={restartQuiz} />
        )}
      </main>
    </div>
  );
}

function QuizStart({ generating, onStart }) {
  return (
    <section className="mt-10">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-400/10">
          <CircleHelp className="h-8 w-8 text-indigo-400" />
        </div>

        <h2 className="mt-6 text-2xl font-semibold">
          Ready to test your understanding?
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          This quiz is generated from your project's learning material. It
          contains multiple-choice and open-ended questions.
        </p>

        <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
          <InfoCard
            title="5 questions"
            text="A short focused practice session."
          />

          <InfoCard
            title="Mixed format"
            text="MCQ plus open-ended reasoning."
          />

          <InfoCard
            title="Grounded"
            text="Questions come from your material."
          />
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={generating}
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          {generating ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Trophy className="h-4 w-4" />
              Start Quiz
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-left">
      <p className="text-sm font-semibold text-slate-200">{title}</p>

      <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
    </div>
  );
}

function QuizInProgress({
  questions,
  currentIndex,
  selectedOption,
  writtenAnswer,
  answerResult,
  submitting,
  onSelectOption,
  onChangeWrittenAnswer,
  onSubmit,
  onNext,
}) {
  const question = questions[currentIndex];

  if (!question) {
    return null;
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="font-semibold text-white">
            Question {currentIndex + 1}
          </span>

          <span className="ml-2 text-slate-600">of {questions.length}</span>
        </div>

        <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs text-slate-500">
          {question.difficulty}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-indigo-400">
            {question.question_type === "mcq"
              ? "Multiple Choice"
              : "Open Ended"}

            <span className="text-slate-700">·</span>

            {question.concept || "Concept"}
          </div>

          <h2 className="mt-5 text-xl font-semibold leading-8 text-slate-100">
            {question.question_text}
          </h2>

          {question.question_type === "mcq" ? (
            <div className="mt-8 space-y-3">
              {question.options?.map((option, index) => {
                const isSelected = selectedOption === index;

                return (
                  <button
                    key={`${question.id}-${index}`}
                    type="button"
                    onClick={() => !answerResult && onSelectOption(index)}
                    disabled={!!answerResult}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-indigo-500/60 bg-indigo-500/10"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900"
                    } ${answerResult ? "cursor-default" : ""}`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="pt-1 text-sm leading-6 text-slate-300">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              value={writtenAnswer}
              onChange={(event) => onChangeWrittenAnswer(event.target.value)}
              disabled={!!answerResult}
              rows={8}
              placeholder="Write your answer in your own words..."
              className="mt-8 w-full resize-none rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500/40 disabled:cursor-default"
            />
          )}

          {!answerResult ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={
                !(question.question_type === "mcq"
                  ? selectedOption !== null
                  : writtenAnswer.trim()) || submitting
              }
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Answer
                </>
              )}
            </button>
          ) : (
            <div className="mt-8">
              <AnswerFeedback result={answerResult} />

              <button
                type="button"
                onClick={onNext}
                disabled={submitting}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Finishing...
                  </>
                ) : isLastQuestion ? (
                  <>
                    <Trophy className="h-4 w-4" />
                    Finish Quiz
                  </>
                ) : (
                  "Next Question →"
                )}
              </button>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Quiz progress
          </p>

          <div className="mt-4 space-y-2">
            {questions.map((item, index) => {
              const active = index === currentIndex;

              const completed = index < currentIndex;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                    active
                      ? "bg-indigo-500/10 text-indigo-300"
                      : completed
                        ? "text-emerald-400"
                        : "text-slate-600"
                  }`}
                >
                  <span className="text-xs font-semibold">{index + 1}</span>

                  <span className="truncate text-xs">
                    {item.concept || "Question"}
                  </span>

                  {completed && (
                    <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}

function AnswerFeedback({ result }) {
  const correct = result.is_correct;

  return (
    <div
      className={`rounded-xl border px-4 py-4 ${
        correct
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-red-500/20 bg-red-500/5"
      }`}
    >
      <div className="flex items-center gap-2">
        {correct ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <XCircle className="h-5 w-5 text-red-400" />
        )}

        <p
          className={`font-semibold ${
            correct ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {correct ? "Correct" : "Needs Review"}
        </p>

        <span className="ml-auto text-xs font-semibold text-slate-500">
          {Math.round((result.score || 0) * 100)}%
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-400">{result.feedback}</p>
    </div>
  );
}

function QuizResult({ result, onRestart }) {
  const score = result.score_percent || 0;

  return (
    <section className="mt-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/40 px-6 py-14 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Trophy className="h-8 w-8 text-emerald-400" />
        </div>

        <p className="mt-6 text-sm font-medium text-indigo-400">
          Quiz completed
        </p>

        <h2 className="mt-2 text-3xl font-bold">{score}%</h2>

        <p className="mt-3 text-sm text-slate-500">
          You answered {result.answered_questions} of {result.total_questions}{" "}
          questions.
        </p>

        <div className="mx-auto mt-8 max-w-md">
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
              style={{
                width: `${Math.min(100, Math.max(0, score))}%`,
              }}
            />
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-lg text-sm leading-6 text-slate-500">
          This result is now stored as assessment evidence for the project.
        </p>

        <button
          type="button"
          onClick={onRestart}
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
          Take Another Quiz
        </button>
      </div>
    </section>
  );
}

export default Quiz;
