import SpeechRecognition from "react-speech-recognition";

export const SpeechRecognize = (
  isListening: boolean,
  resetTranscript: () => void
) => {
  if (isListening) {
    SpeechRecognition.stopListening();
  } else {
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: true,
      language: "en-US",
      interimResults: true,
    });
  }
};
