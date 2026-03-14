import { useCallback, useMemo, useReducer } from "react";

export type LoadingValue<T, E> = {
  error?: E;
  loading: boolean;
  reset: () => void;
  setError: (error: E) => void;
  setValue: (value?: T) => void;
  value?: T;
};

type ReducerState<T, E> = {
  error?: E;
  loading: boolean;
  value?: T;
};

type ErrorAction<E> = { type: "error"; error: E };
type ResetAction = { type: "reset"; defaultValue?: unknown };
type ValueAction<T> = { type: "value"; value: T | undefined };
type ReducerAction<T, E> = ErrorAction<E> | ResetAction | ValueAction<T>;

const defaultState = <T, E>(defaultValue?: T): ReducerState<T, E> => {
  return {
    loading: defaultValue === undefined || defaultValue === null,
    value: defaultValue,
  };
};

const reducer =
  <T, E>() =>
  (
    state: ReducerState<T, E>,
    action: ReducerAction<T, E>,
  ): ReducerState<T, E> => {
    switch (action.type) {
      case "error":
        return {
          ...state,
          error: action.error,
          loading: false,
          value: undefined,
        };
      case "reset":
        return defaultState<T, E>(action.defaultValue as T);
      case "value":
        return {
          ...state,
          error: undefined,
          loading: false,
          value: action.value,
        };
      default:
        return state;
    }
  };

export function useLoadingValue<T, E>(
  getDefaultValue?: () => T,
): LoadingValue<T, E> {
  const defaultValue = getDefaultValue ? getDefaultValue() : undefined;
  const [state, dispatch] = useReducer(
    reducer<T, E>(),
    defaultState(defaultValue),
  );

  const reset = useCallback(() => {
    const resetValue = getDefaultValue ? getDefaultValue() : undefined;
    dispatch({ type: "reset", defaultValue: resetValue });
  }, [getDefaultValue]);

  const setError = useCallback((error: E) => {
    dispatch({ type: "error", error });
  }, []);

  const setValue = useCallback((value?: T) => {
    dispatch({ type: "value", value });
  }, []);

  return useMemo(
    () => ({
      error: state.error,
      loading: state.loading,
      reset,
      setError,
      setValue,
      value: state.value,
    }),
    [state.error, state.loading, reset, setError, setValue, state.value],
  );
}
