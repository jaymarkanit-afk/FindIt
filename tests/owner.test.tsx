import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cafes, posts } from "@/data/seed";
import type { Comment } from "@/data/types";
import { OwnerPage } from "@/components/owner/OwnerPage";
import { ToastProvider } from "@/components/shell/Toast";
import { addComment, listCafes, listPosts, ownerSignIn, ownerSignOut } from "@/lib/api";
import { resetBoardView } from "@/lib/boardView";
import { getUserStateSnapshot, resetUserStateCache } from "@/lib/local/userState";
import { addUpTo, commentsToAnswer, dashStats, moveItem, postsByStatus } from "@/lib/owner";

// jsdom has no canvas: resizing returns a fixed data URL, or null for "bad" files
vi.mock("@/lib/photos", () => ({
  PHOTO_MAX_WIDTH: 1200,
  BACKGROUND_MAX_WIDTH: 1600,
  resizePhoto: vi.fn(async (file: File) => (file.name.startsWith("bad") ? null : `data:image/jpeg;base64,${file.name}`)),
  resizePhotos: vi.fn(async (files: File[]) => files.map((file) => (file.name.startsWith("bad") ? null : `data:image/jpeg;base64,${file.name}`))),
}));

const NOW = Date.parse("2026-11-15T09:00+08:00");
const today = { iso: "2026-11-15", label: "Sunday, 15 November" };
const photo = (name: string) => new File(["x"], name, { type: "image/jpeg" });

async function renderOwner() {
  const [allCafes, allPosts] = await Promise.all([listCafes(), listPosts()]);
  return render(
    <ToastProvider>
      <OwnerPage cafes={allCafes} posts={allPosts} today={today} now={NOW} />
    </ToastProvider>,
  );
}

async function signedIn() {
  await act(async () => {
    await ownerSignIn("owner@paramount.ph", "secret");
  });
  await renderOwner();
}

beforeEach(async () => {
  localStorage.clear();
  resetUserStateCache();
  await act(async () => {
    resetBoardView();
    await ownerSignOut();
  });
  vi.mocked(useRouter().push).mockClear();
});
// Leave no one signed in for test files that run after this one
afterEach(async () => {
  await act(async () => {
    await ownerSignOut();
  });
});

describe("owner logic", () => {
  it("groups the café's posts by status, pinned first among live ones", () => {
    const pinned = posts.map((post) => (post.id === "p9" ? { ...post, pinned: true } : post));
    const ended = pinned.map((post) => (post.id === "p8" ? { ...post, status: "ended" as const } : post));
    const groups = postsByStatus(ended, 1, "2026-11-15");
    expect(groups.live.map((post) => post.id)).toEqual(["p9", "p1", "p10", "p5"]);
    expect(groups.ended.map((post) => post.id)).toEqual(["p8"]);
    expect(groups.draft).toEqual([]);
  });

  it("only shows tracked numbers", () => {
    expect(dashStats(4, cafes[0])).toEqual([
      { value: "4", label: "live posts" },
      { value: "4.9", label: "rating · 312 reviews" },
    ]);
    expect(dashStats(1, { ...cafes[0], rating: 0 })).toEqual([{ value: "1", label: "live post" }]);
  });

  it("finds comments still waiting for the café's reply", () => {
    const c = (id: string, postId: string, authorName: string, createdAt: string): Comment => ({ id, postId, authorName, text: id, createdAt });
    const comments = [
      c("a", "p1", "Guest", "2026-11-14T10:00:00Z"),
      c("b", "p1", "Paramount Coffee", "2026-11-14T11:00:00Z"), // answers a
      c("d", "p5", "Guest", "2026-11-14T12:00:00Z"),
      c("e", "p2", "Guest", "2026-11-14T13:00:00Z"), // another café's post
    ];
    const own = posts.filter((post) => post.cafeId === 1);
    expect(commentsToAnswer(comments, own, "Paramount Coffee").map((item) => item.comment.id)).toEqual(["d"]);
  });

  it("moves and adds within limits", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b"], 0, 5)).toEqual(["a", "b"]);
    expect(addUpTo(["a", "b", "c", "d", "e"], ["f", "g", "h"], 6)).toEqual({ list: ["a", "b", "c", "d", "e", "f"], dropped: 2 });
  });
});

describe("sign-in gate", () => {
  it("asks for any email and password, says it is a demo, and signs in", async () => {
    const user = userEvent.setup();
    await renderOwner();
    expect(screen.getByRole("heading", { level: 1, name: "Owner" })).toBeInTheDocument();
    expect(screen.getByText("Demo: any email and password works")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("status")).toHaveTextContent("Please enter your credentials");

    await user.type(screen.getByLabelText("Business email"), "owner@paramount.ph");
    await user.type(screen.getByLabelText("Password"), "anything{Enter}");
    expect(await screen.findByRole("heading", { level: 1, name: "Paramount Coffee" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Welcome back!");
  });

  it("signs out", async () => {
    const user = userEvent.setup();
    await signedIn();
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Signed out");
  });

  it("signs the owner's comments on their café's posts with the café's name", async () => {
    expect((await addComment("p1", "Hi"))?.authorName).toBe("Guest");
    await ownerSignIn("a@b.c", "x");
    expect((await addComment("p1", "Thanks!"))?.authorName).toBe("Paramount Coffee");
    expect((await addComment("p2", "Nice"))?.authorName).toBe("Guest"); // another café's post
  });
});

describe("profile card", () => {
  it("shows the same header customers see, its approval and its tracked numbers", async () => {
    await signedIn();
    const header = screen.getByRole("region", { name: "Paramount Coffee" });
    expect(within(header).getByText("J.C. Aquino Ave, Butuan City")).toBeInTheDocument();
    expect(within(header).getByText("PC")).toBeInTheDocument();
    expect(within(header).getByText("4.9 · 312 reviews")).toBeInTheDocument();
    expect(screen.getByText("Approved · visible to customers")).toBeInTheDocument();
    expect(screen.getByText("live posts").nextElementSibling).toHaveTextContent("5");
    expect(screen.getByRole("link", { name: /Post an update/ })).toHaveAttribute("href", "/owner/post");
    expect(screen.getByRole("link", { name: "View as customer" })).toHaveAttribute("href", "/cafe/1");
  });

  it("adds and removes the background photo in the old storage shape", async () => {
    const user = userEvent.setup();
    await signedIn();
    await user.upload(screen.getByLabelText("Add a background photo"), photo("bg.jpg"));
    expect(await screen.findByRole("img", { name: "Paramount Coffee background photo" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("findit.cafeEdits") ?? "{}")).toEqual({ "1": { backgroundPhoto: "data:image/jpeg;base64,bg.jpg" } });
    expect(screen.getByRole("status")).toHaveTextContent("Background photo updated");

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.queryByRole("img", { name: "Paramount Coffee background photo" })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("findit.cafeEdits") ?? "{}")).toEqual({ "1": { backgroundPhoto: null } });
    expect(screen.getByLabelText("Add a background photo")).toHaveFocus();
  });

  it("explains a file that is not an image", async () => {
    const user = userEvent.setup();
    await signedIn();
    await user.upload(screen.getByLabelText("Add a background photo"), photo("bad.jpg"));
    expect(await screen.findByRole("alert")).toHaveTextContent("That file could not be read as an image.");
  });
});

describe("Edit page", () => {
  it("saves About, phone, links and hours, and the header shows them", async () => {
    const user = userEvent.setup();
    await signedIn();
    const open = screen.getByRole("button", { name: "Edit page" });
    await user.click(open);
    const dialog = screen.getByRole("dialog", { name: "Edit page" });
    const about = within(dialog).getByLabelText("About");
    expect(about).toHaveFocus();
    expect(about).toHaveAttribute("maxLength", "150");
    await user.type(about, "Single-origin coffee.");
    await user.type(within(dialog).getByLabelText("Phone"), "0917 000 0000");
    await user.type(within(dialog).getByLabelText("Facebook link"), "https://evil.example/paramount");
    await user.type(within(dialog).getByLabelText("Opens"), "07:00");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(within(dialog).getByLabelText("Facebook link")).toHaveAccessibleDescription("Use a link to facebook.com that starts with https://");
    expect(within(dialog).getByLabelText("Closes")).toHaveAccessibleDescription("Add both opening and closing times, or leave both empty.");

    await user.clear(within(dialog).getByLabelText("Facebook link"));
    await user.type(within(dialog).getByLabelText("Facebook link"), "https://facebook.com/paramount");
    await user.type(within(dialog).getByLabelText("Closes"), "21:00");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(open).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Page details saved");
    expect(JSON.parse(localStorage.getItem("findit.cafeEdits") ?? "{}")["1"]).toEqual({
      about: "Single-origin coffee.",
      phone: "0917 000 0000",
      facebook: "https://facebook.com/paramount",
      instagram: "",
      hours: { open: "07:00", close: "21:00" },
    });
    const header = screen.getByRole("region", { name: "Paramount Coffee" });
    expect(within(header).getByText("Single-origin coffee.")).toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "0917 000 0000" })).toHaveAttribute("href", "tel:09170000000");
  });

  it("starts empty: no personal details are filled in for the owner", async () => {
    const user = userEvent.setup();
    await signedIn();
    await user.click(screen.getByRole("button", { name: "Edit page" }));
    const dialog = screen.getByRole("dialog", { name: "Edit page" });
    for (const label of ["About", "Phone", "Facebook link", "Instagram link", "Opens", "Closes"]) expect(within(dialog).getByLabelText(label)).toHaveValue("");
  });
});

describe("highlights on the dashboard", () => {
  const row = () => screen.getByRole("region", { name: "Highlights" });

  it("shows the count, no New tile at six, and no arrows, drag or Shown first", async () => {
    await signedIn();
    expect(within(row()).getByText("6 of 6")).toBeInTheDocument();
    expect(within(row()).queryByLabelText("New highlight")).not.toBeInTheDocument();
    expect(screen.queryByText("Shown first")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Move/ })).not.toBeInTheDocument();
    expect(within(row()).getAllByRole("button", { name: /^More options for highlight/ })).toHaveLength(6);
  });

  it("loads highlights saved without labels", async () => {
    localStorage.setItem("findit.cafeEdits", JSON.stringify({ "1": { featuredPhotos: ["Images/paramount/paramount1.jpg", "Images/paramount/paramount2.jpg"] } }));
    await signedIn();
    expect(within(row()).getByText("2 of 6")).toBeInTheDocument();
    expect(within(row()).getByRole("button", { name: "Open Paramount Coffee highlight 1" })).toBeInTheDocument();
  });

  it("removes one after the confirm, then adds new ones at the end, up to six", async () => {
    const user = userEvent.setup();
    await signedIn();
    await user.click(within(row()).getByRole("button", { name: "More options for highlight 1" }));
    await user.click(screen.getByRole("menuitem", { name: "Remove" }));
    expect(screen.getByText("Remove this highlight?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("status")).toHaveTextContent("Highlight removed");
    expect(screen.getByRole("heading", { name: "Highlights" })).toHaveFocus();
    expect(within(row()).getByText("5 of 6")).toBeInTheDocument();

    await user.upload(within(row()).getByLabelText("New highlight"), [photo("one.jpg"), photo("two.jpg")]);
    expect(await within(row()).findByRole("alert")).toHaveTextContent("You can add up to 6 highlights, so 1 was not added.");
    const stored = JSON.parse(localStorage.getItem("findit.cafeEdits") ?? "{}")["1"].featuredPhotos;
    expect(stored).toHaveLength(6);
    expect(stored[0]).toBe("Images/paramount/paramount5.jpg"); // the first was removed
    expect(stored[5]).toBe("data:image/jpeg;base64,one.jpg"); // new ones go at the end
    expect(within(row()).queryByLabelText("New highlight")).not.toBeInTheDocument();
  });

  it("edits a label in a small dialog and stores it with the photo", async () => {
    const user = userEvent.setup();
    await signedIn();
    await user.click(within(row()).getByRole("button", { name: "More options for highlight 2" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit label" }));
    const dialog = screen.getByRole("dialog", { name: "Edit label" });
    const field = within(dialog).getByLabelText("Label (optional)");
    expect(field).toHaveFocus();
    expect(field).toHaveAttribute("maxLength", "14");
    await user.type(field, "Latte art{Enter}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Label saved");
    expect(within(row()).getByText("Latte art")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More options for Latte art" })).toHaveFocus();
    const stored = JSON.parse(localStorage.getItem("findit.cafeEdits") ?? "{}")["1"].featuredPhotos;
    expect(stored[0]).toBe("Images/paramount/paramount4.jpg");
    expect(stored[1]).toEqual({ src: "Images/paramount/paramount5.jpg", label: "Latte art" });
  });

  it("opens the photo viewer at the tapped highlight", async () => {
    const user = userEvent.setup();
    await signedIn();
    await user.click(within(row()).getByRole("button", { name: "Open Paramount Coffee highlight 3" }));
    expect(within(screen.getByRole("dialog", { name: "Paramount Coffee highlights" })).getByText("3 of 6")).toBeInTheDocument();
  });
});

describe("your posts", () => {
  const card = (name: string) => screen.getByRole("article", { name });
  async function choose(user: ReturnType<typeof userEvent.setup>, post: string, item: string) {
    await user.click(within(card(post)).getByRole("button", { name: `More options for ${post}` }));
    await user.click(screen.getByRole("menuitem", { name: item }));
  }

  it("has Live, Drafts and Ended tabs with counts and arrow-key moves", async () => {
    const user = userEvent.setup();
    localStorage.setItem("findit.postEdits", JSON.stringify({ p9: { status: "draft" } }));
    await signedIn();
    const live = screen.getByRole("tab", { name: "Live 4" });
    expect(live).toHaveAttribute("aria-selected", "true");
    live.focus();
    await user.keyboard("{ArrowRight}");
    const drafts = screen.getByRole("tab", { name: "Drafts 1" });
    expect(drafts).toHaveAttribute("aria-selected", "true");
    expect(drafts).toHaveFocus();
    expect(within(screen.getByRole("tabpanel")).getByRole("article", { name: "Weekend Barista & Cashier" })).toBeInTheDocument();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Ended 0" })).toHaveFocus();
    expect(screen.getByText("Nothing here yet. Posts you publish show up in this list.")).toBeInTheDocument();
  });

  it("keeps the numbers on each post and puts the actions in the ... menu", async () => {
    const user = userEvent.setup();
    localStorage.setItem("findit.sips", '["p1"]');
    localStorage.setItem("findit.keeps", '["p1"]');
    localStorage.setItem("findit.comments", JSON.stringify([{ id: "c1", postId: "p1", authorName: "Guest", text: "Hi", createdAt: "2026-11-14T10:00:00.000Z" }]));
    await signedIn();
    const promo = card("Sustainability Week");
    expect(within(promo).getByText("Sips").nextElementSibling).toHaveTextContent("139");
    expect(within(promo).getByText("Comments").nextElementSibling).toHaveTextContent("1");
    expect(within(promo).getByText("Keeps").nextElementSibling).toHaveTextContent("1");
    expect(within(promo).queryByRole("button", { name: "Pin to top" })).not.toBeInTheDocument(); // no button row

    await user.click(within(promo).getByRole("button", { name: "More options for Sustainability Week" }));
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Edit", "Pin to top", "End post", "Delete"]);
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(useRouter().push).toHaveBeenCalledWith("/owner/post/p1");
  });

  it("has no Pin or End for drafts", async () => {
    const user = userEvent.setup();
    localStorage.setItem("findit.postEdits", JSON.stringify({ p9: { status: "draft" } }));
    await signedIn();
    await user.click(screen.getByRole("tab", { name: "Drafts 1" }));
    await user.click(screen.getByRole("button", { name: "More options for Weekend Barista & Cashier" }));
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Edit", "Delete"]);
  });

  it("pins one post per café, and Unpin undoes it", async () => {
    const user = userEvent.setup();
    await signedIn();
    await choose(user, "Latte Art Workshop", "Pin to top");
    expect(screen.getByRole("status")).toHaveTextContent("Pinned to the top of your page");
    expect(within(card("Latte Art Workshop")).getByRole("button", { name: "More options for Latte Art Workshop" })).toHaveFocus();
    await choose(user, "Sustainability Week", "Pin to top");
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getAllByRole("article")[0]).toHaveAccessibleName("Sustainability Week");
    expect(within(panel).getAllByText("Pinned")).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem("findit.postEdits") ?? "{}")).toEqual({ p5: { pinned: false }, p1: { pinned: true } });
    await choose(user, "Sustainability Week", "Unpin");
    expect(screen.getByRole("status")).toHaveTextContent("Unpinned");
  });

  it("ends a post: it moves to Ended, unpinned, with the time", async () => {
    const user = userEvent.setup();
    await signedIn();
    await choose(user, "Latte Art Workshop", "End post");
    expect(screen.getByRole("status")).toHaveTextContent("Post ended. Find it under Ended.");
    expect(screen.getByRole("heading", { name: "Your posts" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Ended 1" })).toBeInTheDocument();
    const edit = getUserStateSnapshot().postEdits.p5;
    expect(edit).toMatchObject({ status: "ended", pinned: false });
    expect(typeof edit.endedAt).toBe("number");
  });

  it("deletes only after the confirm in the menu", async () => {
    const user = userEvent.setup();
    await signedIn();
    await choose(user, "Latte Art Workshop", "Delete");
    expect(screen.getByText("Delete this post? This can't be undone.")).toBeInTheDocument();
    const keep = screen.getByRole("button", { name: "Keep" });
    expect(keep).toHaveFocus();
    await user.click(keep);
    expect(within(card("Latte Art Workshop")).getByRole("button", { name: "More options for Latte Art Workshop" })).toHaveFocus();
    expect(getUserStateSnapshot().postEdits).toEqual({});

    await choose(user, "Latte Art Workshop", "Delete");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.queryByRole("article", { name: "Latte Art Workshop" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Post deleted");
    expect(screen.getByRole("heading", { name: "Your posts" })).toHaveFocus();
    expect(JSON.parse(localStorage.getItem("findit.postEdits") ?? "{}")).toEqual({ p5: { deleted: true } });
  });
});

describe("comments to answer", () => {
  it("lists unanswered comments and Reply opens the thread on the café page", async () => {
    const user = userEvent.setup();
    localStorage.setItem("findit.comments", JSON.stringify([{ id: "c1", postId: "p1", authorName: "Guest", text: "Takeaway too?", createdAt: "2026-11-14T10:00:00.000Z" }]));
    await signedIn();
    const rail = screen.getByRole("region", { name: "Comments to answer" });
    expect(within(rail).getByText("Takeaway too?")).toBeInTheDocument();
    expect(within(rail).getByText("On Sustainability Week")).toBeInTheDocument();
    await user.click(within(rail).getByRole("button", { name: "Reply to Guest on Sustainability Week" }));
    expect(useRouter().push).toHaveBeenCalledWith("/cafe/1?reply=p1");
  });

  it("says when there is nothing to answer", async () => {
    await signedIn();
    expect(screen.getByText("No comments waiting for a reply.")).toBeInTheDocument();
  });
});
