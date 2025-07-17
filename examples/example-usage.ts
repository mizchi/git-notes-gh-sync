#!/usr/bin/env -S deno run --allow-run --allow-read --allow-env

import { $ } from "https://deno.land/x/dax@0.39.2/mod.ts";

console.log("=== GitHub Issues/PRs synced with git notes ===");
console.log();

// Issue notes を表示
console.log("📋 Issues:");
const issueNotes = await $`git notes --ref=github/issues list`.text();
if (issueNotes.trim()) {
  const lines = issueNotes.trim().split("\n");
  for (const line of lines) {
    const [noteObj, commitObj] = line.split(/\s+/);
    if (!commitObj) continue;
    
    const commitShort = commitObj.substring(0, 7);
    const commitMsg = await $`git log -1 --format=%s ${commitObj}`.text();
    
    try {
      const issueInfo = await $`git notes --ref=github/issues show ${commitObj}`.quiet().text();
      const issue = JSON.parse(issueInfo);
      
      console.log(`  ${commitShort} - ${commitMsg.trim()}`);
      console.log(`    └─ Issue #${issue.number}: ${issue.title} [${issue.state}]`);
    } catch {
      // ノートが見つからない場合はスキップ
    }
  }
} else {
  console.log("  (No issue notes found)");
}

console.log();
console.log("🔀 Pull Requests:");
const prNotes = await $`git notes --ref=github/pulls list`.text();
if (prNotes.trim()) {
  const lines = prNotes.trim().split("\n");
  for (const line of lines) {
    const [noteObj, commitObj] = line.split(/\s+/);
    if (!commitObj) continue;
    
    const commitShort = commitObj.substring(0, 7);
    const commitMsg = await $`git log -1 --format=%s ${commitObj}`.text();
    
    try {
      const prInfo = await $`git notes --ref=github/pulls show ${commitObj}`.quiet().text();
      const pr = JSON.parse(prInfo);
      
      console.log(`  ${commitShort} - ${commitMsg.trim()}`);
      console.log(`    └─ PR #${pr.number}: ${pr.title} [${pr.state}]`);
    } catch {
      // ノートが見つからない場合はスキップ
    }
  }
} else {
  console.log("  (No PR notes found)");
}

console.log();
console.log("💡 Tip: Use 'git notes --ref=github/issues show <commit>' to see full details");

// より詳細な情報を表示するオプション
if (Deno.args.includes("--detail") || Deno.args.includes("-d")) {
  console.log();
  console.log("=== Detailed View ===");
  
  // 最新のコミットから5つ取得
  const recentCommits = await $`git log --format=%H -5`.text();
  const commits = recentCommits.trim().split("\n");
  
  for (const commit of commits) {
    const commitShort = commit.substring(0, 7);
    const commitMsg = await $`git log -1 --format=%s ${commit}`.text();
    
    console.log();
    console.log(`📝 ${commitShort}: ${commitMsg.trim()}`);
    
    // Issue notes
    try {
      const issueInfo = await $`git notes --ref=github/issues show ${commit}`.quiet().text();
      const issue = JSON.parse(issueInfo);
      console.log(`  📋 Issue #${issue.number}: ${issue.title}`);
      console.log(`     State: ${issue.state}`);
      console.log(`     URL: ${issue.url}`);
    } catch {
      // No issue note
    }
    
    // PR notes
    try {
      const prInfo = await $`git notes --ref=github/pulls show ${commit}`.quiet().text();
      const pr = JSON.parse(prInfo);
      console.log(`  🔀 PR #${pr.number}: ${pr.title}`);
      console.log(`     State: ${pr.state}`);
      console.log(`     URL: ${pr.url}`);
    } catch {
      // No PR note
    }
  }
}