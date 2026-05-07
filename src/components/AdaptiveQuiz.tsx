import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { QuestionBankItem } from '../lib/types';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Brain, TrendingUp, Sparkles } from 'lucide-react';

interface Props {
  moduleId: string;
  subjectId: string;
  onBack: () => void;
  onComplete: (score: number) => void;
}

type QuizPhase = 'loading' | 'pre-assess' | 'quiz' | 'results';

export default function AdaptiveQuiz({ moduleId, subjectId, onBack, onComplete }: Props) {
  const { profile } = useAuth();
  const [phase, setPhase] = useState<QuizPhase>('loading');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [preScore, setPreScore] = useState(0);
  const [nextDifficulty, setNextDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizRecordId, setQuizRecordId] = useState<string | null>(null);
  const [skillAreas, setSkillAreas] = useState<string[]>([]);

  // Determine starting difficulty based on user level
  useEffect(() => {
    if (!profile) return;
    const levelMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      beginner: 'easy',
      intermediate: 'medium',
      advanced: 'hard',
    };
    setDifficulty(levelMap[profile.knowledge_level] ?? 'medium');
  }, [profile]);

  // Load questions for the quiz
  const loadQuestions = useCallback(async (diff: 'easy' | 'medium' | 'hard') => {
    if (!profile) return;

    // Fetch questions from the question bank for this subject and difficulty
    const { data: questionsData } = await supabase
      .from('question_bank')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('difficulty', diff)
      .limit(10);

    if (!questionsData || questionsData.length === 0) {
      // Fallback: try adjacent difficulty
      const fallback = diff === 'hard' ? 'medium' : diff === 'easy' ? 'medium' : 'easy';
      const { data: fallbackData } = await supabase
        .from('question_bank')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('difficulty', fallback)
        .limit(10);

      if (fallbackData && fallbackData.length > 0) {
        setQuestions(fallbackData as QuestionBankItem[]);
        setSkillAreas([...new Set(fallbackData.map(q => q.skill_area))]);
        setAnswers(new Array(fallbackData.length).fill(null));
        return;
      }
      return;
    }

    setQuestions(questionsData as QuestionBankItem[]);
    setSkillAreas([...new Set(questionsData.map(q => q.skill_area))]);
    setAnswers(new Array(questionsData.length).fill(null));
  }, [profile, subjectId]);

  // Pre-assessment: quick 3-question gauge
  const startPreAssess = useCallback(async () => {
    if (!profile) return;
    await loadQuestions(difficulty);
    setPhase('pre-assess');
  }, [profile, difficulty, loadQuestions]);

  useEffect(() => {
    if (phase === 'loading' && profile) {
      startPreAssess();
    }
  }, [phase, profile, startPreAssess]);

  const handlePreAssessAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);

    if (questions[currentIndex]?.correct_index === answerIndex) {
      setPreScore(prev => prev + 1);
    }

    if (currentIndex < Math.min(2, questions.length - 1)) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Pre-assessment done, adjust difficulty
      const preCorrect = (questions[currentIndex]?.correct_index === answerIndex ? 1 : 0) + preScore;
      let adjustedDifficulty: 'easy' | 'medium' | 'hard' = difficulty;
      if (preCorrect >= 2 && difficulty !== 'hard') {
        adjustedDifficulty = difficulty === 'easy' ? 'medium' : 'hard';
      } else if (preCorrect === 0 && difficulty !== 'easy') {
        adjustedDifficulty = difficulty === 'hard' ? 'medium' : 'easy';
      }
      setDifficulty(adjustedDifficulty);
      setCurrentIndex(0);
      setAnswers(new Array(questions.length).fill(null));
      setPreScore(0);
      loadQuestions(adjustedDifficulty).then(async () => {
        // Create adaptive quiz record
        if (profile) {
          const { data } = await supabase
            .from('adaptive_quizzes')
            .insert({
              user_id: profile.id,
              module_id: moduleId,
              difficulty_level: adjustedDifficulty,
              total_questions: questions.length || 5,
            })
            .select()
            .maybeSingle();
          if (data) setQuizRecordId(data.id);
        }
        setPhase('quiz');
      });
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    const isCorrect = questions[currentIndex]?.correct_index === answers[currentIndex];
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    // Update question bank stats
    supabase
      .from('question_bank')
      .update({
        times_used: questions[currentIndex].times_used + 1,
        times_correct: questions[currentIndex].times_correct + (isCorrect ? 1 : 0),
      })
      .eq('id', questions[currentIndex].id)
      .then(() => {});

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const finalCorrect = correctCount + (questions[currentIndex]?.correct_index === answers[currentIndex] ? 1 : 0);
    const finalScore = Math.round((finalCorrect / questions.length) * 100);
    setScore(finalScore);

    // Determine next difficulty
    let next: 'easy' | 'medium' | 'hard' = difficulty;
    if (finalScore >= 80 && difficulty !== 'hard') {
      next = difficulty === 'easy' ? 'medium' : 'hard';
    } else if (finalScore < 50 && difficulty !== 'easy') {
      next = difficulty === 'hard' ? 'medium' : 'easy';
    }
    setNextDifficulty(next);

    // Update adaptive quiz record
    if (quizRecordId) {
      await supabase
        .from('adaptive_quizzes')
        .update({
          correct_answers: finalCorrect,
          score: finalScore,
          completed: true,
          completed_at: new Date().toISOString(),
          next_difficulty: next,
        })
        .eq('id', quizRecordId);
    }

    // Record learning outcomes for each skill area
    if (profile) {
      for (const skill of skillAreas) {
        const skillQuestions = questions.filter(q => q.skill_area === skill);
        const skillCorrect = skillQuestions.filter((q) => {
          const globalIndex = questions.indexOf(q);
          return answers[globalIndex] === q.correct_index;
        }).length;
        const skillScore = Math.round((skillCorrect / skillQuestions.length) * 100);

        await supabase.from('learning_outcomes').insert({
          user_id: profile.id,
          module_id: moduleId,
          skill_name: skill,
          pre_score: preScore > 0 ? Math.round((preScore / 3) * 100) : 50,
          post_score: skillScore,
          improvement_rate: skillScore - (preScore > 0 ? Math.round((preScore / 3) * 100) : 50),
        });
      }
    }

    setPhase('results');
    onComplete(finalScore);
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === 'results') {
    const passed = score >= 70;
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            passed ? 'bg-emerald-500/20' : 'bg-amber-500/20'
          }`}>
            {passed ? (
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            ) : (
              <XCircle className="w-8 h-8 text-amber-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {passed ? 'Great Work!' : 'Keep Practicing!'}
          </h2>
          <p className="text-slate-400 mb-6">
            {passed
              ? 'You demonstrated strong understanding of this material.'
              : 'Review the material and try again. You\'ll get there!'}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-700/50 rounded-xl p-3">
              <div className="text-2xl font-bold text-white">{score}%</div>
              <div className="text-xs text-slate-400">Score</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3">
              <div className="text-2xl font-bold text-white">{correctCount}/{questions.length}</div>
              <div className="text-xs text-slate-400">Correct</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3">
              <div className={`text-2xl font-bold capitalize ${
                nextDifficulty === 'hard' ? 'text-red-400' : nextDifficulty === 'easy' ? 'text-emerald-400' : 'text-amber-400'
              }`}>{nextDifficulty}</div>
              <div className="text-xs text-slate-400">Next Level</div>
            </div>
          </div>

          {nextDifficulty !== difficulty && (
            <div className="flex items-center gap-2 bg-slate-700/30 border border-slate-600/50 rounded-xl p-3 mb-6">
              <TrendingUp className={`w-4 h-4 ${
                nextDifficulty === 'hard' ? 'text-red-400' : 'text-emerald-400'
              }`} />
              <span className="text-sm text-slate-300">
                {nextDifficulty === 'hard'
                  ? 'Your performance suggests moving to harder questions next time.'
                  : nextDifficulty === 'easy'
                  ? 'We will adjust to easier questions to build your foundation.'
                  : 'We will adjust to medium difficulty for balanced practice.'}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Skill Breakdown</h3>
            {skillAreas.map(skill => {
              const skillQs = questions.filter(q => q.skill_area === skill);
              const skillCorrect = skillQs.filter(q => {
                const idx = questions.indexOf(q);
                return answers[idx] === q.correct_index;
              }).length;
              const pct = Math.round((skillCorrect / skillQs.length) * 100);
              return (
                <div key={skill} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-24 capitalize">{skill}</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-300 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={onBack}
            className="mt-6 w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all"
          >
            Continue Learning
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">No questions available for this topic yet.</p>
      </div>
    );
  }

  const isPreAssess = phase === 'pre-assess';
  const selectedAnswer = answers[currentIndex];
  const isCorrect = selectedAnswer === currentQ.correct_index;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">
              {isPreAssess ? 'Pre-Assessment' : 'Adaptive Quiz'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
              difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {difficulty}
            </span>
          </div>
          <span className="text-sm text-slate-400">
            {currentIndex + 1}/{isPreAssess ? Math.min(3, questions.length) : questions.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / (isPreAssess ? Math.min(3, questions.length) : questions.length)) * 100}%`
          }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="mb-2">
            <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">
              {currentQ.skill_area}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-6">
            {currentQ.question_text}
          </h2>

          <div className="space-y-3">
            {(currentQ.options as unknown as string[]).map((option, i) => {
              let optionStyle = 'bg-slate-800/80 border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-700/50';

              if (selectedAnswer !== null) {
                if (i === currentQ.correct_index) {
                  optionStyle = 'bg-emerald-500/10 border-emerald-500/50';
                } else if (i === selectedAnswer && !isCorrect) {
                  optionStyle = 'bg-red-500/10 border-red-500/50';
                } else {
                  optionStyle = 'bg-slate-800/40 border-slate-700/30 opacity-50';
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (selectedAnswer === null) {
                      isPreAssess ? handlePreAssessAnswer(i) : handleQuizAnswer(i);
                    }
                  }}
                  disabled={selectedAnswer !== null}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center gap-3 ${optionStyle}`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                    selectedAnswer !== null && i === currentQ.correct_index
                      ? 'bg-emerald-500 text-white'
                      : selectedAnswer === i && !isCorrect
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {selectedAnswer !== null && i === currentQ.correct_index ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : selectedAnswer === i && !isCorrect ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="text-slate-200">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && selectedAnswer !== null && (
            <div className={`mt-6 p-4 rounded-xl border ${
              isCorrect
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-amber-500/5 border-amber-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={`w-4 h-4 ${isCorrect ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className={`text-sm font-medium ${isCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite right'}
                </span>
              </div>
              <p className="text-sm text-slate-300">{currentQ.explanation}</p>
            </div>
          )}

          {/* Next button */}
          {showExplanation && (
            <button
              onClick={handleNext}
              className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
            >
              {currentIndex < questions.length - 1 ? (
                <>Next Question <ChevronRight className="w-4 h-4" /></>
              ) : (
                'See Results'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
