/**
 * Generate follow-up ideas for a conversation.
 * Returns null if the user's message doesn't appear to ask a question
 * or if the model decides no suggestion is needed.
 */
export const generateSmartSuggestions = async (
  userText: string | null,
  botText: string,
  model: string
): Promise<string | null> => {
  if (!userText) return null;

  const trimmed = userText.trim();
  const questionLikePattern = /\?|\b(who|what|where|when|why|how|which|can|could|would|should|do|does|did|is|are|may|will|shall|have|has|had)\b/i;

  if (!questionLikePattern.test(trimmed)) {
    return null;
  }

  try {
    const prompt = `You are a professional conversational assistant. If the user's message is a greeting, small talk, or does not require further discussion, respond with an empty string. Otherwise, suggest helpful follow-up questions or next steps based on the conversation. Use a single sentence or a short list (bullets or numbers) as appropriate.\n\nUser: ${trimmed}\nAssistant: ${botText}`;

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
