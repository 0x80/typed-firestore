import type { DocumentData, DocumentSnapshot } from "firebase-admin/firestore";
import type { FsDocument } from "~/types";

export function makeDocument<T extends DocumentData>(
  doc: DocumentSnapshot<T>,
): FsDocument<T> {
  return {
    id: doc.id,
    data: doc.data() as T,
  };
}
