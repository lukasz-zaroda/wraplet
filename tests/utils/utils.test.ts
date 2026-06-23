import { flattenDependencies, throwIfErrors } from "../../src/utils/utils";
import { DefaultWrapletSet, Wraplet, WrapletDependencyMap } from "../../src";
import { WrapletDependencies } from "../../src/Wraplet/types/WrapletDependencies";

describe("general utils/helpers", () => {
  it("throwIfErrors does nothing for empty errors array", () => {
    expect(() => throwIfErrors([], "ignored")).not.toThrow();
  });

  it("throwIfErrors throws AggregateError with provided message", () => {
    const error = new Error("failure");

    expect(() => throwIfErrors([error], "Custom message")).toThrow(
      "Custom message",
    );
    expect(() => throwIfErrors([error], "Custom message")).toThrow(
      AggregateError,
    );
  });

  it("flattenDependencies flattens wraplets and wraplet sets and skips empty values", () => {
    const firstWraplet = jest.fn() as unknown as Wraplet;
    const secondWraplet = jest.fn() as unknown as Wraplet;
    const thirdWraplet = jest.fn() as unknown as Wraplet;

    const wrapletSet = new DefaultWrapletSet();
    wrapletSet.add(secondWraplet);
    wrapletSet.add(thirdWraplet);

    const dependencies = {
      firstWraplet,
      wrapletSet,
      missing: undefined,
      nullable: null,
    } as unknown as WrapletDependencies<WrapletDependencyMap>;

    expect(flattenDependencies(dependencies)).toEqual([
      firstWraplet,
      secondWraplet,
      thirdWraplet,
    ]);
  });
});
