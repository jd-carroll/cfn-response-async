
export interface RetryOptions {
  retries?: number;
  delay?: number;
  count?: number;
}

const defaultOptions: RetryOptions = {
  retries: 3,
  delay: 500,
  count: 0
};

/**
 * Use the setTimeout to delay retry
 */
const delay = (options: RetryOptions) => {
  return new Promise(resolve => setTimeout(resolve, options.delay! * options.count!));
};

/**
 * This run the lib
 * Receive the promiseFn
 */
export const retry = <T>(requestFn: () => Promise<T>, options = defaultOptions): Promise<T> => {
  // const optionsParsed = buildOptionsParsed(options);
  // const { onRetry, shouldRetry } = optionsParsed;
  const promise = requestFn();

  return promise.catch((err: any) => {
    if (options.count!++ < options.retries!) {
      return delay(options).then(() => {
        return retry(requestFn, options);
      });
    }
    throw err;
  });
};

export default retry;
