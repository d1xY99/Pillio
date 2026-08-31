export function createPendingDb(): any {
  const handler: ProxyHandler<() => unknown> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (value: unknown) => void) => {
          resolve([]);
          return Promise.resolve([]);
        };
      }
      if (prop === 'all' || prop === 'values' || prop === 'execute') return () => [];
      if (prop === 'get') return () => undefined;
      if (prop === 'run') return () => ({ changes: 0, lastInsertRowId: 0 });
      return new Proxy(noop, handler);
    },
    apply() {
      return new Proxy(noop, handler);
    },
  };

  function noop() {}
  return new Proxy(noop, handler);
}
