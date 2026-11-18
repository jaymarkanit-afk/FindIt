import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MoreMenu } from "@/components/menu/MoreMenu";
import { setOpenMenu } from "@/components/menu/menuStore";

const edit = vi.fn();
const pin = vi.fn();
const remove = vi.fn();

function Menus({ second = false }: { second?: boolean }) {
  return (
    <div>
      <p>Outside</p>
      <MoreMenu
        itemName="Latte Art Workshop"
        items={[
          { label: "Delete", onSelect: remove, confirm: { question: "Delete this post? This can't be undone.", action: "Delete" } },
          { label: "Edit", onSelect: edit },
          { label: "Pin to top", onSelect: pin },
        ]}
      />
      {second && <MoreMenu itemName="Heritage Night" items={[{ label: "Edit", onSelect: edit }]} />}
    </div>
  );
}

beforeEach(() => {
  edit.mockClear();
  pin.mockClear();
  remove.mockClear();
});
afterEach(() => {
  act(() => setOpenMenu(null));
  vi.unstubAllGlobals();
});

describe("More options menu", () => {
  it("is a labelled 44px button that announces its menu", () => {
    render(<Menus />);
    const button = screen.getByRole("button", { name: "More options for Latte Art Workshop" });
    expect(button).toHaveAttribute("aria-haspopup", "menu");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveClass("icon-btn"); // the shared 44px round button
  });

  it("opens below the button with the first item focused; arrows, Home and End move", async () => {
    const user = userEvent.setup();
    render(<Menus />);
    const button = screen.getByRole("button", { name: "More options for Latte Art Workshop" });
    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu", { name: "Options for Latte Art Workshop" });
    expect(button).toHaveAttribute("aria-controls", menu.parentElement?.id);
    // Destructive items go last, in red
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Edit", "Pin to top", "Delete"]);
    expect(items[2].className).toMatch(/danger/);
    expect(items[0]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();
    await user.keyboard("{End}");
    expect(items[2]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(items[0]).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(items[2]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(items[0]).toHaveFocus();
  });

  it("selects with Enter, closes and returns focus to the button", async () => {
    const user = userEvent.setup();
    render(<Menus />);
    const button = screen.getByRole("button", { name: "More options for Latte Art Workshop" });
    await user.click(button);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(pin).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("closes on Escape and on Tab, returning focus, without selecting", async () => {
    const user = userEvent.setup();
    render(<Menus />);
    const button = screen.getByRole("button", { name: "More options for Latte Art Workshop" });
    await user.click(button);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
    await user.click(button);
    await user.keyboard("{Tab}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
    expect(edit).not.toHaveBeenCalled();
  });

  it("closes on a click outside", async () => {
    const user = userEvent.setup();
    render(<Menus />);
    await user.click(screen.getByRole("button", { name: "More options for Latte Art Workshop" }));
    await user.click(screen.getByText("Outside"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps only one menu open at a time", async () => {
    const user = userEvent.setup();
    render(<Menus second />);
    await user.click(screen.getByRole("button", { name: "More options for Latte Art Workshop" }));
    await user.click(screen.getByRole("button", { name: "More options for Heritage Night" }));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menu", { name: "Options for Heritage Night" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More options for Latte Art Workshop" })).toHaveAttribute("aria-expanded", "false");
  });

  it("asks before a destructive action: Keep cancels, the action confirms", async () => {
    const user = userEvent.setup();
    render(<Menus />);
    const button = screen.getByRole("button", { name: "More options for Latte Art Workshop" });
    await user.click(button);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("group", { name: "Delete this post? This can't be undone." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(remove).not.toHaveBeenCalled();
    expect(button).toHaveFocus();

    await user.click(button);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("is a bottom sheet on phones, and Escape returns focus", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("max-width"), addEventListener: () => {}, removeEventListener: () => {} }));
    const user = userEvent.setup();
    render(<Menus />);
    const button = screen.getByRole("button", { name: "More options for Latte Art Workshop" });
    await user.click(button);
    const sheet = screen.getByRole("dialog", { name: "Options for Latte Art Workshop" });
    const items = within(sheet).getAllByRole("menuitem");
    expect(items[0]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });
});
