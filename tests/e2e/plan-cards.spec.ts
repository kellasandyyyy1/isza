import { expect, test, type Page } from "@playwright/test";
import { loadDemoData } from "./helpers";

const carousel = (page: Page) => page.locator("section[aria-label=\"Today's plan\"]:visible");
const cards = (page: Page) => carousel(page).locator(":scope > div").first().locator(":scope > *");

async function openWithWater(page: Page) {
  await loadDemoData(page);
  await page.goto("/today");
  await expect(cards(page)).toHaveCount(6);
}

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

for (const viewport of VIEWPORTS) {
  test(`all six cards share one height and 16px padding at ${viewport.width}px wide`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openWithWater(page);
    const boxes = await cards(page).evaluateAll((items) =>
      items.map((item) => {
        const style = getComputedStyle(item);
        return {
          height: Math.round(item.getBoundingClientRect().height),
          padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
          // Nothing runs past the card's own box.
          overflow: item.scrollHeight - item.clientHeight,
          // Every clamped line is shown whole: its height is a whole number of lines, never cut mid-line.
          partialLines: [...item.querySelectorAll<HTMLElement>("[data-clamp]")].filter((line) => {
            const lineHeight = parseFloat(getComputedStyle(line).lineHeight);
            const lines = line.getBoundingClientRect().height / lineHeight;
            return Math.abs(lines - Math.round(lines)) > 0.05 || line.getBoundingClientRect().bottom > item.getBoundingClientRect().bottom;
          }).length,
        };
      }),
    );
    expect(new Set(boxes.map((box) => box.height)).size).toBe(1);
    expect(boxes[0].height).toBeGreaterThanOrEqual(164);
    for (const box of boxes) {
      expect(box.padding).toEqual(["16px", "16px", "16px", "16px"]);
      expect(box.overflow).toBeLessThanOrEqual(0);
      expect(box.partialLines).toBe(0);
    }
  });
}

test("each card keeps its own 3D icon, Water keeps the mascot, and every title sits on the same line", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWithWater(page);
  const titles = await cards(page).evaluateAll((items) =>
    items.map((item) => {
      const heading = item.querySelector("h2");
      const art = heading?.querySelector("img")?.getAttribute("src") ?? null;
      return {
        title: heading?.textContent?.trim(),
        art: art?.match(/art-icons\/(\w+)-/)?.[1] ?? null,
        mascot: item.querySelector('img[src*="mascot-water"]') !== null,
        // Where the title row sits inside its card.
        titleTop: Math.round((heading?.getBoundingClientRect().top ?? 0) - item.getBoundingClientRect().top),
      };
    }),
  );
  expect(titles.map(({ title, art, mascot }) => ({ title, art, mascot }))).toEqual([
    { title: "Train", art: "train", mascot: false },
    { title: "Food", art: "food", mascot: false },
    { title: "Drink water", art: null, mascot: true },
    { title: "Energy", art: "energy", mascot: false },
    { title: "Sleep", art: "sleep", mascot: false },
    { title: "Social", art: "social", mascot: false },
  ]);
  expect(new Set(titles.map((item) => item.titleTop)).size).toBe(1);

  // The mascot stands at the top of the left column, 85% of its height, left of the text and clear of it.
  const water = cards(page).nth(2);
  const [mascot, card, heading] = await Promise.all([
    water.locator('img[src*="mascot-water"]').locator("xpath=ancestor::div[@aria-hidden='true'][1]").boundingBox(),
    water.boundingBox(),
    water.locator("h2").boundingBox(),
  ]);
  if (!mascot || !card || !heading) throw new Error("Water card pieces are missing.");
  // 16px of padding inside the card's 1px border.
  const content = card.height - 34;
  expect(Math.round(mascot.y - card.y)).toBe(17);
  expect(mascot.height).toBeCloseTo(content * 0.85, 0);
  expect(mascot.x + mascot.width).toBeLessThanOrEqual(heading.x - 12);
  // The figure itself runs nearly the full height: the art carries only 4% padding above and below.
  const figure = await water.locator('img[src*="mascot-water"]').evaluate((image: HTMLImageElement) => ({
    cover: getComputedStyle(image).objectFit,
    height: image.getBoundingClientRect().height,
  }));
  expect(figure.cover).toBe("cover");
  expect(figure.height).toBeCloseTo(mascot.height, 0);
});

test("the chevron shows only when a line is cut short", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWithWater(page);
  const train = cards(page).first();

  // Short lines: everything fits, no chevron.
  await train.evaluate((card) => {
    for (const line of card.querySelectorAll("[data-clamp]")) line.textContent = "Short line.";
  });
  await expect(train.locator("[data-more]")).toHaveCount(0);

  // A long daily line: clamped at two lines with an ellipsis, and the chevron appears.
  await train.locator("[data-daily-note]").evaluate((line) => {
    line.textContent = "A long line about rest and movement ".repeat(8).trim() + ".";
  });
  await expect(train.locator("[data-more]")).toBeVisible();
  const note = await train.locator("[data-daily-note]").evaluate((line) => ({
    clamped: line.scrollHeight > line.clientHeight,
    ellipsis: getComputedStyle(line).webkitLineClamp,
  }));
  expect(note).toEqual({ clamped: true, ellipsis: "2" });

  // Short again: the chevron goes.
  await train.locator("[data-daily-note]").evaluate((line) => {
    line.textContent = "Short again.";
  });
  await expect(train.locator("[data-more]")).toHaveCount(0);
});

test("the Water plus adds a glass without opening the sheet, and the card body opens it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWithWater(page);
  const water = cards(page).nth(2);
  await water.scrollIntoViewIfNeeded();

  // Before a glass is logged, the count is a highlighted pill, so it stands out at a glance.
  const pill = water.locator("[data-water-count]");
  await expect(pill).toHaveText("No glasses logged yet");
  const zero = await pill.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    weight: getComputedStyle(element).fontWeight,
  }));
  expect(zero.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(Number(zero.weight)).toBeGreaterThanOrEqual(600);

  await water.getByRole("button", { name: "Add a glass" }).click();
  await expect(water.getByText("1 glass today")).toBeVisible();
  // Once counted, the pill gives way to plain text.
  expect(await pill.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // The plus sits in its own column: the title ends before it, and the count and daily line start below it.
  const [title, count, plus] = await Promise.all([
    water.locator("h2").boundingBox(),
    water.getByText("1 glass today").boundingBox(),
    water.getByRole("button", { name: "Add a glass" }).boundingBox(),
  ]);
  if (!title || !count || !plus) throw new Error("Water card pieces are missing.");
  expect(title.x + title.width).toBeLessThanOrEqual(plus.x - 12);
  expect(count.y).toBeGreaterThanOrEqual(plus.y + plus.height);

  // A tap on the card body, away from the plus, opens the sheet.
  const box = await water.boundingBox();
  if (!box) throw new Error("No Water card.");
  await page.mouse.click(box.x + 40, box.y + box.height - 24);
  await expect(page.getByRole("dialog", { name: "Water" })).toBeVisible();
});

for (const width of [360, 390]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`screenshots of every card at ${width}px, ${colorScheme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme });
      await openWithWater(page);
      const row = carousel(page).locator(":scope > div").first();
      for (let index = 0; index < 6; index++) {
        await row.evaluate((element, at) => {
          const card = element.children[at] as HTMLElement;
          element.scrollLeft = card.offsetLeft - 16;
        }, index);
        await page.waitForTimeout(300);
        const box = await carousel(page).boundingBox();
        if (!box) throw new Error("No carousel.");
        await page.screenshot({
          path: testInfo.outputPath(`card-${index}-${width}-${colorScheme}.png`),
          clip: { x: 0, y: box.y - 8, width, height: box.height + 16 },
        });
      }
    });
  }
}
