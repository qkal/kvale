import { MutationRunner } from '../core/mutation';
import type { MutationConfig, MutationState } from '../core/types';

/**
 * Wraps a MutationRunner in Svelte 5 `$state` reactivity.
 * Call inside a component (runes context) — `$state` and `$effect` require it.
 *
 * @example
 * const deleteTodo = createReactiveMutation({
 *   fn: (id: number, signal) => fetch(`/api/todos/${id}`, { method: 'DELETE', signal }),
 *   onSettled: () => cache.invalidate('todos'),
 * });
 * // In template: {#if deleteTodo.status === 'loading'}
 */
export function createReactiveMutation<TData, TVariables, TContext = unknown>(
  config: MutationConfig<TData, TVariables, TContext>,
) {
  const runner = new MutationRunner<TData, TVariables, TContext>(config);
  let state = $state<MutationState<TData>>(runner.getState());

  const unsubscribe = runner.subscribe((newState) => {
    state = newState;
  });

  $effect(() => {
    return () => {
      unsubscribe();
      runner.reset();
    };
  });

  return {
    get status() {
      return state.status;
    },
    get data() {
      return state.data;
    },
    get error() {
      return state.error;
    },
    mutate: (variables: TVariables): Promise<void> => runner.mutate(variables),
    reset: () => runner.reset(),
  };
}
