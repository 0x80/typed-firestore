export function makeWait(secs: number) {
  return secs > 0
    ? new Promise((resolve) => setTimeout(resolve, secs * 1000))
    : undefined;
}
