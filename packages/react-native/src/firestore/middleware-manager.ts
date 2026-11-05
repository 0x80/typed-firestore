export type Next<T, R> = (ctx: T) => R;
export type Middleware<T, R> = (ctx: T, next: Next<T, R>) => R;
export type Handler<T, R> = (ctx: T) => R;

/**
 * Runs the registered middleware in order around a handler. Each middleware
 * receives the context and a `next` function, and can change the context,
 * wrap callbacks, or observe and replace the result.
 */
export class MiddlewareManager<T, R> {
  private handler: Handler<T, R>;
  private middlewares: Middleware<T, R>[] = [];

  constructor(handler: Handler<T, R>) {
    this.handler = handler;
  }

  /** Adds a middleware and returns a function that removes it again. */
  use(middleware: Middleware<T, R>): () => void {
    /** A fresh entry per call, so removing it never removes another registration. */
    const entry: Middleware<T, R> = (ctx, next) => middleware(ctx, next);
    /** Replaced rather than mutated, so a run in progress keeps its list. */
    this.middlewares = [...this.middlewares, entry];
    return () => {
      this.middlewares = this.middlewares.filter((m) => m !== entry);
    };
  }

  run(initialCtx: T): R {
    const middlewares = this.middlewares;
    const dispatch = (i: number, ctx: T): R => {
      const middleware = middlewares[i];
      if (!middleware) {
        return this.handler(ctx);
      }
      return middleware(ctx, (newCtx) => dispatch(i + 1, newCtx));
    };

    return dispatch(0, initialCtx);
  }
}
