export class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/**
 * The Font Loading API, which jsdom does not implement at all.
 *
 * Needed since the panel's textareas autosize (`F-084`): Mantine re-measures a growing field
 * when a webfont finishes loading, and its effect calls
 * `document.fonts.addEventListener('loadingdone', ...)` **unguarded**, so `document.fonts`
 * being `undefined` takes down every render of a themed `Textarea` in jsdom. The real browser
 * has it; this is an environment gap, not a behaviour to model, which is why the listener does
 * nothing rather than pretending fonts load.
 */
export class TestFontFaceSet {
  addEventListener() {}
  removeEventListener() {}
}

export function createTestStorage(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}
