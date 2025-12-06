import React, { useState, useEffect, useRef } from 'react';
import { GameMode, PlayerState, Question } from './types';
import { generateQuestion } from './utils/mathGenerator';
import { Button } from './components/Button';
import { GameCard } from './components/GameCard';
import { GameOver } from './components/GameOver';
import { Play, Users, Globe, ArrowLeft, Zap, Trophy, Timer, LogOut, X } from 'lucide-react';

const INITIAL_PLAYER_STATE: PlayerState = {
  score: 0,
  streak: 0,
  health: 3,
  currentQuestion: null,
  questionIndex: 0,
  isCorrect: null,
  name: 'Player 1',
  wrongAnswers: [],
};

const WIN_SCORE_ONLINE = 15; // Score to win in Online VS mode
const LOCAL_GAME_DURATION = 60; // Seconds for Local VS and Training

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  
  // Player 1 State (Main player in Single/Online, Bottom player in Local)
  const [p1, setP1] = useState<PlayerState>({ ...INITIAL_PLAYER_STATE });
  
  // Player 2 State (Bot in Online, Top player in Local)
  const [p2, setP2] = useState<PlayerState>({ ...INITIAL_PLAYER_STATE, name: 'Player 2' });

  // Game Meta State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<string | undefined>(undefined);
  const [timeLeft, setTimeLeft] = useState(LOCAL_GAME_DURATION);
  
  // Online Matchmaking Simulation
  const [isMatching, setIsMatching] = useState(false);

  // --- Game Loop Helpers ---

  const startGame = (selectedMode: GameMode) => {
    setIsGameOver(false);
    setWinner(undefined);
    setGameStartTime(Date.now());
    setTimeLeft(LOCAL_GAME_DURATION);
    
    // Generate a shared pool of questions for this session
    // Increased to 500 to prevent running out even at super human speeds
    // Ramp up difficulty every 10 questions to keep "speed math" feel longer
    const newQuestions = Array.from({ length: 500 }, (_, i) => 
      generateQuestion(1 + Math.floor(i / 10))
    );
    setQuestions(newQuestions);

    // Reset players
    const p1Name = selectedMode === GameMode.LOCAL_VS ? 'P1 (蓝)' : '我';
    const p2Name = selectedMode === GameMode.LOCAL_VS ? 'P2 (紫)' : (selectedMode === GameMode.ONLINE_VS ? '在线对手' : 'Player 2');

    setP1({ 
      ...INITIAL_PLAYER_STATE, 
      currentQuestion: newQuestions[0], 
      questionIndex: 0, 
      name: p1Name,
      wrongAnswers: [] 
    });
    
    setP2({ 
      ...INITIAL_PLAYER_STATE, 
      currentQuestion: newQuestions[0], 
      questionIndex: 0, 
      name: p2Name,
      wrongAnswers: []
    });
    
    setMode(selectedMode);
  };

  const handleAnswer = (playerIndex: 1 | 2, selectedAnswer: number) => {
    if (isGameOver) return;

    const currentPlayer = playerIndex === 1 ? p1 : p2;
    const currentQ = currentPlayer.currentQuestion;

    if (!currentQ) return;

    const correct = currentQ.answer === selectedAnswer;

    // Update State Function
    const updatePlayer = (prev: PlayerState): PlayerState => {
      let newScore = prev.score;
      let newHealth = prev.health;
      let newStreak = prev.streak;
      const newWrongAnswers = [...prev.wrongAnswers];
      
      if (correct) {
        newScore += 1;
        newStreak += 1;
      } else {
        newStreak = 0;
        // In Single Player / Training, record the mistake
        if (mode === GameMode.SINGLE_PLAYER) {
           newWrongAnswers.push({
               question: currentQ,
               selected: selectedAnswer
           });
        }
        // No health deduction anymore for single player training
      }

      return {
        ...prev,
        score: newScore,
        streak: newStreak,
        health: newHealth,
        isCorrect: correct,
        wrongAnswers: newWrongAnswers,
      };
    };

    // Apply score update
    if (playerIndex === 1) {
      setP1(prev => updatePlayer(prev));
    } else {
      setP2(prev => updatePlayer(prev));
    }

    // Prepare next question
    // Delay slightly for visual feedback
    setTimeout(() => {
      const nextIndex = currentPlayer.questionIndex + 1;
      // Fallback logic kept just in case, but 500 questions should suffice
      const nextQ = questions[nextIndex] || generateQuestion(5);

      const updateNextQ = (prev: PlayerState) => {
        // Mode logic: VS or Training (Single Player) ends on time, not health.
        return { 
            ...prev, 
            currentQuestion: nextQ, 
            questionIndex: nextIndex,
            isCorrect: null 
        };
      };

      if (playerIndex === 1) {
        setP1(prev => updateNextQ(prev));
      } else {
        setP2(prev => updateNextQ(prev));
      }
    }, 200); 
  };

  const handleQuit = () => {
      setMode(GameMode.MENU);
      setIsGameOver(false);
  };

  // --- Effects ---

  // Timer for Local VS and Single Player Training
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if ((mode === GameMode.LOCAL_VS || mode === GameMode.SINGLE_PLAYER) && !isGameOver && timeLeft > 0) {
        timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsGameOver(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    } else if ((mode === GameMode.LOCAL_VS || mode === GameMode.SINGLE_PLAYER) && timeLeft === 0 && !isGameOver) {
        setIsGameOver(true);
    }
    return () => clearInterval(timer);
  }, [mode, timeLeft, isGameOver]);

  // Check Win Conditions
  useEffect(() => {
    if (isGameOver && !winner) {
        if (mode === GameMode.LOCAL_VS) {
            // Determine winner for VS
            if (p1.score > p2.score) setWinner(p1.name);
            else if (p2.score > p1.score) setWinner(p2.name);
            else setWinner("平局");
        }
        // Single Player doesn't need a "winner" set, Game Over screen handles it via stats
        return;
    }

    if (mode === GameMode.ONLINE_VS) {
      if (p1.score >= WIN_SCORE_ONLINE) {
        setWinner(p1.name);
        setIsGameOver(true);
      } else if (p2.score >= WIN_SCORE_ONLINE) {
        setWinner(p2.name);
        setIsGameOver(true);
      }
    }
  }, [p1.score, p2.score, mode, isGameOver, winner, p1.name, p2.name]);

  // Online Bot Logic
  useEffect(() => {
    let botInterval: ReturnType<typeof setTimeout>;

    if (mode === GameMode.ONLINE_VS && !isGameOver && !isMatching) {
      // Bot answers periodically
      const botThinkTime = Math.random() * 2000 + 1000; // 1s to 3s
      
      botInterval = setTimeout(() => {
        if (p2.currentQuestion) {
           // 85% chance to be correct
           const isCorrect = Math.random() > 0.15;
           const answer = isCorrect 
             ? p2.currentQuestion.answer 
             : p2.currentQuestion.options.find(o => o !== p2.currentQuestion!.answer) || 0;
           
           handleAnswer(2, answer);
        }
      }, botThinkTime);
    }

    return () => clearTimeout(botInterval);
  }, [mode, isGameOver, p2.currentQuestion, isMatching]);

  // --- UI Renderers ---

  const renderMainMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 max-w-md mx-auto w-full">
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-black text-blue-500 mb-2 tracking-tight">Math Dash</h1>
        <p className="text-slate-500 text-lg">极速算术大挑战</p>
      </div>

      <div className="w-full space-y-4">
        <Button fullWidth onClick={() => startGame(GameMode.SINGLE_PLAYER)} className="flex items-center justify-center gap-3 text-lg h-16 bg-gradient-to-r from-blue-400 to-blue-600 border-blue-800">
          <Play fill="currentColor" /> 一分钟训练
        </Button>
        <Button fullWidth variant="secondary" onClick={() => startGame(GameMode.LOCAL_VS)} className="flex items-center justify-center gap-3 text-lg h-16 bg-gradient-to-r from-purple-400 to-purple-600 border-purple-800">
          <Users /> 本机双人对战
        </Button>
        <Button fullWidth variant="danger" onClick={() => {
          setIsMatching(true);
          setMode(GameMode.ONLINE_VS);
          setTimeout(() => {
            setIsMatching(false);
            startGame(GameMode.ONLINE_VS);
          }, 2000);
        }} className="flex items-center justify-center gap-3 text-lg h-16 bg-gradient-to-r from-orange-400 to-red-500 border-red-800">
          <Globe /> 在线匹配对战
        </Button>
      </div>
    </div>
  );

  const renderSinglePlayer = () => (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
        <button onClick={handleQuit} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft />
        </button>
        <div className="flex gap-4 font-bold text-slate-700">
             <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full text-yellow-700">
                <Timer className="w-4 h-4" /> {timeLeft}s
            </div>
            <div className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full text-blue-700">
                <Zap className="fill-blue-700 w-4 h-4"/> {p1.score}
            </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <div className="w-full relative">
            {/* Progress Bar for time (Optional, but looks nice) */}
            <div className="absolute -top-4 left-0 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-500 transition-all duration-1000 linear"
                    style={{ width: `${(timeLeft / LOCAL_GAME_DURATION) * 100}%` }}
                />
            </div>
           <GameCard question={p1.currentQuestion} />
        </div>
        
        {/* Options - Horizontal Blocks */}
        <div className="grid grid-cols-3 w-full gap-4">
            {p1.currentQuestion?.options.map((opt, idx) => (
                <Button 
                    key={idx} 
                    variant="game-option" 
                    onClick={() => handleAnswer(1, opt)}
                    className={`${p1.isCorrect === false ? 'animate-shake' : ''} text-4xl py-10`}
                >
                    {opt}
                </Button>
            ))}
        </div>
      </div>
    </div>
  );

  const renderSplitScreen = () => (
    <div className="flex flex-col h-screen overflow-hidden fixed inset-0 bg-slate-200">
        {/* Top Player (Player 2 - Upside Down) */}
        <div className="flex-1 bg-purple-50 relative flex flex-col rotate-180 border-b-4 border-slate-300">
             <div className="absolute top-4 left-4 font-bold text-purple-600 flex items-center gap-2 rotate-180">
                 {p2.score} <Trophy className="w-4 h-4"/>
             </div>
             <div className="flex-1 flex flex-col justify-center p-6 gap-4">
                 <div className="grid grid-cols-3 gap-2">
                    {p2.currentQuestion?.options.map((opt, idx) => (
                        <Button key={idx} variant="game-option" className="py-8 text-xl" onClick={() => handleAnswer(2, opt)}>{opt}</Button>
                    ))}
                 </div>
                 <GameCard question={p2.currentQuestion} isUpsideDown={false} className="border-purple-200" />
             </div>
        </div>

        {/* Control Bar (Center) */}
        <div className="h-14 bg-slate-800 w-full z-20 flex items-center justify-between px-6 shadow-xl text-white relative">
            {/* Progress Bar Background */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-700">
                <div 
                    className="h-full bg-yellow-400 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                    style={{ width: `${(timeLeft / LOCAL_GAME_DURATION) * 100}%` }}
                />
            </div>

            <button 
                onClick={handleQuit}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 hover:text-white transition-colors relative z-10"
            >
                <LogOut size={20} />
            </button>
            
            <div className="flex items-center gap-2 font-mono text-2xl font-bold text-yellow-400 relative z-10">
                <Timer className="w-6 h-6" />
                {timeLeft}s
            </div>

            <div className="w-10"></div> {/* Spacer for symmetry */}
        </div>

        {/* Bottom Player (Player 1) */}
        <div className="flex-1 bg-blue-50 relative flex flex-col border-t-4 border-slate-300">
            <div className="absolute top-4 right-4 font-bold text-blue-600 flex items-center gap-2">
                <Trophy className="w-4 h-4"/> {p1.score}
            </div>
            <div className="flex-1 flex flex-col justify-center p-6 gap-4">
                 <GameCard question={p1.currentQuestion} className="border-blue-200"/>
                 <div className="grid grid-cols-3 gap-2">
                    {p1.currentQuestion?.options.map((opt, idx) => (
                        <Button key={idx} variant="game-option" className="py-8 text-xl" onClick={() => handleAnswer(1, opt)}>{opt}</Button>
                    ))}
                 </div>
            </div>
        </div>
    </div>
  );

  const renderOnlineVs = () => {
    if (isMatching) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-slate-900 text-white gap-6">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                <h2 className="text-2xl font-bold">正在寻找对手...</h2>
                <Button variant="outline" onClick={() => setIsMatching(false)} className="bg-transparent text-white border-slate-600 mt-8">取消</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50">
             {/* Opponent Status Bar */}
             <div className="bg-slate-800 text-white p-4 flex justify-between items-center relative">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold">BOT</div>
                    <span>{p2.name}</span>
                </div>
                
                {/* Exit Button */}
                <div className="flex items-center gap-4">
                     <div className="font-mono text-xl text-yellow-400">{p2.score} / {WIN_SCORE_ONLINE}</div>
                     <button onClick={handleQuit} className="bg-slate-700 p-1.5 rounded-full hover:bg-slate-600">
                        <X size={16} />
                     </button>
                </div>
             </div>
            
             <div className="flex-1 flex flex-col p-4 relative">
                 {/* Progress Bars */}
                 <div className="flex gap-2 h-2 mb-6">
                    <div className="bg-blue-200 flex-1 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(p1.score/WIN_SCORE_ONLINE)*100}%` }}></div>
                    </div>
                    <div className="bg-purple-200 flex-1 rounded-full overflow-hidden">
                         <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${(p2.score/WIN_SCORE_ONLINE)*100}%` }}></div>
                    </div>
                 </div>

                 {/* My Game Area */}
                 <div className="flex-1 flex flex-col justify-center gap-6">
                    <GameCard question={p1.currentQuestion} />
                    {/* Options - Horizontal Blocks */}
                    <div className="grid grid-cols-3 gap-3">
                        {p1.currentQuestion?.options.map((opt, idx) => (
                            <Button 
                              key={idx} 
                              variant="game-option" 
                              onClick={() => handleAnswer(1, opt)}
                              className="text-3xl py-8"
                            >
                              {opt}
                            </Button>
                        ))}
                    </div>
                 </div>
             </div>

             {/* My Status Bar */}
             <div className="bg-white p-4 shadow-up border-t border-slate-200 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">ME</div>
                    <span className="font-bold text-slate-800">{p1.name}</span>
                 </div>
                 <div className="font-mono text-xl text-blue-600 font-bold">{p1.score} / {WIN_SCORE_ONLINE}</div>
             </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {mode === GameMode.MENU && renderMainMenu()}
      {mode === GameMode.SINGLE_PLAYER && renderSinglePlayer()}
      {mode === GameMode.LOCAL_VS && renderSplitScreen()}
      {mode === GameMode.ONLINE_VS && renderOnlineVs()}

      {isGameOver && (
        <GameOver 
            stats={{
                totalQuestions: p1.score + p1.wrongAnswers.length, 
                correctAnswers: p1.score,
                averageTimeSeconds: (Date.now() - gameStartTime) / 1000 / (p1.score + 1 || 1),
                mode: mode
            }}
            winnerName={winner}
            wrongAnswers={p1.wrongAnswers}
            onRestart={() => startGame(mode)}
            onHome={() => setMode(GameMode.MENU)}
        />
      )}
    </div>
  );
};

export default App;