export const speakText = (
  text: string,
  id: string,
  playingMessageId: string | null,
  setPlayingMessageId: (msg: string | null) => void
) => {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();

    if (playingMessageId === id) {
      setPlayingMessageId(null);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setPlayingMessageId(null);
      speechSynthesis.speak(utterance);
      setPlayingMessageId(id);
    }
  } else {
    console.error("Text-to-Speech is not supported in this browser.");
  }
};
