import type { FsDocument } from "~/types";
import type { DocumentData, DocumentSnapshot } from "./firestore-types";

export function makeDocument<T extends DocumentData>(
  doc: DocumentSnapshot<T>,
): FsDocument<T> {
  const data = doc.data();

  if (data === undefined) {
    throw new Error(
      `makeDocument called with a snapshot that has no data (id: ${doc.id}). Ensure the document exists before calling this function.`,
    );
  }

  return {
    id: doc.id,
    data,
  };
}
