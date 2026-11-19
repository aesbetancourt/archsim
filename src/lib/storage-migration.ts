// The app was named ArchSim before it was named Charrette. Its browser data used keys that start
// with "archsim", for example "archsim:draft:lunch-rush". Move each one to the same key with
// "charrette" at the start. A key that exists with the new name already is kept as it is.
export function migrateStorage(storage: Storage): void {
  const OLD = "archsim";
  const NEW = "charrette";
  // Go from the end, because a removal changes the positions of the keys after it.
  for (let index = storage.length - 1; index >= 0; index--) {
    const key = storage.key(index);
    if (!key || !key.startsWith(OLD)) continue;
    const next = NEW + key.slice(OLD.length);
    const value = storage.getItem(key);
    if (value !== null && storage.getItem(next) === null) storage.setItem(next, value);
    storage.removeItem(key);
  }
}

// The migration as a script for the page. It runs before React starts, so each component reads
// the moved data. If storage is not available, the script does nothing.
export const migrationScript = `try{(${migrateStorage.toString()})(window.localStorage)}catch(e){}`;
