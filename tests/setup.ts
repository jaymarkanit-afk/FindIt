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
vi.mock("next/navigation", () => {
  const router = { refresh: vi.fn(), push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() };
  return { useRouter: () => router };
});
