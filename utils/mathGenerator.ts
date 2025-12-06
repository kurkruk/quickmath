import { Operator, Question } from '../types';

export const generateQuestion = (level: number = 1): Question => {
  const operators = [Operator.ADD, Operator.SUB, Operator.MUL];
  // Include division only after a certain level or randomly mix in
  if (level > 2) operators.push(Operator.DIV);

  const operator = operators[Math.floor(Math.random() * operators.length)];
  let num1 = 0;
  let num2 = 0;
  let answer = 0;

  // Single digit constraints (mostly)
  const maxVal = 9; 

  switch (operator) {
    case Operator.ADD:
      num1 = Math.floor(Math.random() * 10); // 0-9
      num2 = Math.floor(Math.random() * 10);
      answer = num1 + num2;
      break;
    case Operator.SUB:
      num1 = Math.floor(Math.random() * 10);
      num2 = Math.floor(Math.random() * (num1 + 1)); // Ensure non-negative
      answer = num1 - num2;
      break;
    case Operator.MUL:
      num1 = Math.floor(Math.random() * 10);
      num2 = Math.floor(Math.random() * 10);
      answer = num1 * num2;
      break;
    case Operator.DIV:
      // Construct a valid division: result * num2 = num1
      const result = Math.floor(Math.random() * 10);
      num2 = Math.floor(Math.random() * 9) + 1; // 1-9 (no div by zero)
      num1 = result * num2;
      answer = result;
      break;
  }

  // Generate Distractors
  const options = new Set<number>();
  options.add(answer);

  while (options.size < 3) {
    const offset = Math.floor(Math.random() * 5) + 1;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const distractor = answer + (offset * direction);
    
    // Keep distractors reasonably positive if answer is positive, 
    // but negative answers are technically possible in math, though less likely in this simple game unless specific.
    // Let's allow negative distractors if the logic flows there, but usually we want plausible positive ones for kids.
    if (distractor >= 0 || answer < 0) {
        options.add(distractor);
    } else {
        options.add(distractor + 10); // Wrap around to positive
    }
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    num1,
    num2,
    operator,
    answer,
    options: Array.from(options).sort(() => Math.random() - 0.5), // Shuffle
  };
};
