#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-net

import { parseArgs } from "node:util";
import { GitNotesGitHubSync } from "./lib/sync.ts";

const USAGE = `gng - git-notes-gh-sync: Sync GitHub Issues/PRs with git notes

Usage:
  gng [command] [options]

Commands:
  sync              Sync all PRs and issues
  sync-pr           Sync a specific PR
  sync-issue        Sync an issue to a commit  
  sync-recent       Sync recent commits
  help              Show this help message

Options:
  --dry-run         Show what would be done without making changes
  --pr <number>     PR number (for sync-pr command)
  --issue <number>  Issue number (for sync-issue command)
  --commit <sha>    Commit SHA (for sync-issue command)
  --since <ref>     Git ref to sync from (for sync-recent, default: HEAD~10)
  --help, -h        Show help

Examples:
  # Sync all PRs and issues
  gng sync

  # Sync a specific PR
  gng sync-pr --pr 123

  # Sync an issue to a specific commit
  gng sync-issue --issue 456 --commit abc1234

  # Sync recent commits
  gng sync-recent --since HEAD~20

  # Dry run mode
  gng sync --dry-run
`;

async function getRepoInfo(): Promise<{ owner: string; repo: string }> {
  const cmd = new Deno.Command("git", {
    args: ["remote", "get-url", "origin"],
  });
  const output = await cmd.output();
  
  if (!output.success) {
    throw new Error("Failed to get git remote URL");
  }
  
  const url = new TextDecoder().decode(output.stdout).trim();
  const match = url.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
  
  if (!match) {
    throw new Error("Not a GitHub repository");
  }
  
  return {
    owner: match[1],
    repo: match[2],
  };
}

async function main() {
  const { values, positionals } = parseArgs({
    args: Deno.args,
    options: {
      "dry-run": { type: "boolean", default: false },
      "pr": { type: "string" },
      "issue": { type: "string" },
      "commit": { type: "string" },
      "since": { type: "string", default: "HEAD~10" },
      "help": { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
  });

  const command = positionals[0] || "help";

  if (values.help || command === "help") {
    console.log(USAGE);
    Deno.exit(0);
  }

  try {
    const { owner, repo } = await getRepoInfo();
    console.log(`Repository: ${owner}/${repo}`);
    
    const sync = new GitNotesGitHubSync({
      owner,
      repo,
      dryRun: values["dry-run"],
    });
    
    switch (command) {
      case "sync":
        await sync.syncAll();
        break;
        
      case "sync-pr": {
        const prNumber = values.pr;
        if (!prNumber) {
          console.error("Error: --pr option is required for sync-pr command");
          console.log("\nUsage: gng sync-pr --pr <number>");
          Deno.exit(1);
        }
        await sync.syncPullRequestToCommits(parseInt(prNumber));
        break;
      }
        
      case "sync-issue": {
        const issueNumber = values.issue;
        const commit = values.commit;
        if (!issueNumber || !commit) {
          console.error("Error: --issue and --commit options are required for sync-issue command");
          console.log("\nUsage: gng sync-issue --issue <number> --commit <sha>");
          Deno.exit(1);
        }
        await sync.syncIssueToCommit(commit, parseInt(issueNumber));
        break;
      }
        
      case "sync-recent": {
        const since = values.since || "HEAD~10";
        await sync.syncRecent(since);
        break;
      }
        
      default:
        console.error(`Error: Unknown command '${command}'`);
        console.log("\nRun 'gng help' for usage information");
        Deno.exit(1);
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}