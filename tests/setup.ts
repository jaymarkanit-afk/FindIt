import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => cleanup());

vi.mock("next/image", () => ({
  default: ({ unoptimized: _unoptimized, ...props }: React.ComponentProps<"img"> & { unoptimized?: boolean }) =>
    React.createElement("img", props),
}));
vi.mock("next/link", () => ({
  default: (props: React.ComponentProps<"a">) => React.createElement("a", props),
}));
// One router and one usePathname for the whole run. The mock factory can be
// evaluated more than once (the vmThreads pool re-runs it per test file),
// so they live on globalThis: the component and the test then always see
// the same mock functions, whichever copy of the module each imported.
type NavigationMocks = {
  router: { refresh: () => void; push: (href: string) => void; replace: (href: string) => void; back: () => void; prefetch: () => void };
  usePathname: () => string;
};
vi.mock("next/navigation", () => {
  const store = globalThis as typeof globalThis & { __findItNavigation?: NavigationMocks };
  store.__findItNavigation ??= {
    router: { refresh: vi.fn(), push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() },
    usePathname: vi.fn(() => "/"),
  };
  const mocks = store.__findItNavigation;
  return {
    useRouter: () => mocks.router,
    usePathname: mocks.usePathname,
    notFound: () => {
      throw new Error("NEXT_NOT_FOUND");
    },
  };
});
