import { useState } from "react";

export function useAsyncMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
  options: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  } = {},
) {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (input: TInput) => {
    setIsPending(true);
    try {
      await mutationFn(input);
      options.onSuccess?.();
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error("Something went wrong."));
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}
