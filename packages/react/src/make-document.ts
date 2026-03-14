import type { DocumentData, DocumentSnapshot } from "firebase/firestore";
import type { FsDocument } from "~/types";

export function makeDocument<T extends DocumentData>(
  doc: DocumentSnapshot<T>,
): FsDocument<T> {
  const data = doc.data();
  if (!data) {
    throw new Error(`Document ${doc.ref.path} exists but has no data`);
  }
  return {
    id: doc.id,
    data,
  };
}
