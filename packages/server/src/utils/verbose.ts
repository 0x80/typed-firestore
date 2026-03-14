export function verboseLog(...args: unknown[]): void {
  if (process.env.VERBOSE) {
    console.log(...args);
  }
}

export function verboseCount(label: string): void {
  if (process.env.VERBOSE) {
    console.count(label);
  }
}
