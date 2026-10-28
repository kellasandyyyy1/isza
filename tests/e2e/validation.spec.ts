import { expect, test, type Page } from "@playwright/test";
import { addDays, format } from "date-fns";
import { completeOnboarding, putRecords } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

const day = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");
const NOTE_TITLE = "This is a common time to feel low";

// A period 25 days ago with a 28-day cycle: day 26, the next period in 3 days, so the late luteal days.
async function setUpLateLuteal(page: Page) {
  await completeOnboarding(page);
  await putRecords(page, "periods", [{ id: 1, startDate: day(-25), endDate: day(-21) }]);
  await page.goto("/today");
}

async function logLowMood(page: Page) {
  await page.getByRole("button", { name: /^(Log|Edit) (today's )?check-in$/ }).first().click();
  const sheet = page.getByRole("dialog", { name: "Today's check-in" });
  await sheet.getByRole("button", { name: "Low", exact: true }).click();
  await sheet.getByRole("button", { name: "Save check-in" }).click();
  return sheet;
}

test("a low mood in the late luteal days shows one quiet note, and not again within 3 days", async ({ page }) => {
  await setUpLateLuteal(page);
  const sheet = await logLowMood(page);

  const note = sheet.getByRole("note", { name: NOTE_TITLE });
  await expect(note).toBeVisible();
  await expect(note).toContainText("Mood often dips in the days before a period.");
  await expect(page.getByRole("alert")).toHaveCount(0);
  // It never takes focus.
  await expect(note.getByRole("button", { name: "Dismiss" })).not.toBeFocused();

  await note.getByRole("button", { name: "Dismiss" }).click();
  await expect(sheet).toBeHidden();

  // The same check-in again today: saved, no note, the sheet closes.
  const again = await logLowMood(page);
  await expect(again).toBeHidden();
  await expect(page.getByRole("note")).toHaveCount(0);
});

test("a tap anywhere closes the sheet while the note shows", async ({ page }) => {
  await setUpLateLuteal(page);
  const sheet = await logLowMood(page);
  await expect(sheet.getByRole("note", { name: NOTE_TITLE })).toBeVisible();
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toBeHidden();
});

test("the Supportive notes switch turns the notes off", async ({ page }) => {
  await setUpLateLuteal(page);
  await page.goto("/me");
  const notesSwitch = page.getByRole("switch", { name: "Supportive notes" });
  await expect(notesSwitch).toBeChecked();
  await expect(page.getByText("Short notes when you log a hard day. Never advice, never a diagnosis.")).toBeVisible();
  await notesSwitch.click();
  await expect(notesSwitch).not.toBeChecked();

  await page.goto("/today");
  const sheet = await logLowMood(page);
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("note")).toHaveCount(0);
});

test("the support line is on Me and in check-in details, and opens the static support page", async ({ page }) => {
  await completeOnboarding(page);
  await page.goto("/me");
  await page.getByRole("link", { name: "If you are struggling, support is available." }).click();
  await expect(page).toHaveURL(/\/support$/);
  await expect(page.getByText("Iszacycle does not monitor what you write.", { exact: false })).toBeVisible();

  await page.goto("/today");
  await page.getByRole("button", { name: "Log today's check-in" }).click();
  const sheet = page.getByRole("dialog", { name: "Today's check-in" });
  await sheet.getByRole("button", { name: "More details" }).click();
  await expect(sheet.getByRole("link", { name: "If you are struggling, support is available." })).toBeVisible();
});

test("the support page lists emergency first, then the helplines as tap-to-call links", async ({ page }) => {
  await completeOnboarding(page);
  await page.goto("/support");
  const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
  expect(headings.slice(0, 3)).toEqual(["Emergency", "NCMH Crisis Hotline", "Hopeline PH"]);
  for (const [name, tel] of [
    ["Call Emergency, 911", "tel:911"],
    ["Call NCMH Crisis Hotline, 1553", "tel:1553"],
    ["Call NCMH Crisis Hotline, 0917 899 8727", "tel:09178998727"],
    ["Call Hopeline PH, (02) 8804 4673", "tel:0288044673"],
    ["Call Hopeline PH, 0917 558 4673", "tel:09175584673"],
  ]) {
    await expect(page.getByRole("link", { name })).toHaveAttribute("href", tel);
  }
  await expect(page.getByText("You do not need a reason to call. Consider talking to a doctor.")).toBeVisible();
});
