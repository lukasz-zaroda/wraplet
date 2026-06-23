import { WrapletDependencyMap } from "../Wraplet/types/WrapletDependencyMap";
import { WrapletDependencies } from "../Wraplet/types/WrapletDependencies";
import { Wraplet } from "../Wraplet/types/Wraplet";
import { isWrapletSet } from "../Set/types/WrapletSet";

export const RESOLVE = Promise.resolve();

export function throwIfErrors(errors: Error[], message: string): void {
  if (errors.length === 0) return;
  throw new AggregateError(errors, `${message}`);
}

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
