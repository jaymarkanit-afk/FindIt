import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { posts } from "@/data/seed";
import { Composer } from "@/components/owner/Composer";
import { OwnerPage } from "@/components/owner/OwnerPage";
import { ToastProvider } from "@/components/shell/Toast";
import { getPlace, listCafes, listPosts, ownerSignIn, ownerSignOut, saveComposedPost } from "@/lib/api";
import { buildPost, emptyForm, formatTime, formFromPost, photoOverflowNote, previewPost, to24h, validatePost, weekdayOf } from "@/lib/composer";
import { getUserStateSnapshot, resetUserStateCache } from "@/lib/local/userState";

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
const base = { id: "o1", cafeId: 1, time: 1, sips: 0, pinned: false };

async function renderComposer(postId: string | null = null) {
  const [cafes, allPosts, place] = await Promise.all([listCafes(), listPosts(), getPlace("Butuan City")]);
  return render(
    <ToastProvider>
      <Composer cafes={cafes} place={place} posts={allPosts} now={NOW} postId={postId} />
    </ToastProvider>,
  );
}

async function signIn() {
  await act(async () => {
    await ownerSignIn("owner@paramount.ph", "x");
  });
}

beforeEach(async () => {
  localStorage.clear();
  resetUserStateCache();
  await act(async () => {
    await ownerSignOut();
  });
  vi.mocked(useRouter().push).mockClear();
  vi.mocked(useRouter().replace).mockClear();
});
afterEach(async () => {
  await act(async () => {
    await ownerSignOut();
  });
});

describe("composer logic", () => {
  it("formats times and dates as the old app did", () => {
    expect(formatTime("19:00")).toBe("7 PM");
    expect(formatTime("09:30")).toBe("9:30 AM");
    expect(formatTime("")).toBe("");
    expect(to24h("7 PM")).toBe("19:00");
    expect(to24h("12:30 AM")).toBe("00:30");
    expect(weekdayOf("2026-11-20")).toBe("FRI");
  });

  it("builds each post type in the stored shape", () => {
    const event = buildPost({ ...emptyForm("event"), eventTitle: " Poetry night ", date: "2026-11-20", time: "19:00", eventPrice: "Free", caption: "  Come by\nall welcome  " }, base);
    expect(event).toEqual({
      ...base, type: "event", status: "live", endedAt: null, caption: "Come by\nall welcome", photos: [],
      event: { title: "Poetry night", date: "2026-11-20", day: "FRI", time: "7 PM", price: "Free" },
    });
    const promo = buildPost({ ...emptyForm("promo"), promoTitle: "BOGO", photos: [{ src: "a", alt: " Cups " }, { src: "b", alt: "" }] }, base);
    expect(promo.photos).toEqual([{ src: "a", alt: "Cups" }]); // promo takes one photo
    expect(buildPost({ ...emptyForm("hiring"), role: "Barista", photos: [{ src: "a", alt: "" }] }, base).photos).toEqual([]);
  });

  it("refills the form from a post, and keeps the old day when the date is missing", () => {
    const workshop = posts.find((post) => post.id === "p5")!;
    const form = formFromPost(workshop);
    expect(form).toMatchObject({ type: "event", eventTitle: "Latte Art Workshop", time: "10:00", eventPrice: "₱350", date: "" });
    const rebuilt = buildPost(form, { ...base, eventDay: "SAT" });
    expect(rebuilt.type === "event" && rebuilt.event.day).toBe("SAT");
  });

  it("checks what publishing needs", () => {
    expect(validatePost(buildPost(emptyForm("new"), base))).toEqual([
      { field: "ann-item", message: "Add the item's name." },
      { field: "ann-text", message: "Add a caption." },
    ]);
    expect(validatePost(buildPost({ ...emptyForm("event"), caption: "Hi" }, base)).map((error) => error.message)).toEqual([
      "Add a title for the event.",
      "Add the event date.",
      "The caption needs at least 3 characters.",
    ]);
    expect(validatePost(buildPost(emptyForm("photos"), base))).toEqual([{ field: "ann-photo", message: "Add at least 1 photo." }]);
  });

  it("shows placeholders in the preview and explains extra photos", () => {
    const preview = previewPost(buildPost(emptyForm("hiring"), base));
    expect(preview.type === "hiring" && preview.hiring.role).toBe("The role you are hiring for");
    expect(photoOverflowNote("promo", 2)).toBe("A promo post can have up to 1 photo, so 2 were not added.");
    expect(photoOverflowNote("new", 1)).toBe("A new post can have up to 4 photos, so 1 was not added.");
  });
});

describe("saving (lib/api.ts)", () => {
  it("publishes a new owner post first in findit.ownerPosts", async () => {
    const result = await saveComposedPost({ ...emptyForm("new"), item: "Ube cheesecake", caption: "Fresh today" }, { editingId: null, asDraft: false, alertNow: true });
    expect(result.ok).toBe(true);
    const [saved] = JSON.parse(localStorage.getItem("findit.ownerPosts") ?? "[]");
    expect(saved).toMatchObject({ cafeId: 1, type: "new", status: "live", pinned: false, endedAt: null, sips: 0, caption: "Fresh today", new: { item: "Ube cheesecake", price: "", availability: "" } });
    expect(saved.id).toMatch(/^o\d+$/);
    expect(getUserStateSnapshot().seen).toEqual([]);
  });

  it("refuses to publish with missing fields, but saves a draft as it is", async () => {
    const empty = emptyForm("promo");
    expect(await saveComposedPost(empty, { editingId: null, asDraft: false, alertNow: true })).toMatchObject({ ok: false, storageFull: false });
    expect(await saveComposedPost(empty, { editingId: null, asDraft: true, alertNow: true })).toMatchObject({ ok: true });
    expect(getUserStateSnapshot().ownerPosts[0]).toMatchObject({ status: "draft", type: "promo" });
  });

  it("edits a seed post through findit.postEdits, marked edited", async () => {
    const form = { ...formFromPost(posts.find((post) => post.id === "p1")!), caption: "New words for the promo" };
    expect(await saveComposedPost(form, { editingId: "p1", asDraft: false, alertNow: true })).toEqual({ ok: true, id: "p1" });
    const edit = JSON.parse(localStorage.getItem("findit.postEdits") ?? "{}").p1;
    expect(edit).toMatchObject({ caption: "New words for the promo", type: "promo", time: posts[0].time, sips: 138 });
    expect(typeof edit.editedAt).toBe("number");
    expect(edit.id).toBeUndefined();
  });

  it("skips the alerts badge when Send alerts now is off", async () => {
    const result = await saveComposedPost({ ...emptyForm("hiring"), role: "Barista", caption: "Join us" }, { editingId: null, asDraft: false, alertNow: false });
    expect(result.ok && getUserStateSnapshot().seen).toEqual([result.ok ? result.id : ""]);
  });
});

describe("composer page", () => {
  it("sends signed-out visits back to /owner", async () => {
    await renderComposer();
    expect(useRouter().replace).toHaveBeenCalledWith("/owner");
    expect(screen.queryByRole("heading", { name: "Post an update" })).not.toBeInTheDocument();
  });

  it("opens on the title, posting as the café", async () => {
    await signIn();
    await renderComposer();
    expect(screen.getByRole("heading", { level: 1, name: "Post an update" })).toHaveFocus();
    expect(screen.getByText("Posting as")).toHaveTextContent("Posting as Paramount Coffee");
    expect(screen.getByRole("button", { name: "New item" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("0 / 500")).toBeInTheDocument();
  });

  it("shows errors inline, focuses the first, and clears one as it is fixed", async () => {
    const user = userEvent.setup();
    await signIn();
    await renderComposer();
    await user.click(screen.getByRole("button", { name: "Publish" }));
    const item = screen.getByLabelText(/Item name/);
    expect(item).toHaveFocus();
    expect(item).toHaveAttribute("aria-invalid", "true");
    expect(item).toHaveAccessibleDescription("Add the item's name.");
    expect(screen.getByText("Add a caption.")).toBeInTheDocument();
    await user.type(item, "U");
    expect(screen.queryByText("Add the item's name.")).not.toBeInTheDocument();
    expect(useRouter().push).not.toHaveBeenCalled();
  });

  it("publishes a new item and returns to the dashboard", async () => {
    const user = userEvent.setup();
    await signIn();
    await renderComposer();
    await user.type(screen.getByLabelText(/Item name/), "Ube cheesecake");
    await user.type(screen.getByLabelText(/Price/), "₱180");
    await user.type(screen.getByLabelText(/Caption/), "Fresh today");
    // The preview is the board's card
    const preview = screen.getByRole("region", { name: "Preview" });
    expect(within(preview).getByRole("article", { name: "New: Ube cheesecake, Paramount Coffee" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Publish" }));
    const id = getUserStateSnapshot().ownerPosts[0].id;
    expect(useRouter().push).toHaveBeenCalledWith(`/owner?tab=live&post=${id}&notice=published-alert`);
  });

  it("adds, describes, reorders and removes photos within the type's limit", async () => {
    const user = userEvent.setup();
    await signIn();
    await renderComposer();
    await user.click(screen.getByRole("button", { name: "Photos" }));
    expect(screen.getByText("1 to 6 photos. The first one is the main photo.")).toBeInTheDocument();
    expect(screen.getByText("(optional)")).toBeInTheDocument(); // the caption
    await user.upload(screen.getByLabelText("Add photos"), [photo("a.jpg"), photo("b.jpg"), photo("bad.jpg")]);
    expect(screen.getByText("Some files could not be read as images.")).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Photos" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText("Main")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Description for photo 1 (optional)"), "Latte art");
    await user.click(screen.getByRole("button", { name: "Move photo 1 later" }));
    // Now last, its "later" button is disabled: focus goes to its first enabled one
    expect(screen.getByRole("button", { name: "Move photo 2 later" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move photo 2 earlier" })).toHaveFocus();
    expect(screen.getByLabelText("Description for photo 2 (optional)")).toHaveValue("Latte art");
    await user.click(screen.getByRole("button", { name: "Remove photo 1" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(within(screen.getByRole("region", { name: "Preview" })).getByRole("article", { name: "Photos: 1 photo, Paramount Coffee" })).toBeInTheDocument();
  });

  it("says when photos do not fit the type, and marks unused ones after a type change", async () => {
    const user = userEvent.setup();
    await signIn();
    await renderComposer();
    await user.upload(screen.getByLabelText("Add photos"), [photo("a.jpg"), photo("b.jpg")]);
    await user.click(screen.getByRole("button", { name: "Promo" }));
    expect(screen.getByText("Not posted: this type takes 1 photo")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Add/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hiring" }));
    expect(screen.queryByText("Photos", { selector: "span" })).not.toBeInTheDocument();
  });

  it("explains a photo that did not fit", async () => {
    const user = userEvent.setup();
    await signIn();
    await renderComposer();
    await user.click(screen.getByRole("button", { name: "Event" }));
    await user.upload(screen.getByLabelText("Add a photo"), [photo("a.jpg"), photo("b.jpg")]);
    expect(screen.getByText("A event post can have up to 1 photo, so 1 was not added.")).toBeInTheDocument();
  });

  it("counts the caption and warns near the limit", async () => {
    await signIn();
    await renderComposer();
    const caption = screen.getByLabelText(/Caption/);
    await act(async () => {
      await userEvent.setup().click(caption);
    });
    await userEvent.setup().paste("x".repeat(485));
    expect(screen.getByText("485 / 500")).toBeInTheDocument();
    expect(caption).toHaveAccessibleDescription("485 / 500");
  });

  it("saves a draft without checks", async () => {
    const user = userEvent.setup();
    await signIn();
    await renderComposer();
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
    expect(useRouter().push).toHaveBeenCalledWith(expect.stringMatching(/^\/owner\?tab=draft&post=o\d+$/));
  });

  it("cancels back to the dashboard", async () => {
    const user = userEvent.setup();
    await signIn();
    await renderComposer();
    await user.click(screen.getByRole("button", { name: "Cancel and go back to your dashboard" }));
    expect(useRouter().push).toHaveBeenCalledWith("/owner?focus=compose");
  });

  it("edits an existing post with its fields filled in", async () => {
    const user = userEvent.setup();
    await signIn();
    await renderComposer("p5");
    expect(screen.getByRole("heading", { level: 1, name: "Edit post" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Event" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText(/Title/)).toHaveValue("Latte Art Workshop");
    expect(screen.getByLabelText(/Time/)).toHaveValue("10:00");
    await user.type(screen.getByLabelText(/Date/), "2026-11-21");
    await user.click(screen.getByRole("button", { name: "Publish" }));
    expect(useRouter().push).toHaveBeenCalledWith("/owner?tab=live&post=p5&notice=updated");
    expect(getUserStateSnapshot().postEdits.p5).toMatchObject({ event: { title: "Latte Art Workshop", date: "2026-11-21", day: "SAT" } });
  });

  it("sends an unknown post back to /owner", async () => {
    await signIn();
    await renderComposer("o404");
    expect(useRouter().replace).toHaveBeenCalledWith("/owner");
  });
});

describe("back on the dashboard", () => {
  async function renderDashboard(returned: Parameters<typeof OwnerPage>[0]["returned"]) {
    const [cafes, allPosts] = await Promise.all([listCafes(), listPosts()]);
    render(
      <ToastProvider>
        <OwnerPage cafes={cafes} posts={allPosts} today={today} now={NOW} returned={returned} />
      </ToastProvider>,
    );
  }

  it("shows the published post's tab, focuses its Edit and shows the bar", async () => {
    const user = userEvent.setup();
    await signIn();
    await renderDashboard({ tab: "live", postId: "p5", notice: "published-alert", focusCompose: false });
    expect(within(screen.getByRole("article", { name: "Latte Art Workshop" })).getByRole("link", { name: "Edit" })).toHaveFocus();
    expect(screen.getByText("On the board. People with alerts on were notified.")).toBeInTheDocument();
    expect(useRouter().replace).toHaveBeenCalledWith("/owner", { scroll: false });
    await user.click(screen.getByRole("button", { name: "View" }));
    expect(useRouter().push).toHaveBeenCalledWith("/");
  });

  it("opens Drafts after Save draft", async () => {
    await signIn();
    await saveComposedPost({ ...emptyForm("promo"), promoTitle: "Rainy day" }, { editingId: null, asDraft: true, alertNow: true });
    const id = getUserStateSnapshot().ownerPosts[0].id;
    await renderDashboard({ tab: "draft", postId: id, notice: null, focusCompose: false });
    expect(screen.getByRole("tab", { name: "Drafts 1" })).toHaveAttribute("aria-selected", "true");
    expect(within(screen.getByRole("article", { name: "Rainy day" })).getByRole("link", { name: "Edit" })).toHaveFocus();
  });

  it("focuses Post an update after Cancel", async () => {
    await signIn();
    await renderDashboard({ tab: "live", postId: null, notice: null, focusCompose: true });
    expect(screen.getByRole("link", { name: /Post an update/ })).toHaveFocus();
  });
});
