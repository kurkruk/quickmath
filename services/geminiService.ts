import { GoogleGenAI } from "@google/genai";
import { GameSessionStats } from "../types";

// Helper to safely get the API key
const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

export const getMathCoachFeedback = async (stats: GameSessionStats): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "API Key missing. Cannot fetch coaching advice.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    你是一位充满激情和幽默感的少儿数学教练。
    根据以下游戏数据给小朋友写一段简短的评价（50字以内）：
    模式: ${stats.mode}
    总题数: ${stats.totalQuestions}
    正确率: ${Math.round((stats.correctAnswers / stats.totalQuestions) * 100)}%
    平均答题时间: ${stats.averageTimeSeconds.toFixed(1)}秒.
    
    如果是做得好，给予夸奖。如果做得一般，给予鼓励。使用emoji。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "继续加油！数学很有趣！";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "网络开小差了，但你表现很棒！🤖";
  }
};
