// Prunes unused Chromium locale bundles from the Electron Framework.
//
// electron-builder's `electronLanguages` option only prunes `.lproj` folders in
// `Contents/Resources`, which on macOS are empty stubs. The real locale payload
// (~40MB) lives inside `Electron Framework.framework/Versions/A/Resources`, which
// electron-builder never touches. See app-builder-lib's getLocalesConfig().
//
// This hook runs before code signing, so removing files here is safe.

const fs = require("node:fs");
const path = require("node:path");

// Languages to keep, matching `build.electronLanguages` in package.json.
// "Base" is not a language; it holds non-localized resources and must stay.
const KEEP = new Set(["en", "Base"]);

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin" && context.electronPlatformName !== "mas") {
    return;
  }

  const resourcesDir = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
    "Contents",
    "Frameworks",
    "Electron Framework.framework",
    "Versions",
    "A",
    "Resources"
  );

  if (!fs.existsSync(resourcesDir)) {
    throw new Error(`afterPack: Electron Framework Resources not found at ${resourcesDir}`);
  }

  let removed = 0;
  let bytes = 0;

  for (const entry of fs.readdirSync(resourcesDir)) {
    if (!entry.endsWith(".lproj")) continue;
    if (KEEP.has(entry.slice(0, -".lproj".length))) continue;

    const target = path.join(resourcesDir, entry);
    for (const file of fs.readdirSync(target)) {
      bytes += fs.statSync(path.join(target, file)).size;
    }
    fs.rmSync(target, { recursive: true, force: true });
    removed++;
  }

  console.log(
    `  • pruned locales  removed=${removed} saved=${(bytes / 1024 / 1024).toFixed(1)}MB`
  );
};
