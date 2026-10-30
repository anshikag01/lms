import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Sparkles,
  Check
} from 'lucide-react';

export const QuizPage: React.FC = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['quiz', courseSlug],
    queryFn: () => api.getQuiz(courseSlug!),
    enabled: !!courseSlug
  });

  const submitMutation = useMutation({
    mutationFn: () => api.submitQuizAttempt(courseSlug!, selectedAnswers),
    onSuccess: (res) => {
      setAttemptResult(res);
      setQuizSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['quiz', courseSlug] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['learnCourse', courseSlug] });

      if (res.attempt.passed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Preparing assessment questions...</p>
        </div>
      </div>
    );
  }

  if (isError || !data?.quiz) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center max-w-md">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Assessment Not Available</h2>
          <p className="mt-2 text-xs text-slate-500">
            This course currently does not have an active certification quiz.
          </p>
          <Link
            to={`/learn/${courseSlug}`}
            className="mt-6 inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
          >
            Back to Course Player
          </Link>
        </div>
      </div>
    );
  }

  const { quiz, courseTitle, questions, attempts } = data;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const allAnswered = questions.every((q) => selectedAnswers[q.id] !== undefined);

  const handleSelectOption = (optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setAttemptResult(null);
    setCurrentQuestionIndex(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* TOP BREADCRUMB STRIP */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to={`/learn/${courseSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Lessons</span>
          </Link>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Pass Threshold: {quiz.passPercentage}%
          </span>
        </div>

        {/* QUIZ HEADER */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-6 shadow-xs mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Certification Exam · {courseTitle}
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {quiz.title}
          </h1>
        </div>

        {/* RESULTS SCREEN */}
        {quizSubmitted && attemptResult ? (
          <div className="space-y-6">
            
            {/* Score Banner */}
            <div
              className={`p-8 rounded-2xl text-center border shadow-md ${
                attemptResult.attempt.passed
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              }`}
            >
              <div className="text-5xl font-extrabold font-mono tabular-nums mb-2">
                {attemptResult.attempt.score}%
              </div>
              <h2 className="text-lg font-bold">
                {attemptResult.attempt.passed ? 'Assessment Passed! Congratulations.' : 'Assessment Not Passed'}
              </h2>
              <p className="text-xs mt-1 max-w-md mx-auto opacity-80">
                {attemptResult.attempt.passed
                  ? `You achieved over ${quiz.passPercentage}% accuracy required for full course accreditation.`
                  : `You need at least ${quiz.passPercentage}% to earn your verified course certificate. Review the questions below and try again.`}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {attemptResult.certificateId ? (
                  <Link
                    to={`/certificate/${attemptResult.certificateId}`}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    <span>View Your Certificate</span>
                  </Link>
                ) : attemptResult.attempt.passed ? (
                  <Link
                    to={`/learn/${courseSlug}`}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    Finish Remaining Lessons to Unlock Certificate
                  </Link>
                ) : (
                  <button
                    onClick={handleRetake}
                    className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Assessment</span>
                  </button>
                )}
              </div>
            </div>

            {/* In-depth Answer Feedback List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-6 shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Question Review & Explanations
              </h3>

              <div className="space-y-6">
                {attemptResult.feedback.map((item: any, idx: number) => (
                  <div
                    key={item.questionId}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                        {idx + 1}. {item.question}
                      </h4>
                      {item.isCorrect ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 shrink-0">
                          <CheckCircle2 className="w-4 h-4" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 shrink-0">
                          <XCircle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800/60 text-xs space-y-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        Explanation:
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* ACTIVE QUESTION CARD FLOW */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Step Counter Strip */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">
                Question <span className="font-mono tabular-nums">{currentQuestionIndex + 1}</span> of <span className="font-mono tabular-nums">{totalQuestions}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {Object.keys(selectedAnswers).length} of {totalQuestions} answered
              </span>
            </div>

            {/* Progress line */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Question Text */}
            <div className="py-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentQuestion.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full p-4 rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>

              {isLastQuestion ? (
                <button
                  disabled={!allAnswered || submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitMutation.isPending ? 'Grading Exam...' : 'Submit Final Assessment'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Next Question →
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
