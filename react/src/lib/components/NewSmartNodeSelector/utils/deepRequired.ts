// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DeepRequired<T> = T extends (...args: any[]) => any
    ? T
    : {
          [K in keyof T]-?: DeepRequired<T[K]>;
      };
