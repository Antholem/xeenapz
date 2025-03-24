export const speakText = (
  text: string,
  playingMessage: string | null,
  setPlayingMessage: (msg: string | null) => void
) => {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();

    if (playingMessage === text) {
      setPlayingMessage(null);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setPlayingMessage(null);
      speechSynthesis.speak(utterance);
      setPlayingMessage(text);
    }
  } else {
    console.error("Text-to-Speech is not supported in this browser.");
  }
};
