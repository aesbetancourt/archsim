// Random letters and digits for IDs and file names. They are not secret and not unique by
// themselves, so an ID also has the time.

// Math.random() as text in base 36 starts with "0.", so the random digits start at index 2.
const BASE_36 = 36;
const FIRST_DIGIT = 2;
// The length of the random part of a saved ID.
const ID_RANDOM_LENGTH = 6;

/**
 * Random lowercase letters and digits. The text is not secret and not unique.
 * @param length The number of characters. The text can be shorter when the length is more than
 * about 10.
 * @returns The random text.
 * @example
 * randomText(6); // for example "k3j9xq"
 */
export function randomText(length: number): string {
  return Math.random()
    .toString(BASE_36)
    .slice(FIRST_DIGIT, FIRST_DIGIT + length);
}

/**
 * Make an ID that sorts by the time it was made.
 * @returns The time in milliseconds, a hyphen, and six random characters.
 * @example
 * timeId(); // for example "1763650000000-k3j9xq"
 */
export function timeId(): string {
  return `${Date.now()}-${randomText(ID_RANDOM_LENGTH)}`;
}
