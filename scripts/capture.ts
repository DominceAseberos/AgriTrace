import { config } from "dotenv";
import { execFileSync, spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

config({ path: ".env.local", quiet: true });

const port = 3100;
const baseUrl = `http://127.0.0.1:${port}`;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.join(process.cwd(), "docs", "screenshots");

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.status === 200) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Local production server did not become ready.");
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextCli, "start", "-p", String(port)], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "ignore",
    windowsHide: true,
  });

  try {
    await waitForServer();
    const browser = await chromium.launch({ executablePath: chromePath, headless: true });

    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    const desktopCaptures = [
      { route: "/", file: "dashboard.png" },
      { route: "/plants", file: "plants.png" },
      { route: "/plants/plant-011", file: "plant-detail.png" },
      { route: "/investigate/plant-011", file: "investigation.png" },
    ];

    for (const capture of desktopCaptures) {
      await desktop.goto(`${baseUrl}${capture.route}`, { waitUntil: "networkidle" });
      await desktop.screenshot({ path: path.join(outputDir, capture.file), fullPage: true });
    }

    await desktop.goto(`${baseUrl}/investigate/plant-011`, { waitUntil: "networkidle" });
    await desktop.getByText("Show connection map", { exact: true }).click();
    await desktop.waitForTimeout(400);
    await desktop.screenshot({ path: path.join(outputDir, "investigation-map.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const mobileCaptures = [
      { route: "/", file: "dashboard-mobile.png" },
      { route: "/plants", file: "plants-mobile.png" },
      { route: "/plants/plant-011", file: "plant-detail-mobile.png" },
      { route: "/investigate/plant-011", file: "investigation-mobile.png" },
    ];

    for (const capture of mobileCaptures) {
      await mobile.goto(`${baseUrl}${capture.route}`, { waitUntil: "networkidle" });
      await mobile.screenshot({ path: path.join(outputDir, capture.file), fullPage: true });
    }

    await browser.close();
    console.log(`Captured ${desktopCaptures.length + mobileCaptures.length + 1} UI screenshots.`);
  } finally {
    if (server.pid) {
      try {
        execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
      } catch {
        // Process may have already exited.
      }
    }
  }
}

main().catch((error) => {
  console.error("Screenshot capture failed.");
  console.error(error instanceof Error ? error.message : "Unknown local capture error");
  process.exitCode = 1;
});
