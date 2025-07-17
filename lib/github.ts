export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
  };
}

export interface GitHubPullRequest extends GitHubIssue {
  head: {
    sha: string;
    ref: string;
  };
  base: {
    sha: string;
    ref: string;
  };
  merge_commit_sha: string | null;
  merged: boolean;
  merged_at: string | null;
}

export class GitHubClient {
  constructor(private owner: string, private repo: string) {}

  private async runGhCommand(args: string[]): Promise<any> {
    const cmd = new Deno.Command("gh", {
      args: ["api", ...args],
    });
    const output = await cmd.output();
    if (!output.success) {
      throw new Error(`GitHub API call failed: ${new TextDecoder().decode(output.stderr)}`);
    }
    return JSON.parse(new TextDecoder().decode(output.stdout));
  }

  async getIssues(state: "open" | "closed" | "all" = "all"): Promise<GitHubIssue[]> {
    return await this.runGhCommand([
      `repos/${this.owner}/${this.repo}/issues`,
      "-X", "GET",
      "-f", `state=${state}`,
      "--paginate"
    ]);
  }

  async getPullRequests(state: "open" | "closed" | "all" = "all"): Promise<GitHubPullRequest[]> {
    return await this.runGhCommand([
      `repos/${this.owner}/${this.repo}/pulls`,
      "-X", "GET",
      "-f", `state=${state}`,
      "--paginate"
    ]);
  }

  async getIssue(number: number): Promise<GitHubIssue> {
    return await this.runGhCommand([
      `repos/${this.owner}/${this.repo}/issues/${number}`
    ]);
  }

  async getPullRequest(number: number): Promise<GitHubPullRequest> {
    return await this.runGhCommand([
      `repos/${this.owner}/${this.repo}/pulls/${number}`
    ]);
  }

  async getPullRequestCommits(number: number): Promise<Array<{ sha: string; commit: { message: string } }>> {
    return await this.runGhCommand([
      `repos/${this.owner}/${this.repo}/pulls/${number}/commits`,
      "--paginate"
    ]);
  }

  async searchIssuesAndPRs(query: string): Promise<Array<GitHubIssue | GitHubPullRequest>> {
    const result = await this.runGhCommand([
      "search/issues",
      "-X", "GET",
      "-f", `q=${query} repo:${this.owner}/${this.repo}`,
      "--paginate"
    ]);
    return result.items || [];
  }
}