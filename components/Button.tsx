import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'game-option';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md";
  
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white border-b-4 border-blue-700 active:border-b-0 active:translate-y-1",
    secondary: "bg-purple-500 hover:bg-purple-600 text-white border-b-4 border-purple-700 active:border-b-0 active:translate-y-1",
    danger: "bg-red-500 hover:bg-red-600 text-white border-b-4 border-red-700 active:border-b-0 active:translate-y-1",
    outline: "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200",
    'game-option': "bg-white hover:bg-blue-50 text-slate-800 text-2xl py-6 border-b-4 border-gray-300 active:border-b-0 active:translate-y-1 active:bg-blue-100",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${variant !== 'game-option' ? 'py-3 px-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
