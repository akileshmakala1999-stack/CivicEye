// Setup mock browser environment for unit tests
const localStorageStore: Record<string, string> = {};
const sessionStorageStore: Record<string, string> = {};

const mockLocalStorage = {
  getItem: (k: string) => localStorageStore[k] || null,
  setItem: (k: string, v: string) => { localStorageStore[k] = String(v); },
  removeItem: (k: string) => { delete localStorageStore[k]; },
  clear: () => { Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]); },
};

const mockSessionStorage = {
  getItem: (k: string) => sessionStorageStore[k] || null,
  setItem: (k: string, v: string) => { sessionStorageStore[k] = String(v); },
  removeItem: (k: string) => { delete sessionStorageStore[k]; },
  clear: () => { Object.keys(sessionStorageStore).forEach((k) => delete sessionStorageStore[k]); },
};

(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).sessionStorage = mockSessionStorage;

const listeners: Record<string, ((e: any) => void)[]> = {};

(globalThis as any).window = {
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  dispatchEvent: (e: any) => {
    const arr = listeners[e.type] || [];
    arr.forEach((fn) => {
      try {
        fn(e);
      } catch (err) {
        console.warn(`Error in listener for ${e.type}:`, err);
      }
    });
    return true;
  },
  addEventListener: (type: string, fn: any) => {
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(fn);
  },
  removeEventListener: (type: string, fn: any) => {
    if (!listeners[type]) return;
    listeners[type] = listeners[type].filter((cb) => cb !== fn);
  },
};

(globalThis as any).CustomEvent = class {
  type: string;
  detail: any;
  constructor(type: string, detail?: any) {
    this.type = type;
    this.detail = detail?.detail !== undefined ? detail.detail : detail;
  }
};
