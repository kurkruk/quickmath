import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { GameSessionStats, Question } from '../types';
import { getMathCoachFeedback } from '../services/geminiService';
import { Trophy, RefreshCcw, Home, Sparkles, XCircle, CheckCircle } from 'lucide-react';

interface GameOverProps {
  stats: GameSessionStats;
  winnerName?: string; // For VS modes
  wrongAnswers?: { question: Question; selected: number }[];
  onRestart: () => void;
  onHome: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ stats, winnerName, wrongAnswers = [], onRestart, onHome }) => {
  const [coachFeedback, setCoachFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Auto-fetch feedback if it's single player or requested
    // For now, let's require a click to save tokens, or auto fetch for fun
  }, []);

  const handleGetFeedback = async () => {
    setLoading(true);
    const feedback = await getMathCoachFeedback(stats);
    setCoachFeedback(feedback);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-pop text-center max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0">
            <div className="flex justify-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {winnerName ? `${winnerName} 获胜!` : '训练结束!'}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 my-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-500">总答题</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.totalQuestions}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-500">正确率</p>
                    <p className="text-2xl font-bold text-green-600">
                        {stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0}%
                    </p>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 mb-6 pr-2">
            {wrongAnswers.length > 0 && (
                <div className="text-left">
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-500" /> 错题回顾 ({wrongAnswers.length})
                    </h3>
                    <div className="space-y-3">
                        {wrongAnswers.map((item, idx) => (
                            <div key={idx} className="bg-red-50 p-3 rounded-lg border border-red-100 text-sm">
                                <div className="font-mono font-bold text-lg text-slate-700 mb-1">
                                    {item.question.num1} {item.question.operator} {item.question.num2} = ?
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-red-600 flex items-center gap-1">
                                        <XCircle className="w-3 h-3"/> 你的答案: {item.selected}
                                    </span>
                                    <span className="text-green-600 font-bold flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3"/> 正确答案: {item.question.answer}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {!coachFeedback && wrongAnswers.length === 0 && stats.totalQuestions > 0 && (
                 <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-green-800 font-bold">
                    🎉 全对！太棒了！
                 </div>
            )}

            {coachFeedback && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-4 text-left">
                    <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-sm">
                        <Sparkles className="w-4 h-4" /> AI 教练评价
                    </div>
                    <p className="text-slate-700 text-sm">{coachFeedback}</p>
                </div>
            )}
            
            {!coachFeedback && (
                 <Button 
                    variant="secondary" 
                    onClick={handleGetFeedback} 
                    disabled={loading}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm"
                >
                    {loading ? 'AI 正在思考...' : <><Sparkles className="w-4 h-4" /> 获取 AI 评价</>}
                </Button>
            )}
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <Button variant="outline" fullWidth onClick={onHome} className="flex items-center justify-center gap-2">
            <Home className="w-4 h-4"/> 主页
          </Button>
          <Button fullWidth onClick={onRestart} className="flex items-center justify-center gap-2">
            <RefreshCcw className="w-4 h-4"/> 再玩一次
          </Button>
        </div>
      </div>
    </div>
  );
};