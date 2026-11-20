// Each score of a review and of a drill check is a whole number on this scale.
export const SCORE_MIN = 1;
export const SCORE_MAX = 5;
// The scores as a list, for the JSON schemas. An enum works with each provider. Some reject
// "minimum" and "maximum".
export const SCORES = Array.from({ length: SCORE_MAX }, (_, index) => SCORE_MIN + index);
