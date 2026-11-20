import { speechClip } from "./api";

// The sound of the read-aloud player. It says one sentence, with the Google voice or with the voice
// of the browser. It does not know the page, and it does not decide which sentence comes next.

// oxlint-disable-next-line no-magic-numbers -- A named list of the speeds that the person can select.
export const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
const RATE_KEY = "charrette-read-rate";

// A natural English voice of the browser. macOS has Premium and Enhanced voices.
function browserVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith("en"));
  return (
    voices.find((voice) => voice.lang === "en-US" && /premium|enhanced/i.test(voice.name)) ??
    voices.find((voice) => voice.lang === "en-US" && voice.localService) ??
    voices[0]
  );
}

// The reading speed that the person selected the last time.
export function readRate(): number {
  try {
    const saved = Number(localStorage.getItem(RATE_KEY));
    return RATES.includes(saved) ? saved : 1;
  } catch {
    return 1;
  }
}

export function saveRate(value: number): void {
  try {
    localStorage.setItem(RATE_KEY, String(value));
  } catch {
    // The speed is not saved for the next visit. It still applies now.
  }
}

export const browserCanSpeak = () => "speechSynthesis" in window;

export function createSpeaker() {
  let audio: HTMLAudioElement | null = null;
  // The sentence that the audio element holds now.
  let loaded = -1;
  // The audio of each sentence, as a blob URL, by the sentence text.
  const clips = new Map<string, Promise<string>>();
  let rate = 1;

  // Get the audio of a text from the Google voice. A second request for a text uses the first.
  function clip(text: string): Promise<string> {
    let request = clips.get(text);
    if (!request) {
      request = speechClip(text).then(
        (audio) => URL.createObjectURL(audio),
        (error: unknown) => {
          throw new Error((error as Error).message || "The Google voice did not load.");
        },
      );
      // A failed request can run again later.
      request.catch(() => clips.delete(text));
      clips.set(text, request);
    }
    return request;
  }

  return {
    clip,

    // Load the audio of the next sentences, so there is no pause between them.
    prefetch(texts: string[]): void {
      for (const text of texts) clip(text).catch(() => undefined);
    },

    // Play the audio of a sentence. The index names the sentence, for canContinue.
    async playClip(url: string, index: number, onEnd: () => void): Promise<void> {
      const player = (audio ??= new Audio());
      player.src = url;
      loaded = index;
      player.defaultPlaybackRate = rate;
      player.playbackRate = rate;
      player.onended = onEnd;
      await player.play();
    },

    // The audio of this sentence stopped in the middle, so it can continue from there.
    canContinue(index: number): boolean {
      return Boolean(audio && loaded === index && audio.currentTime > 0 && !audio.ended);
    },

    // Continue the audio that stopped in the middle. Call it only after canContinue.
    continueClip(onEnd: () => void): Promise<void> {
      if (!audio) return Promise.reject(new Error("There is no audio to continue."));
      audio.onended = onEnd;
      return audio.play();
    },

    // Say a text with the voice of the browser.
    speak(text: string, onEnd: () => void, onError: (error: string) => void): void {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.voice = browserVoice() ?? null;
      utterance.rate = rate;
      utterance.onend = onEnd;
      utterance.onerror = (event) => onError(event.error);
      speechSynthesis.speak(utterance);
    },

    // Use this speed from now. Audio that plays changes at once.
    setRate(value: number): void {
      rate = value;
      if (audio) audio.playbackRate = value;
    },

    silence(): void {
      audio?.pause();
      if (browserCanSpeak()) speechSynthesis.cancel();
    },

    // Release the audio when the player closes.
    release(): void {
      for (const request of clips.values()) {
        request.then(URL.revokeObjectURL, () => undefined);
      }
      clips.clear();
    },
  };
}
