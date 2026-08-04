/**
 * In @react-native-firebase/firestore v22, `DocumentSnapshot.exists` changed
 * from a boolean property to a method, matching the modular firebase-js-sdk
 * API. Read it in a version-agnostic way so that the full peer dependency
 * range keeps working.
 */
export function snapshotExists(snapshot: {
  exists: boolean | (() => boolean);
}): boolean {
  return typeof snapshot.exists === "function"
    ? snapshot.exists()
    : snapshot.exists;
}
