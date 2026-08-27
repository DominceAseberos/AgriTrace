import { config } from "dotenv";
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { chromium } from "playwright-core";

config({ path: ".env.local", quiet: true });

const port = 3101;
const baseUrl = `http://127.0.0.1:${port}`;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const routes = ["/", "/plants", "/plants/plant-011", "/investigate/plant-011", "/insights"];

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Keep waiting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("UX audit server did not become ready.");
}

async function main() {
  const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextCli, "start", "-p", String(port)], {
    cwd: process.cwd(), env: process.env, stdio: "ignore", windowsHide: true,
  });

  try {
    await waitForServer();
    const browser = await chromium.launch({ executablePath: chromePath, headless: true });

    for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "mobile", width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      for (const route of routes) {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
        const metrics = await page.evaluate(() => {
          const root = document.documentElement;
          const visible = [...document.querySelectorAll("body *")].filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
          });
          const tinyText = visible.filter((element) => {
            const text = element.textContent?.trim();
            if (!text || element.children.length > 0) return false;
            return Number.parseFloat(getComputedStyle(element).fontSize) < 12;
          }).length;
          return {
            bodyFont: Number.parseFloat(getComputedStyle(document.body).fontSize),
            horizontalOverflow: root.scrollWidth - root.clientWidth,
            tinyText,
          };
        });
        if (metrics.bodyFont < 16) throw new Error(`${viewport.name} ${route}: body font is below 16px`);
        if (metrics.horizontalOverflow > 2) throw new Error(`${viewport.name} ${route}: horizontal overflow ${metrics.horizontalOverflow}px`);
        if (metrics.tinyText > 0) throw new Error(`${viewport.name} ${route}: ${metrics.tinyText} visible text nodes below 12px`);
      }
      await page.close();
    }

    const graphPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await graphPage.goto(`${baseUrl}/investigate/plant-011`, { waitUntil: "networkidle" });
    await graphPage.getByText("Show connection map", { exact: true }).click();
    await graphPage.waitForTimeout(600);
    const graphCenter = await graphPage.evaluate(() => {
      const container = document.querySelector(".react-flow")?.getBoundingClientRect();
      const nodes = [...document.querySelectorAll(".react-flow__node")].map((node) => node.getBoundingClientRect());
      if (!container || nodes.length === 0) return null;
      const minX = Math.min(...nodes.map((node) => node.left));
      const maxX = Math.max(...nodes.map((node) => node.right));
      const minY = Math.min(...nodes.map((node) => node.top));
      const maxY = Math.max(...nodes.map((node) => node.bottom));
      const nodeCenterX = (minX + maxX) / 2;
      const nodeCenterY = (minY + maxY) / 2;
      const containerCenterX = container.left + container.width / 2;
      const containerCenterY = container.top + container.height / 2;
      return {
        xRatio: Math.abs(nodeCenterX - containerCenterX) / container.width,
        yRatio: Math.abs(nodeCenterY - containerCenterY) / container.height,
      };
    });
    if (!graphCenter) throw new Error("Graph centering audit could not find rendered nodes.");
    if (graphCenter.xRatio > 0.12 || graphCenter.yRatio > 0.16) {
      throw new Error(`Graph is not centered enough: x=${graphCenter.xRatio.toFixed(3)}, y=${graphCenter.yRatio.toFixed(3)}`);
    }

    await browser.close();
    console.log(`UX audit: OK (${routes.length} routes on desktop + mobile; graph centered).`);
  } finally {
    if (server.pid) {
      try { execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" }); } catch { /* already stopped */ }
    }
  }
}

main().catch((error) => {
  console.error("UX audit failed.");
  console.error(error instanceof Error ? error.message : "Unknown UX audit error");
  process.exitCode = 1;
});
