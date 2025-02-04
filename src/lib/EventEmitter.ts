type Listener = (type: string, params?: unknown) => void;

class EventEmitter {
  listeners: Listener[] = [];

  addListener(listener: Listener) {
    this.listeners.push(listener);
  }

  removeListener(listenerToRemove: Listener) {
    this.listeners = this.listeners.filter((listener) => listenerToRemove !== listener);
  }

  emit(type = 'noteUpdate', params?: unknown) {
    this.listeners.forEach((listener) => listener(type, params));
  }

  getListeners() {
    return this.listeners;
  }
}

export default EventEmitter;
