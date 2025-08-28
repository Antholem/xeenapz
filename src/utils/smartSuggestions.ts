export const shouldGenerateSuggestions = (text: string): boolean => {
  const lower = text.trim().toLowerCase();
  if (!lower) return false;
  if (lower.endsWith("?")) return false;
  return true;
};

export const fetchFollowUpSuggestions = async (
  response: string,
  model: string
): Promise<string[]> => {
  try {
    const prompt =
      `Based on the assistant's response, suggest three brief follow-up questions a user might ask next. ` +
      `Return the suggestions as a JSON array. Response: "${response}"`;

    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, model }),
    });

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const suggestions = JSON.parse(text);
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (e) {
    console.error("Failed to fetch follow-up suggestions:", e);
    return [];
  }
};
