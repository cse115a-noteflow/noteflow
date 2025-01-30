class EventEmitter {
  listeners: Array<() => void> = [];

  addListener(listener: () => void) {
    this.listeners.push(listener);
  }

  removeListener(listenerToRemove: () => void) {
    this.listeners = this.listeners.filter((listener) => listenerToRemove !== listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener());
  }

  getListeners() {
    return this.listeners;
  }
}

export default EventEmitter;