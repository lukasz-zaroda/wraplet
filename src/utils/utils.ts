import { WrapletDependencyMap } from "../Wraplet/types/WrapletDependencyMap";
import { WrapletDependencies } from "../Wraplet/types/WrapletDependencies";
import { Wraplet } from "../Wraplet/types/Wraplet";
import { isWrapletSet } from "../Set/types/WrapletSet";

export const RESOLVE = Promise.resolve();

export function throwIfErrors(errors: Error[], message: string): void {
  if (errors.length === 0) return;
  throw new AggregateError(errors, `${message}`);
}

/**
 * @deprecated
 *   Will be removed with the next major release.
 */
export function flattenDependencies<M extends WrapletDependencyMap>(
  dependencies: Partial<WrapletDependencies<M>>,
): Wraplet[] {
  const wraplets: Wraplet[] = [];
  for (const item of Object.values(dependencies)) {
    if (isWrapletSet(item)) {
      wraplets.push(...item.values());
      continue;
    }
    if (item) {
      wraplets.push(item);
    }
  }
  return wraplets;
}

export async function actOnDependencies<M extends WrapletDependencyMap>(
  deps: WrapletDependencies<M>,
  callback: <T extends keyof WrapletDependencies<M>>(
    id: T & string,
    dependency: WrapletDependencies<M>[T],
  ) => Promise<void>,
) {
  await Promise.all(
    Object.entries(deps).map(async ([id, dependency]) => {
      await callback(id, dependency);
    }),
  );
}

export async function actOnDependenciesWraplets<M extends WrapletDependencyMap>(
  deps: WrapletDependencies<M>,
  callback: (id: string, wraplet: Wraplet) => Promise<void>,
) {
  await actOnDependencies(deps, async (id, dependency) => {
    if (!dependency) return;
    const wraplets: Wraplet[] = isWrapletSet(dependency)
      ? Array.from(dependency)
      : [dependency];

    await Promise.all(
      wraplets.map(async (wraplet) => {
        await callback(id, wraplet);
      }),
    );
  });
}
