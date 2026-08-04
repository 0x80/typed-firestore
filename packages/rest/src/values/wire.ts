/**
 * The Firestore REST wire format. Every value is wrapped in a tagged union with
 * exactly one field naming its type.
 *
 * Note that `integerValue` is carried as a string. Firestore stores 64-bit
 * integers while JSON only has doubles, so the REST API encodes them as text to
 * avoid losing precision in transit.
 */
export type FirestoreValue =
  | { stringValue: string }
  | { timestampValue: string }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { integerValue: string }
  /**
   * Finite doubles travel as JSON numbers. The non-finite ones travel as the
   * strings "NaN", "Infinity" and "-Infinity", because proto3 JSON has no
   * literal for them and a raw number would serialize to `null`.
   */
  | { doubleValue: number | string }
  | { bytesValue: string }
  | { referenceValue: string }
  | { geoPointValue: { latitude: number; longitude: number } }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: FirestoreFields } };

export type FirestoreFields = Record<string, FirestoreValue>;

/** A document as returned by the REST API. */
export type WireDocument = {
  name: string;
  fields?: FirestoreFields;
  createTime: string;
  updateTime: string;
};
