import { GitNotesGitHubSync } from "./lib/sync.ts";

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
  const args = Deno.args;
  const command = args[0] || "sync";
  
  try {
    const { owner, repo } = await getRepoInfo();
    console.log(`Repository: ${owner}/${repo}`);
    
    const sync = new GitNotesGitHubSync({
      owner,
      repo,
      dryRun: args.includes("--dry-run"),
    });
    
    switch (command) {
      case "sync":
        await sync.syncAll();
        break;
        
      case "sync-pr":
        const prNumber = parseInt(args[1]);
        if (!prNumber) {
          console.error("Usage: deno task sync sync-pr <pr-number>");
          Deno.exit(1);
        }
        await sync.syncPullRequestToCommits(prNumber);
        break;
        
      case "sync-issue":
        const issueNumber = parseInt(args[1]);
        const commit = args[2];
        if (!issueNumber || !commit) {
          console.error("Usage: deno task sync sync-issue <issue-number> <commit>");
          Deno.exit(1);
        }
        await sync.syncIssueToCommit(commit, issueNumber);
        break;
        
      case "sync-recent":
        const since = args[1] || "HEAD~10";
        await sync.syncRecent(since);
        break;
        
      default:
        console.log(`
Usage:
  deno task sync [command] [options]

Commands:
  sync              - Sync all PRs and issues
  sync-pr <number>  - Sync a specific PR
  sync-issue <number> <commit> - Sync an issue to a commit
  sync-recent [since] - Sync recent commits (default: HEAD~10)

Options:
  --dry-run         - Show what would be done without making changes
`);
    }
  } catch (error) {
    console.error("Error:", error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}