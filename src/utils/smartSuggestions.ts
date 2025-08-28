export const generateSmartSuggestions = async (
  userText: string | null,
  botText: string,
  model: string
): Promise<string | null> => {
  if (!userText) return null;
  try {
    const prompt = `Based on the user's question: "${userText}" and your answer: "${botText}", provide two short follow-up questions or suggestions for the user.`;
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, model }),
    });
    const data = await res.json();
    const suggestions = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return suggestions || null;
  } catch (error) {
    console.error("Failed to generate suggestions:", error);
    return null;
  }
};
