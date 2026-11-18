// VELMARA HEAT — saves: one localStorage slot. Cash, mission progress, listeners
// and loadout persist across sessions; the game autosaves after every mission and
// on P. A missing or corrupt slot simply starts a new game.

const SAVE_KEY = 'velmara-heat-save-v1';

export function saveGame(state) {
  try {
    const data = {
      cash: state.player.cash,
      missionIndex: state.missions.index,
      completedCount: state.missions.completedCount,
      done: state.missions.done,
      listeners: state.stream.listeners,
      hasWeapon: state.player.hasWeapon,
      clothes: state.player.clothes,
      modLevel: state.player.modLevel,
      health: state.player.health,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.cash !== 'number' || typeof data.missionIndex !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage may be unavailable in a sandboxed frame; a fresh game is fine.
  }
}

export function hasSave() {
  try {
    return window.localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}
