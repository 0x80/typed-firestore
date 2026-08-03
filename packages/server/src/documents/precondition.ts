import type { Precondition, Timestamp } from "firebase-admin/firestore";
import { isPreconditionFailure } from "~/utils/firestore-errors";

/**
 * The precondition forms available on a document that has already been read.
 *
 * `ifUnchanged` compares against the version that document was read at. The
 * document already knows it, so this saves threading `snapshot.updateTime`
 * through by hand, which is what the raw SDK requires.
 */
export type DocumentPrecondition = Precondition | { ifUnchanged: true };

export function resolvePrecondition(
  precondition: DocumentPrecondition,
  readVersion: Timestamp | undefined,
): Precondition {
  if (!("ifUnchanged" in precondition)) {
    return precondition;
  }

  if (!readVersion) {
    throw new Error(
      "The { ifUnchanged: true } precondition needs a document that carries an updateTime",
    );
  }

  return { lastUpdateTime: readVersion };
}

/**
 * Run a write, turning an unmet precondition into undefined.
 *
 * Losing a compare-and-swap race is an expected outcome rather than an error,
 * so it becomes a value. Only applies when the caller actually supplied a
 * precondition; an operation carrying an implicit one of its own still throws,
 * because there the failure means the call was wrong.
 */
export async function runWithPrecondition<T>(
  write: () => Promise<T>,
  hasCallerPrecondition: boolean,
): Promise<T | undefined> {
  if (!hasCallerPrecondition) {
    return await write();
  }

  try {
    return await write();
  } catch (error) {
    if (isPreconditionFailure(error)) {
      return undefined;
    }

    throw error;
  }
}
