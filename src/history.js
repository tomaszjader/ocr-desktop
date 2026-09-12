function createHistoryStore(limit = 50) {
  let entries = [];

  return {
    add(entry) {
      const item = { ...entry };
      entries = [item, ...entries.filter(current => current.text !== item.text)].slice(0, limit);
      return item;
    },
    list() {
      return entries.map(entry => ({ ...entry }));
    },
    get(id) {
      const entry = entries.find(current => current.id === id);
      return entry ? { ...entry } : null;
    },
    remove(id) {
      entries = entries.filter(entry => entry.id !== id);
    },
    clear() {
      entries = [];
    }
  };
}

module.exports = { createHistoryStore };
