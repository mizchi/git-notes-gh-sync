export interface GitNote {
  commit: string;
  ref: string;
  content: string;
}

export class GitClient {
  constructor(private cwd: string = Deno.cwd()) {}

  async addNote(commit: string, content: string, ref = "commits"): Promise<void> {
    const cmd = new Deno.Command("git", {
      args: ["notes", "--ref", ref, "add", "-f", "-m", content, commit],
      cwd: this.cwd,
    });
    const output = await cmd.output();
    if (!output.success) {
      throw new Error(`Failed to add note: ${new TextDecoder().decode(output.stderr)}`);
    }
  }

  async getNote(commit: string, ref = "commits"): Promise<string | null> {
    const cmd = new Deno.Command("git", {
      args: ["notes", "--ref", ref, "show", commit],
      cwd: this.cwd,
    });
    const output = await cmd.output();
    if (!output.success) {
      return null;
    }
    return new TextDecoder().decode(output.stdout).trim();
  }

  async listNotes(ref = "commits"): Promise<GitNote[]> {
    const cmd = new Deno.Command("git", {
      args: ["notes", "--ref", ref, "list"],
      cwd: this.cwd,
    });
    const output = await cmd.output();
    if (!output.success) {
      return [];
    }
    
    const lines = new TextDecoder().decode(output.stdout).trim().split("\n").filter(Boolean);
    const notes: GitNote[] = [];
    
    for (const line of lines) {
      const [noteObject, commit] = line.split(/\s+/);
      if (commit) {
        const content = await this.getNote(commit, ref);
        if (content) {
          notes.push({ commit, ref, content });
        }
      }
    }
    
    return notes;
  }

  async getCommitsBetween(from: string, to = "HEAD"): Promise<string[]> {
    const cmd = new Deno.Command("git", {
      args: ["rev-list", "--reverse", `${from}..${to}`],
      cwd: this.cwd,
    });
    const output = await cmd.output();
    if (!output.success) {
      return [];
    }
    return new TextDecoder().decode(output.stdout).trim().split("\n").filter(Boolean);
  }

  async getCommitMessage(commit: string): Promise<string> {
    const cmd = new Deno.Command("git", {
      args: ["log", "-1", "--format=%s", commit],
      cwd: this.cwd,
    });
    const output = await cmd.output();
    if (!output.success) {
      throw new Error(`Failed to get commit message: ${new TextDecoder().decode(output.stderr)}`);
    }
    return new TextDecoder().decode(output.stdout).trim();
  }
}