// Notarizes and staples the built DMGs.
//
// electron-builder notarizes the .app bundle and staples a ticket to it, then
// packs the DMG afterwards. The DMG itself is signed (see build.dmg.sign) but
// never notarized, so Gatekeeper rejects the container even though the app
// inside is fine:
//
//   $ spctl -a -t open --context context:primary-signature BrowserPort.dmg
//   rejected
//   source=Unnotarized Developer ID
//
// There is no native option for this — DmgOptions exposes `sign` but not
// `notarize` — so we submit the finished DMGs ourselves.
//
// This runs in afterAllArtifactBuild, which completes before the workflow's
// "Upload to release" step, so what gets published is the stapled copy.

const { execFileSync } = require("node:child_process");
const path = require("node:path");

const CREDENTIAL_VARS = ["APPLE_ID", "APPLE_APP_SPECIFIC_PASSWORD", "APPLE_TEAM_ID"];

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: "pipe", encoding: "utf8", ...opts });
}

exports.default = async function notarizeDmg(buildResult) {
  if (process.platform !== "darwin") {
    return [];
  }

  const dmgs = (buildResult.artifactPaths || []).filter((p) => p.endsWith(".dmg"));
  if (dmgs.length === 0) {
    return [];
  }

  const missing = CREDENTIAL_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    // Local/unsigned builds legitimately have no credentials. Skip rather than
    // fail, but be loud — a silently unnotarized DMG is what caused this file.
    console.log(
      `  • skipped DMG notarization  reason=missing ${missing.join(", ")} count=${dmgs.length}`
    );
    return [];
  }

  for (const dmg of dmgs) {
    const name = path.basename(dmg);
    console.log(`  • notarizing DMG  file=${name}`);

    try {
      run("xcrun", [
        "notarytool",
        "submit",
        dmg,
        "--apple-id",
        process.env.APPLE_ID,
        "--password",
        process.env.APPLE_APP_SPECIFIC_PASSWORD,
        "--team-id",
        process.env.APPLE_TEAM_ID,
        "--wait",
      ]);
    } catch (err) {
      // stdout carries notarytool's rejection detail; stderr is usually empty.
      const detail = [err.stdout, err.stderr].filter(Boolean).join("\n").trim();
      throw new Error(`notarytool failed for ${name}\n${detail}`);
    }

    run("xcrun", ["stapler", "staple", dmg]);

    // Confirm the ticket actually attached rather than trusting exit codes
    // alone. Note spctl writes its assessment to stderr, not stdout, and exits
    // non-zero when it rejects — so read both streams and key off the exit.
    try {
      run("spctl", ["-a", "-t", "open", "--context", "context:primary-signature", "-v", dmg]);
    } catch (err) {
      const detail = [err.stdout, err.stderr].filter(Boolean).join("\n").trim();
      throw new Error(`DMG still rejected by Gatekeeper after stapling: ${name}\n${detail}`);
    }

    console.log(`  • DMG notarized and stapled  file=${name}`);
  }

  return [];
};
