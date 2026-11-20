import { MINUTE_MS } from "@/lib/time";

// The longest time that the app waits for one answer of a model.
const MODEL_TIMEOUT_MINUTES = 5;
export const MODEL_TIMEOUT_MS = MODEL_TIMEOUT_MINUTES * MINUTE_MS;
