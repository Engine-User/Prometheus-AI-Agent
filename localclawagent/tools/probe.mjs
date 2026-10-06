/* Layout probe. Finds every element whose box escapes the viewport, so a
   horizontal-overflow bug is reported with the element that caused it rather
   than as a screenshot that is mysteriously cropped.
   Usage: node tools/probe.mjs <url> <width> <height> */

const [, , url = "http://localhost:8912/", w = "1440", h = "900", shot = ""] = process.argv;

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const profile = mkdtempSync(join(tmpdir(), "probe-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const j = await r.json();
      const page = j.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error("chrome did not come up");
}

const wsUrl = await targets();
const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
const errors = [];

ws.onmessage = (ev) => {
  // CDP multiplexes every event for this target onto one socket, including
  // ones this probe does not know about. A frame that is not a JSON object we
  // can dispatch on is not an error condition — it is a message to ignore.
  let m;
  try {
    m = JSON.parse(ev.data);
  } catch {
    return;
  }
  if (!m || typeof m !== "object") return;
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
  if (m.method === "Log.entryAdded" && m.params?.entry?.level === "error") {
    errors.push(m.params.entry.text);
  }
  if (m.method === "Runtime.exceptionThrown") {
    const d = m.params?.exceptionDetails;
    errors.push(`${d?.text || "exception"} ${d?.exception?.description || ""}`.trim());
  }
};

const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  return r?.result?.value;
};

await send("Log.enable");
await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: +w,
  height: +h,
  deviceScaleFactor: 1,
  mobile: +w < 700,
});
await send("Page.navigate", { url });

// Wait for the fonts, not for a stopwatch. font-display:swap paints the
// fallback first, and the fallback has different metrics from JetBrains Mono —
// measuring at a fixed delay means one run reports a 429px code block and the
// next reports 378px for the same page, which reads as a layout regression that
// does not exist. Two animation frames after fonts.ready is the first moment
// the layout is the layout.
await evaluate(
  `document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))`
);
await sleep(400);

const report = await evaluate(`(() => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const over = Math.round(r.right - vw);
    if (over > 1) {
      bad.push({
        sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0,3).join('.') : ''),
        over,
        left: Math.round(r.left),
        w: Math.round(r.width)
      });
    }
  }
  // Keep the outermost offenders: a child of a wide element is not the cause.
  return {
    vw,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    offenders: bad.slice(0, 25)
  };
})()`);

// The probe's entire job is to print a report; writing to stdout directly
// keeps console.log out of a file that also runs in a browser-adjacent context.
process.stdout.write(JSON.stringify({ viewport: `${w}x${h}`, ...report, errors }, null, 2) + "\n");

// Optional capture. --window-size CLAMPS on Windows (a 390px window lays out at
// ~500 and the PNG is then cropped to 390, which looks exactly like a
// horizontal-overflow bug and is not one). Emulating the device metrics before
// Page.captureScreenshot is the only way to get a truthful narrow capture, and
// that is why the screenshot lives here and not in a bare --screenshot flag.
if (shot) {
  const cap = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  if (cap?.data) {
    writeFileSync(shot, Buffer.from(cap.data, "base64"));
    process.stdout.write(`shot: ${shot}\n`);
  }
}

ws.close();
chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
