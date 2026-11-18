import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Overlay } from "@/components/overlay/Overlay";
import { AppShell } from "@/components/shell/AppShell";
import { getPlace, listPlaces } from "@/lib/api";
import { resetUserStateCache } from "@/lib/local/userState";
import { THEME_SCRIPT } from "@/lib/theme";

beforeEach(() => {
  localStorage.clear();
  resetUserStateCache();
  document.documentElement.setAttribute("data-theme", "light");
  document.cookie = "findit.place=; Max-Age=0; Path=/";
  vi.mocked(usePathname).mockReturnValue("/");
  vi.mocked(useRouter().refresh).mockClear();
});

async function renderShell(children: React.ReactNode = <p>Page</p>) {
  const [place, places] = await Promise.all([getPlace("Butuan City"), listPlaces()]);
  return render(
    <AppShell place={place} places={places} hasPlaceCookie>
      {children}
    </AppShell>,
  );
}

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open filters</button>
      <Overlay open={open} onClose={() => setOpen(false)} title="Filters">
        <button type="button">First option</button>
        <button type="button">Last option</button>
      </Overlay>
    </>
  );
}

describe("Overlay", () => {
  it("is a named modal dialog that takes focus and traps Tab", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open filters" }));

    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const close = within(dialog).getByRole("button", { name: "Close" });
    expect(close).toHaveFocus();

    await user.tab();
    await user.tab();
    expect(within(dialog).getByRole("button", { name: "Last option" })).toHaveFocus();
    await user.tab(); // wraps to the first control
    expect(close).toHaveFocus();
    await user.tab({ shift: true }); // and back to the last
    expect(within(dialog).getByRole("button", { name: "Last option" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open filters" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes from the close button too", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open filters" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe("App shell", () => {
  it("makes the page inert while an overlay is open", async () => {
    const user = userEvent.setup();
    const { container } = await renderShell();
    const app = container.firstElementChild;
    expect(app).not.toHaveAttribute("inert");
    await user.click(screen.getByRole("button", { name: /Place: Butuan City/ }));
    expect(app).toHaveAttribute("inert");
    await user.keyboard("{Escape}");
    expect(app).not.toHaveAttribute("inert");
  });

  it("picks a place from the sheet, saves it, refreshes and confirms with a toast", async () => {
    const user = userEvent.setup();
    await renderShell();
    const pill = screen.getByRole("button", { name: /Place: Butuan City/ });
    await user.click(pill);

    const dialog = screen.getByRole("dialog", { name: "Choose a place" });
    const current = within(dialog).getByRole("button", { name: /Butuan City/ });
    expect(current).toHaveAttribute("aria-current", "true");
    expect(current).toHaveFocus();

    await user.click(within(dialog).getByRole("button", { name: /San Francisco/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(pill).toHaveFocus();
    expect(localStorage.getItem("findit.place")).toBe('"San Francisco"');
    expect(useRouter().refresh).toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent("Showing San Francisco");
  });

  it("has a labelled bottom nav that marks the current page", async () => {
    vi.mocked(usePathname).mockReturnValue("/saved");
    await renderShell();
    const nav = screen.getByRole("navigation", { name: "Main" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Today", "Map", "Café", "Saved", "Owner"]);
    expect(within(nav).getByRole("link", { name: "Saved" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Today" })).not.toHaveAttribute("aria-current");
  });

  it("sends the Café tab to the last café opened", async () => {
    localStorage.setItem("findit.cafe", "9");
    vi.mocked(usePathname).mockReturnValue("/cafe/9");
    await renderShell();
    const cafe = screen.getByRole("link", { name: "Café" });
    expect(cafe).toHaveAttribute("href", "/cafe/9");
    expect(cafe).toHaveAttribute("aria-current", "page");
  });
});

describe("Theme", () => {
  it("applies the saved theme before first paint, as the old app did", () => {
    localStorage.setItem("findit.theme", "dark");
    new Function(THEME_SCRIPT)();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("findit.theme", "purple");
    new Function(THEME_SCRIPT)();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("toggles dark theme and saves the bare word", async () => {
    const user = userEvent.setup();
    localStorage.setItem("findit.theme", "dark");
    await renderShell();
    const toggle = screen.getByRole("button", { name: "Dark theme" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("findit.theme")).toBe("light");
  });
});

describe("Toast", () => {
  it("hides itself after a moment", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await renderShell();
      await user.click(screen.getByRole("button", { name: /Place: Butuan City/ }));
      await user.click(screen.getByRole("button", { name: /Prosperidad/ }));
      expect(await screen.findByRole("status")).toHaveTextContent("Showing Prosperidad");
      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(screen.getByRole("status")).toHaveTextContent("");
    } finally {
      vi.useRealTimers();
    }
  });
});
