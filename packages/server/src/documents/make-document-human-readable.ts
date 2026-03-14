import { Timestamp } from "firebase-admin/firestore";
import { isJsonObject } from "~/utils";

type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type JsonObject = {
  [key: string]: JsonValue;
};

/**
 * Make a human-readable Firestore document for exporting to JSON. Useful for
 * debugging. It converts all Timestamps to strings and sorts object keys
 * alphabetically.
 */
export function makeDocumentHumanReadable(
  documentData: FirebaseFirestore.DocumentData,
): JsonObject {
  return sortObjectKeysRecursive(convertTimestampsRecursive(documentData));
}

function convertTimestampsRecursive(data: JsonObject): JsonObject {
  const convertedData = { ...data };

  for (const [key, value] of Object.entries(convertedData)) {
    if (value instanceof Timestamp) {
      convertedData[key] = `(timestamp) ${value.toDate().toISOString()}`;
    } else if (isJsonObject(value)) {
      convertedData[key] = convertTimestampsRecursive(value);
    }
  }

  return convertedData;
}

function sortObjectKeys(obj: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
  ) as JsonObject;
}

function sortObjectKeysRecursive(obj: JsonObject): JsonObject {
  const sortedObj = sortObjectKeys(obj);

  for (const [key, value] of Object.entries(sortedObj)) {
    if (isJsonObject(value)) {
      sortedObj[key] = sortObjectKeysRecursive(value);
    } else if (Array.isArray(value)) {
      sortedObj[key] = value.map((item) =>
        isJsonObject(item) ? sortObjectKeysRecursive(item) : item,
      );
    }
  }

  return sortedObj;
}
