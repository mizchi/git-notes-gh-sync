import { GitClient } from "./git.ts";
import { GitHubClient, GitHubIssue, GitHubPullRequest } from "./github.ts";

export interface SyncOptions {
  owner: string;
  repo: string;
  issueRef?: string;
  pullRef?: string;
  dryRun?: boolean;
}

export class GitNotesGitHubSync {
  private git: GitClient;
  private github: GitHubClient;
  private issueRef: string;
  private pullRef: string;
  private dryRun: boolean;

  constructor(options: SyncOptions) {
    this.git = new GitClient();
    this.github = new GitHubClient(options.owner, options.repo);
    this.issueRef = options.issueRef || "github/issues";
    this.pullRef = options.pullRef || "github/pulls";
    this.dryRun = options.dryRun || false;
  }

  private formatIssueNote(issue: GitHubIssue): string {
    return JSON.stringify({
      type: "issue",
      number: issue.number,
      title: issue.title,
      state: issue.state,
      author: issue.user.login,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      url: issue.html_url,
      body: issue.body,
    }, null, 2);
  }

  private formatPullRequestNote(pr: GitHubPullRequest): string {
    return JSON.stringify({
      type: "pull_request",
      number: pr.number,
      title: pr.title,
      state: pr.state,
      author: pr.user.login,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      merged: pr.merged,
      merged_at: pr.merged_at,
      url: pr.html_url,
      head_sha: pr.head.sha,
      base_sha: pr.base.sha,
      merge_commit_sha: pr.merge_commit_sha,
      body: pr.body,
    }, null, 2);
  }

  private extractIssueReferences(message: string): number[] {
    const patterns = [
      /#(\d+)/g,
      /fixes\s+#(\d+)/gi,
      /closes\s+#(\d+)/gi,
      /resolves\s+#(\d+)/gi,
    ];
    
    const numbers = new Set<number>();
    for (const pattern of patterns) {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        numbers.add(parseInt(match[1]));
      }
    }
    
    return Array.from(numbers);
  }

  async syncIssueToCommit(commit: string, issueNumber: number): Promise<void> {
    console.log(`Syncing issue #${issueNumber} to commit ${commit.substring(0, 7)}`);
    
    const issue = await this.github.getIssue(issueNumber);
    const note = this.formatIssueNote(issue);
    
    if (this.dryRun) {
      console.log(`[DRY RUN] Would add note to ${commit}:\n${note}`);
      return;
    }
    
    await this.git.addNote(commit, note, this.issueRef);
  }

  async syncPullRequestToCommits(prNumber: number): Promise<void> {
    console.log(`Syncing PR #${prNumber}`);
    
    const pr = await this.github.getPullRequest(prNumber);
    const prNote = this.formatPullRequestNote(pr);
    
    // Get all commits in the PR
    const commits = await this.github.getPullRequestCommits(prNumber);
    
    for (const commit of commits) {
      console.log(`  Adding PR note to commit ${commit.sha.substring(0, 7)}`);
      
      if (this.dryRun) {
        console.log(`[DRY RUN] Would add PR note to ${commit.sha}`);
        continue;
      }
      
      await this.git.addNote(commit.sha, prNote, this.pullRef);
      
      // Also sync any issues referenced in the commit message
      const issueNumbers = this.extractIssueReferences(commit.commit.message);
      for (const issueNumber of issueNumbers) {
        await this.syncIssueToCommit(commit.sha, issueNumber);
      }
    }
    
    // If PR is merged, also add note to merge commit
    if (pr.merged && pr.merge_commit_sha) {
      console.log(`  Adding PR note to merge commit ${pr.merge_commit_sha.substring(0, 7)}`);
      if (!this.dryRun) {
        await this.git.addNote(pr.merge_commit_sha, prNote, this.pullRef);
      }
    }
  }

  async syncAll(): Promise<void> {
    console.log("Starting full sync...");
    
    // Sync all pull requests
    const prs = await this.github.getPullRequests("all");
    console.log(`Found ${prs.length} pull requests`);
    
    for (const pr of prs) {
      await this.syncPullRequestToCommits(pr.number);
    }
    
    console.log("Sync completed!");
  }

  async syncRecent(since: string): Promise<void> {
    console.log(`Syncing commits since ${since}`);
    
    const commits = await this.git.getCommitsBetween(since);
    console.log(`Found ${commits.length} new commits`);
    
    for (const commit of commits) {
      const message = await this.git.getCommitMessage(commit);
      const issueNumbers = this.extractIssueReferences(message);
      
      for (const issueNumber of issueNumbers) {
        await this.syncIssueToCommit(commit, issueNumber);
      }
    }
  }
}