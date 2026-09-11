import React, { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Award,
  RefreshCw,
  CalendarCheck,
  Maximize2,
  Minimize2,
  Shuffle,
  Sparkles,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui';
import {
  quizService,
  type Quiz,
  type QuizAnswerSubmit,
  type QuizTopicOption,
  type QuizDifficultyOption,
} from '../services/quizService';
import { useQueryClient } from '@tanstack/react-query';

const DEFAULT_TOPICS: QuizTopicOption[] = [
  { key: 'daily', title: "✨ Today's Daily Challenge", category: 'daily', icon: 'sparkles' },
  { key: 'python', title: '🐍 Python & FastAPI', category: 'backend', icon: 'code' },
  { key: 'react', title: '⚛️ React & Frontend', category: 'frontend', icon: 'layout' },
  { key: 'typescript', title: '📘 TypeScript & JavaScript', category: 'frontend', icon: 'file-code' },
  { key: 'security', title: '🛡️ Web Security & OWASP', category: 'security', icon: 'shield' },
  { key: 'ai', title: '🤖 AI, LLMs & Modern RAG', category: 'ai', icon: 'cpu' },
  { key: 'devops', title: '🐳 DevOps, Docker & K8s', category: 'devops', icon: 'terminal' },
  { key: 'database', title: '🗄️ PostgreSQL & Databases', category: 'database', icon: 'database' },
  { key: 'system_design', title: '🏗️ System Design', category: 'architecture', icon: 'server' },
];

const DEFAULT_DIFFICULTIES: QuizDifficultyOption[] = [
  { key: 'Beginner', label: 'Beginner', badgeColor: 'emerald', desc: 'Syntax & basics' },
  { key: 'Intermediate', label: 'Intermediate', badgeColor: 'amber', desc: 'Patterns & APIs' },
  { key: 'Hard', label: 'Hard', badgeColor: 'rose', desc: 'Internals & edge cases' },
];

export default function QuizWidget() {
  const queryClient = useQueryClient();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<QuizAnswerSubmit[]>([]);
  const [result, setResult] = useState<{ score: number; total: number; feedback: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // User Choices
  const [selectedTopic, setSelectedTopic] = useState('daily');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Intermediate');
  const [topics, setTopics] = useState<QuizTopicOption[]>(DEFAULT_TOPICS);
  const [difficulties, setDifficulties] = useState<QuizDifficultyOption[]>(DEFAULT_DIFFICULTIES);
  const [changingQuiz, setChangingQuiz] = useState(false);

  // Load quiz metadata options on mount
  useEffect(() => {
    quizService.getQuizOptions()
      .then(res => {
        if (res.topics?.length) setTopics(res.topics);
        if (res.difficulties?.length) setDifficulties(res.difficulties);
      })
      .catch(() => {
        // Fallback to local defaults
      });
  }, []);

  // Fetch quiz based on active topic & difficulty
  const fetchQuiz = (topicKey: string, diff: string, seed?: number) => {
    setChangingQuiz(true);
    setAnswers([]);
    setResult(null);
    setError(null);

    quizService.getTodayQuiz({
      topic_key: topicKey,
      difficulty: diff,
      shuffle_seed: seed,
    })
      .then(data => {
        setQuiz(data);
        if (data.already_completed_perfect) {
          setResult({ score: 10, total: 10, feedback: '🎉 Well done! You aced this quiz topic! Choose another topic or level anytime!' });
        }
      })
      .catch(e => {
        if (e.response?.status === 404) {
          setError('No quiz available for this selection.');
        } else {
          setError('Failed to load quiz questions.');
        }
      })
      .finally(() => {
        setLoading(false);
        setChangingQuiz(false);
      });
  };

  useEffect(() => {
    fetchQuiz(selectedTopic, selectedDifficulty);
  }, [selectedTopic, selectedDifficulty]);

  const handleTopicChange = (newTopic: string) => {
    setSelectedTopic(newTopic);
  };

  const handleDifficultyChange = (newDiff: string) => {
    setSelectedDifficulty(newDiff);
  };

  const handleShuffle = async () => {
    if (shuffling || !quiz) return;
    setShuffling(true);
    const nextSeed = shuffleSeed + 1;
    setShuffleSeed(nextSeed);
    try {
      const data = await quizService.getTodayQuiz({
        topic_key: selectedTopic,
        difficulty: selectedDifficulty,
        shuffle_seed: nextSeed,
      });
      setQuiz(data);
    } catch (e) {
      console.error(e);
    } finally {
      setShuffling(false);
    }
  };

  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [fullscreen]);

  const handleSelect = (question_id: string, selected_index: number) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a.question_id !== question_id);
      return [...filtered, { question_id, selected_index }];
    });
  };

  const handleSubmit = async () => {
    if (!quiz || answers.length !== quiz.questions.length) return;
    setSubmitting(true);
    try {
      const res = await quizService.submitQuiz(answers);
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers([]);
  };

  const getDifficultyBadge = (diff?: string) => {
    const d = (diff || selectedDifficulty).toLowerCase();
    if (d.includes('beg')) {
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
    }
    if (d.includes('hard') || d.includes('adv')) {
      return 'border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400';
    }
    return 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400';
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return <Card className="animate-pulse h-[340px] bg-secondary/30 rounded-3xl" />;

  // ─── Perfect score ────────────────────────────────────────────────────────────
  if (result && result.score === 10) {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
          <Card className="border border-emerald-500/35 bg-emerald-500/5 shadow-xl overflow-hidden relative rounded-3xl">
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/10 rounded-tr-full pointer-events-none" />
            <CardContent className="p-8 sm:p-10 flex flex-col items-center text-center gap-4">
              <motion.div initial={{ rotate: -10, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                <Award className="w-20 h-20 text-emerald-500 drop-shadow-lg" />
              </motion.div>
              <div>
                <h3 className="text-4xl font-black text-emerald-500 mb-1">10 / 10</h3>
                <p className="text-lg font-bold">🎉 Perfect Score!</p>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300 mt-1">
                  Topic: {quiz?.topic_title} • Level: {selectedDifficulty}
                </p>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-xs">
                You mastered this challenge! Try another topic or step up the difficulty.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full px-4 py-2 bg-emerald-500/10">
                <CalendarCheck className="w-4 h-4" />
                Streak maintained & logged live!
              </div>

              {/* Topic / Difficulty switch options */}
              <div className="flex flex-wrap justify-center gap-2 mt-3 pt-3 border-t border-emerald-500/20 w-full max-w-md">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retake Quiz
                </Button>
                {selectedDifficulty !== 'Hard' && (
                  <Button
                    onClick={() => handleDifficultyChange('Hard')}
                    size="sm"
                    className="gap-1.5 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Try Hard Level
                  </Button>
                )}
                {selectedTopic !== 'daily' && (
                  <Button
                    onClick={() => handleTopicChange('daily')}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Today's Daily Topic
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ─── Partial score — Try Again ────────────────────────────────────────────────
  if (result) {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card border border-amber-500/30 bg-amber-500/5 shadow-xl overflow-hidden relative rounded-3xl">
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-bl-full pointer-events-none" />
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center">
                <span className="text-3xl font-black text-amber-500">{result.score} / {result.total}</span>
              </div>
              <div>
                <p className="text-lg font-bold">Quiz Results</p>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {quiz?.topic_title} • {selectedDifficulty}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-2">{result.feedback}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <Button onClick={handleRetry} className="font-bold gap-2" variant="outline">
                  <RefreshCw className="w-4 h-4" />
                  Try Again For 10/10
                </Button>
                {selectedDifficulty !== 'Beginner' && (
                  <Button
                    onClick={() => handleDifficultyChange('Beginner')}
                    variant="ghost"
                    className="font-bold text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                  >
                    Switch to Beginner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ─── Quiz questions card ──────────────────────────────────────────────────────
  const quizCard = (
    <Card className={`glass-card border border-purple-500/25 shadow-xl flex flex-col transition-all duration-300 ${
      fullscreen ? 'w-full h-full max-w-4xl rounded-3xl' : 'h-[570px] rounded-3xl'
    }`}>
      {/* Header */}
      <CardHeader className="py-3 px-5 border-b border-border/60 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent shrink-0 rounded-t-3xl">
        <CardTitle className="text-sm font-black flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span>Quiz Challenge</span>
              {quiz?.topic_title && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 max-w-[200px] truncate">
                  {quiz.topic_title}
                </span>
              )}
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge()}`}>
                {selectedDifficulty}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              disabled={shuffling || changingQuiz || !quiz}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary/80 hover:bg-purple-500/15 text-muted-foreground hover:text-purple-600 border border-border/80 hover:border-purple-500/30 transition-all cursor-pointer"
              title="Shuffle question order"
            >
              <Shuffle className={`w-3.5 h-3.5 ${shuffling ? 'animate-spin text-purple-500' : ''}`} />
              <span className="hidden sm:inline">Shuffle</span>
            </button>
            {quiz && (
              <span className="text-xs font-bold px-2.5 py-1 bg-card text-purple-600 dark:text-purple-400 rounded-full border border-purple-500/20">
                {answers.length} / {quiz.questions.length} answered
              </span>
            )}
            <button
              type="button"
              onClick={() => setFullscreen(f => !f)}
              className="p-1.5 rounded-xl hover:bg-purple-500/10 text-muted-foreground hover:text-purple-600 transition-colors cursor-pointer"
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </CardTitle>

        {/* Interactive Topic & Difficulty Selector Bar */}
        <div className="mt-2.5 pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2.5">
          {/* Topic Select */}
          <div className="flex items-center gap-1.5 min-w-[220px] flex-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="text-[11px] font-bold text-muted-foreground shrink-0">Topic:</span>
            <select
              value={selectedTopic}
              onChange={e => handleTopicChange(e.target.value)}
              disabled={changingQuiz}
              className="w-full text-xs font-semibold py-1 px-2.5 rounded-xl bg-secondary/80 border border-border/80 hover:border-purple-500/40 focus:border-purple-500 focus:outline-none transition-colors cursor-pointer text-foreground"
            >
              {topics.map(t => (
                <option key={t.key} value={t.key}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-muted-foreground">Difficulty:</span>
            <div className="inline-flex rounded-xl p-0.5 bg-secondary/70 border border-border/70">
              {difficulties.map(d => {
                const isActive = selectedDifficulty === d.key;
                let activeStyle = '';
                if (d.key === 'Beginner') {
                  activeStyle = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm font-black';
                } else if (d.key === 'Hard') {
                  activeStyle = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 shadow-sm font-black';
                } else {
                  activeStyle = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm font-black';
                }

                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => handleDifficultyChange(d.key)}
                    disabled={changingQuiz}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer border ${
                      isActive
                        ? activeStyle
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                    title={d.desc}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Questions Content */}
      <CardContent className="flex-1 overflow-y-auto p-0 custom-scroll relative">
        {changingQuiz ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-muted-foreground text-xs">
            <RefreshCw className="w-7 h-7 text-purple-500 animate-spin" />
            <p className="font-semibold">Loading {selectedDifficulty} questions for {topics.find(t => t.key === selectedTopic)?.title || selectedTopic}...</p>
          </div>
        ) : error || !quiz || !quiz.questions.length ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground text-xs sm:text-sm">
            <Target className="w-8 h-8 mb-2 opacity-40 text-purple-500" />
            <p>{error || 'No questions available for this selection.'}</p>
          </div>
        ) : (
          <div className="p-6 space-y-7">
            {quiz.questions.map((q, i) => (
              <div key={q.id} className="space-y-3">
                <h4 className="font-bold text-xs sm:text-sm leading-snug flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{q.question_text}</span>
                </h4>
                <div className="space-y-2 pl-7">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = answers.find(a => a.question_id === q.id)?.selected_index === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelect(q.id, optIdx)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold shadow-sm shadow-purple-500/10'
                            : 'border-border/70 hover:border-purple-400/50 hover:bg-secondary/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Footer Submit */}
      {quiz && quiz.questions.length > 0 && !changingQuiz && (
        <div className="p-4 border-t border-border/60 shrink-0">
          <Button
            className="w-full font-bold shadow-lg shadow-purple-500/25 cursor-pointer"
            disabled={answers.length !== quiz.questions.length || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting Answers...' : `Submit All ${quiz.questions.length} Answers (${answers.length}/${quiz.questions.length})`}
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <>
      {!fullscreen && quizCard}

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            className="widget-fullscreen-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setFullscreen(false); }}
          >
            <motion.div
              className="w-full h-full max-w-4xl"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            >
              {quizCard}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
