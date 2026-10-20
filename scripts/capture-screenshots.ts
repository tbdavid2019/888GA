import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

async function main() {
  const outputDir = path.resolve(process.cwd(), "docs/images");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2,
    locale: "zh-TW",
  });

  const page = await context.newPage();

  console.log("Navigating directly to app dashboard in Traditional Chinese...");
  await page.goto("http://127.0.0.1:3000/zh/app/xeoos-team", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  console.log("Waiting for charts and layout to stabilize...");
  await page.waitForTimeout(4000);

  console.log("Taking dashboard overview screenshot (zh-TW)...");
  await page.screenshot({
    path: path.join(outputDir, "dashboard-overview-zh.png"),
    fullPage: false,
  });

  console.log("Taking full-height screenshot (zh-TW)...");
  await page.screenshot({
    path: path.join(outputDir, "dashboard-full-zh.png"),
    fullPage: true,
  });

  console.log("Navigating to English version...");
  await page.goto("http://127.0.0.1:3000/en/app/xeoos-team", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  console.log("Taking dashboard overview screenshot (EN)...");
  await page.screenshot({
    path: path.join(outputDir, "dashboard-overview-en.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("Screenshots captured successfully in docs/images!");
}

main().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
