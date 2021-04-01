import * as Sentry from "@sentry/node";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

export async function endlessRetry<T>(
  name: string,
  call: () => Promise<T>
): Promise<T> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      console.log(name, "fetching");
      return await call();
    } catch (err) {
      reportError(err, `Request ${name} failed, retrying`);
      await sleep(1000);
    }
  }
}

const cluster = process.env.CLUSTER;
export function reportError(err: Error, context: string): void {
  console.error(context, err);
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(err, {
      tags: { context, cluster },
    });
  }
}
