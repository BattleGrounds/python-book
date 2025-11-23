declare global {
  interface Window {
    loadPyodide: (options: {
      indexURL: string;
      stdout?: (msg: string) => void;
      stderr?: (msg: string) => void;
    }) => Promise<any>;
  }
}

export {}