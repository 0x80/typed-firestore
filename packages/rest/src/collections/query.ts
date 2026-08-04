import { encodeValue } from "~/values/encode";
import { quoteFieldName } from "~/values/field-path";
import type { FirestoreValue } from "~/values/wire";

export type WhereFilterOp =
  | "=="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">="
  | "array-contains"
  | "array-contains-any"
  | "in"
  | "not-in";

export type OrderByDirection = "asc" | "desc";

const FIELD_OPERATORS: Record<WhereFilterOp, string> = {
  "==": "EQUAL",
  "!=": "NOT_EQUAL",
  "<": "LESS_THAN",
  "<=": "LESS_THAN_OR_EQUAL",
  ">": "GREATER_THAN",
  ">=": "GREATER_THAN_OR_EQUAL",
  "array-contains": "ARRAY_CONTAINS",
  "array-contains-any": "ARRAY_CONTAINS_ANY",
  in: "IN",
  "not-in": "NOT_IN",
};

type FilterState = {
  fieldPath: string;
  op: WhereFilterOp;
  value: unknown;
};

type OrderState = {
  fieldPath: string;
  direction: OrderByDirection;
};

export type QueryState = {
  readonly filters: readonly FilterState[];
  readonly orderBy: readonly OrderState[];
  readonly limit: number | undefined;
  readonly offset: number | undefined;
};

/**
 * An immutable query description.
 *
 * Unlike the server package, which has to introspect the SDK's query object to
 * recover the limit and select that were applied, this builder owns its own
 * state. That removes both the introspection step and the restriction that
 * `select` must be kept off the query.
 */
export class Query<T> {
  readonly state: QueryState;

  constructor(state?: QueryState) {
    this.state = state ?? {
      filters: [],
      orderBy: [],
      limit: undefined,
      offset: undefined,
    };
  }

  where<K extends keyof T & string>(
    field: K,
    op: WhereFilterOp,
    value: unknown,
  ): Query<T> {
    return new Query<T>({
      ...this.state,
      filters: [...this.state.filters, { fieldPath: field, op, value }],
    });
  }

  orderBy(
    field: keyof T & string,
    direction: OrderByDirection = "asc",
  ): Query<T> {
    return new Query<T>({
      ...this.state,
      orderBy: [...this.state.orderBy, { fieldPath: field, direction }],
    });
  }

  limit(count: number): Query<T> {
    if (!Number.isInteger(count) || count <= 0) {
      throw new RangeError(
        `A query limit must be a positive integer, received ${String(count)}`,
      );
    }

    return new Query<T>({ ...this.state, limit: count });
  }

  offset(count: number): Query<T> {
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError(
        `A query offset must be a non-negative integer, received ${String(count)}`,
      );
    }

    return new Query<T>({ ...this.state, offset: count });
  }
}

/** Build the `structuredQuery` payload the runQuery endpoint expects. */
export function buildStructuredQuery(
  collectionId: string,
  state: QueryState,
  select?: readonly string[],
): Record<string, unknown> {
  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId }],
  };

  if (select) {
    structuredQuery["select"] = {
      fields: select.map((field) => ({ fieldPath: quoteFieldName(field) })),
    };
  }

  const filters = state.filters.map((filter) => toFilter(filter));

  if (filters.length === 1) {
    structuredQuery["where"] = filters[0];
  } else if (filters.length > 1) {
    structuredQuery["where"] = {
      compositeFilter: { op: "AND", filters },
    };
  }

  if (state.orderBy.length > 0) {
    structuredQuery["orderBy"] = state.orderBy.map((order) => ({
      field: { fieldPath: quoteFieldName(order.fieldPath) },
      direction: order.direction === "asc" ? "ASCENDING" : "DESCENDING",
    }));
  }

  if (state.limit !== undefined) {
    structuredQuery["limit"] = state.limit;
  }

  if (state.offset !== undefined) {
    structuredQuery["offset"] = state.offset;
  }

  return structuredQuery;
}

/**
 * Comparisons against null and NaN are not field filters in Firestore. They are
 * unary filters, and sending them as field filters silently matches nothing
 * rather than failing, so the translation has to happen here.
 */
function toFilter(filter: FilterState): Record<string, unknown> {
  const field = { fieldPath: quoteFieldName(filter.fieldPath) };

  const unaryOperator = toUnaryOperator(filter);

  if (unaryOperator) {
    return { unaryFilter: { field, op: unaryOperator } };
  }

  return {
    fieldFilter: {
      field,
      op: FIELD_OPERATORS[filter.op],
      value: toFilterValue(filter),
    },
  };
}

function toUnaryOperator(filter: FilterState): string | undefined {
  const isNull = filter.value === null;
  const isNan = typeof filter.value === "number" && Number.isNaN(filter.value);

  if (!isNull && !isNan) {
    return undefined;
  }

  if (filter.op === "==") {
    return isNull ? "IS_NULL" : "IS_NAN";
  }

  if (filter.op === "!=") {
    return isNull ? "IS_NOT_NULL" : "IS_NOT_NAN";
  }

  throw new Error(
    `The operator "${filter.op}" cannot be used with ${isNull ? "null" : "NaN"} at "${filter.fieldPath}"`,
  );
}

/**
 * The membership operators take a list of candidates, so the array is encoded
 * as an arrayValue rather than treated as a single value.
 */
function toFilterValue(filter: FilterState): FirestoreValue {
  const expectsList =
    filter.op === "in" ||
    filter.op === "not-in" ||
    filter.op === "array-contains-any";

  if (!expectsList) {
    return encodeValue(filter.value);
  }

  if (!Array.isArray(filter.value)) {
    throw new TypeError(
      `The operator "${filter.op}" expects an array of values at "${filter.fieldPath}"`,
    );
  }

  /** Firestore rejects an empty candidate list outright, so catch it here. */
  if (filter.value.length === 0) {
    throw new TypeError(
      `The operator "${filter.op}" needs at least one value at "${filter.fieldPath}"`,
    );
  }

  return {
    arrayValue: { values: filter.value.map((entry) => encodeValue(entry)) },
  };
}
