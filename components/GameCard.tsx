import React from 'react';
import { Question } from '../types';

interface GameCardProps {
  question: Question | null;
  className?: string;
  isUpsideDown?: boolean; // For local split screen
}

export const GameCard: React.FC<GameCardProps> = ({ question, className = '', isUpsideDown = false }) => {
  if (!question) return null;

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center border-2 border-slate-100 ${className} ${isUpsideDown ? 'rotate-180' : ''}`}>
      <div className="text-6xl font-black text-slate-700 flex items-center gap-4">
        <span>{question.num1}</span>
        <span className="text-blue-500">{question.operator}</span>
        <span>{question.num2}</span>
        <span className="text-gray-400">=</span>
        <span className="text-blue-600">?</span>
      </div>
    </div>
  );
};
