import "@testing-library/jest-dom";

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] ?? null,
        setItem: (key, val) => { store[key] = String(val); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock EventSource for SSE tests
global.EventSource = class {
    constructor() { this.close = () => {}; }
};
