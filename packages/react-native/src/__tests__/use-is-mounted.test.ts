import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { useIsMounted } from "../fork/helpers/useIsMounted";

/** Runs the hook outside React, so the test can drive its effect by hand. */
vi.mock("react", () => ({
  useEffect: vi.fn(),
  useRef: <T>(current: T) => ({ current }),
}));

describe("useIsMounted", () => {
  it("should report mounted again when the effect runs again after its cleanup", () => {
    const isMounted = useIsMounted();
    const effect = vi.mocked(useEffect).mock.calls[0]?.[0];

    /** StrictMode and Fast Refresh run the cleanup, then the effect again. */
    const cleanup = effect?.();
    if (typeof cleanup === "function") {
      cleanup();
    }
    expect(isMounted.current).toBe(false);

    effect?.();
    expect(isMounted.current).toBe(true);
  });
});
