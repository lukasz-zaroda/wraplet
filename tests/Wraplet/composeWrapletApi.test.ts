import {
  lazyWiring,
  mergeWirings,
  wireCallback,
} from "../../src/Wraplet/composeWrapletApi";

describe("mergeWrapletApiConfig", () => {
  it("should merge configs correctly", async () => {
    const initCallback1 = jest.fn();
    const initCallback2 = jest.fn();
    const destroyCallback1 = jest.fn();
    const destroyCallback2 = jest.fn();

    const composedConfig = mergeWirings([
      {
        initializeCallback: initCallback1,
        destroyCallback: destroyCallback1,
      },
      {
        initializeCallback: initCallback2,
        destroyCallback: destroyCallback2,
      },
    ]);

    await composedConfig.initializeCallback?.();
    expect(initCallback1).toHaveBeenCalledTimes(1);
    expect(initCallback2).toHaveBeenCalledTimes(1);

    await composedConfig.destroyCallback?.();
    expect(destroyCallback1).toHaveBeenCalledTimes(1);
    expect(destroyCallback2).toHaveBeenCalledTimes(1);
  });

  it("should run initilization callbacks in the wiring order and destruction callbacks in reverse", async () => {
    const calls: string[] = [];

    const composedConfig = mergeWirings([
      {
        initializeCallback: async () => {
          calls.push("init-1");
        },
      },
      {
        initializeCallback: async () => {
          calls.push("init-2");
        },
      },
      {
        destroyCallback: async () => {
          calls.push("destroy-1");
        },
      },
      {
        destroyCallback: async () => {
          calls.push("destroy-2");
        },
      },
    ]);

    await composedConfig.initializeCallback?.();
    await composedConfig.destroyCallback?.();

    expect(calls).toEqual(["init-1", "init-2", "destroy-2", "destroy-1"]);
  });
});

describe("wireCallback", () => {
  it("creates a wiring with the given initialize callback", async () => {
    const cb = jest.fn();
    const wiring = wireCallback("initializeCallback", cb);
    await wiring.initializeCallback?.();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(wiring.destroyCallback).toBeUndefined();
  });

  it("creates a wiring with the given destroy callback", async () => {
    const cb = jest.fn();
    const wiring = wireCallback("destroyCallback", cb);
    await wiring.destroyCallback?.();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(wiring.initializeCallback).toBeUndefined();
  });
});

describe("lazyWiring", () => {
  it("returns a wiring with both initialize and destroy callbacks", () => {
    const wiring = lazyWiring(() => ({}));
    expect(typeof wiring.initializeCallback).toBe("function");
    expect(typeof wiring.destroyCallback).toBe("function");
  });

  it("does not evaluate the callback until the wiring is used", () => {
    const callback = jest.fn(() => ({}));
    lazyWiring(callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it("evaluates the callback when the initialize callback is used", async () => {
    const callback = jest.fn(() => ({}));
    const wiring = lazyWiring(callback);

    expect(callback).not.toHaveBeenCalled();
    await wiring.initializeCallback?.();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("evaluates the callback when the destroy callback is used", async () => {
    const callback = jest.fn(() => ({}));
    const wiring = lazyWiring(callback);

    expect(callback).not.toHaveBeenCalled();
    await wiring.destroyCallback?.();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("delegates to the initialize callback of the returned wiring", async () => {
    const innerInit = jest.fn();
    const wiring = lazyWiring(() => ({
      initializeCallback: innerInit,
    }));

    await wiring.initializeCallback?.();
    expect(innerInit).toHaveBeenCalledTimes(1);
  });

  it("delegates to the destroy callback of the returned wiring", async () => {
    const innerDestroy = jest.fn();
    const wiring = lazyWiring(() => ({
      destroyCallback: innerDestroy,
    }));

    await wiring.destroyCallback?.();
    expect(innerDestroy).toHaveBeenCalledTimes(1);
  });

  it("evaluates the callback only once and reuses the returned wiring", async () => {
    const callback = jest.fn(() => ({}));
    const wiring = lazyWiring(callback);

    await wiring.initializeCallback?.();
    await wiring.initializeCallback?.();
    await wiring.destroyCallback?.();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("handles a callback returning void without throwing", async () => {
    const wiring = lazyWiring(() => {});

    await expect(wiring.initializeCallback?.()).resolves.toBeUndefined();
    await expect(wiring.destroyCallback?.()).resolves.toBeUndefined();
  });

  it("handles a returned wiring without the relevant callback", async () => {
    const initOnly = lazyWiring(() => ({
      initializeCallback: jest.fn(),
    }));
    await expect(initOnly.destroyCallback?.()).resolves.toBeUndefined();

    const destroyOnly = lazyWiring(() => ({
      destroyCallback: jest.fn(),
    }));
    await expect(destroyOnly.initializeCallback?.()).resolves.toBeUndefined();
  });

  it("propagates the resolved value of the returned initialize callback", async () => {
    const wiring = lazyWiring(() => ({
      initializeCallback: async () => {
        // returns undefined, simulating a real async wiring
      },
    }));

    await expect(wiring.initializeCallback?.()).resolves.toBeUndefined();
  });

  it("evaluates the callback only once even when it returns void", async () => {
    const callback = jest.fn(() => {});
    const wiring = lazyWiring(callback);

    await wiring.initializeCallback?.();
    await wiring.destroyCallback?.();

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
