import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TodayBoard } from "@/components/TodayBoard";
import { defaultPlace } from "@/data/cafes";

describe("TodayBoard", () => {
  beforeEach(() => localStorage.clear());
  it("renders the selected place and its board", () => {
    render(<TodayBoard initialPlace={defaultPlace} />);
    expect(screen.getByRole("heading", { name: "Today in Butuan City" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sustainability Week" })).toBeInTheDocument();
  });
  it("filters cards and persists a sip", async () => {
    const user = userEvent.setup();
    render(<TodayBoard initialPlace={defaultPlace} />);
    await user.click(screen.getByRole("button", { name: "Hiring" }));
    expect(screen.getByRole("heading", { name: "Brewer & front-of-house staff" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sustainability Week" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /38 sips/ }));
    expect(screen.getByRole("button", { name: /39 sips/ })).toHaveAttribute("aria-pressed", "true");
    expect(JSON.parse(localStorage.getItem("findit.sips") ?? "[]")).toContain("p4");
  });
});
