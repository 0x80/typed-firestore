/**
 * Firestore field paths are dot-separated, so a field whose name contains a dot
 * (or any character outside the simple identifier set) has to be escaped with
 * backticks. Without that escaping a field literally named `a.b` would silently
 * address the nested field `b` inside the map `a`, which corrupts update masks,
 * filters and ordering alike.
 */

const SIMPLE_FIELD_NAME = /^[A-Za-z_][A-Za-z_0-9]*$/;

export function quoteFieldName(name: string): string {
  if (name === "") {
    throw new Error("A Firestore field name cannot be empty");
  }

  if (SIMPLE_FIELD_NAME.test(name)) {
    return name;
  }

  const escaped = name.replaceAll("\\", "\\\\").replaceAll("`", "\\`");

  return `\`${escaped}\``;
}
