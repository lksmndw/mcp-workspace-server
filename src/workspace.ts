import * as fs from 'node:fs';
import path from 'node:path';

export const MAX_BYTES = 1_000_000;
export class Workspace {
  readonly root: string;
  constructor(root: string) {
    fs.mkdirSync(root, { recursive: true });
    this.root = fs.realpathSync(root);
  }
  resolve(input: string): string {
    // Treat both separators consistently, including on a Linux host.
    if (!input || input.includes('\0') || input.includes(':') ||
        path.posix.isAbsolute(input) || path.win32.isAbsolute(input)) {
      throw new Error('Use a relative workspace path without drive letters.');
    }
    const normalized = input.replaceAll('\\', '/');
    // Avoid Windows special-device and trailing-dot aliases.
    for (const part of normalized.split('/')) {
      if (part !== '.' && part !== '..' &&
          (/[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) {
        throw new Error('Unsupported path component.');
      }
    }
    const target = path.resolve(this.root, normalized);
    const relative = path.relative(this.root, target);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error('Access outside the workspace is blocked.');
    }
    let current = this.root;
    for (const part of relative.split(path.sep).filter(Boolean)) {
      current = path.join(current, part);
      try {
        if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Symbolic links and junctions are blocked.');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
    return target;
  }
  name(absolute: string): string { return path.relative(this.root, absolute).split(path.sep).join('/'); }
  read(input: string): string {
    const file = this.resolve(input);
    const info = fs.statSync(file);
    if (!info.isFile()) throw new Error('Expected a regular file.');
    if (info.size > MAX_BYTES) throw new Error('File exceeds the 1 MB limit.');
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes('\0')) throw new Error('Only text files are supported.');
    return text;
  }
  write(input: string, text: string, overwrite = false) {
    if (Buffer.byteLength(text) > MAX_BYTES) throw new Error('Content exceeds the 1 MB limit.');
    const file = this.resolve(input);
    if (file === this.root) throw new Error('The workspace root is protected.');
    if (fs.existsSync(file) && !fs.statSync(file).isFile()) throw new Error('Expected a regular file.');
    fs.writeFileSync(file, text, { encoding: 'utf8', flag: overwrite ? 'w' : 'wx' });
  }
  list(input: string) {
    return fs.readdirSync(this.resolve(input), { withFileTypes: true }).map(entry => ({
      name: entry.name,
      type: entry.isSymbolicLink() ? 'blocked_link' : entry.isDirectory() ? 'directory' : 'file'
    }));
  }
  replace(input: string, oldText: string, newText: string) {
    if (!oldText) throw new Error('old_text cannot be empty.');
    const text = this.read(input);
    const first = text.indexOf(oldText);
    if (first < 0) throw new Error('Text was not found.');
    if (text.indexOf(oldText, first + 1) >= 0) throw new Error('Multiple matches; provide more specific old_text.');
    this.write(input, text.slice(0, first) + newText + text.slice(first + oldText.length), true);
  }
  delete(input: string) {
    const file = this.resolve(input);
    if (file === this.root) throw new Error('The workspace root is protected.');
    if (!fs.lstatSync(file).isFile()) throw new Error('Only regular files may be deleted.');
    fs.unlinkSync(file);
  }
  info(input: string) {
    const info = fs.statSync(this.resolve(input));
    return { path: input, type: info.isDirectory() ? 'directory' : 'file', size_bytes: info.size, modified: info.mtime.toISOString() };
  }
  files(input: string): string[] {
    const output: string[] = [];
    let visited = 0;
    const visit = (folder: string, depth: number) => {
      if (depth > 20) throw new Error('Search depth exceeds 20.');
      for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
        if (++visited > 2000) throw new Error('Search exceeds 2000 entries.');
        if (entry.isSymbolicLink()) continue;
        const file = this.resolve(this.name(path.join(folder, entry.name)));
        if (entry.isDirectory()) visit(file, depth + 1);
        else if (entry.isFile()) output.push(this.name(file));
      }
    };
    visit(this.resolve(input), 0);
    return output;
  }
  searchFiles(input: string, query: string) {
    const all = this.files(input).filter(file => path.posix.basename(file).toLowerCase().includes(query.toLowerCase()));
    return { matches: all.slice(0, 200), truncated: all.length > 200 };
  }
  searchText(input: string, query: string) {
    const matches: { path: string; line: number; text: string }[] = [];
    const skipped: string[] = [];
    for (const file of this.files(input)) {
      let text: string;
      try { text = this.read(file); } catch { skipped.push(file); continue; }
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].includes(query)) continue;
        if (matches.length === 200) return { matches, skipped, truncated: true };
        matches.push({ path: file, line: i + 1, text: lines[i].slice(0, 500) });
      }
    }
    return { matches, skipped, truncated: false };
  }
}

export function safeError(error: unknown): string {
  const code = (error as NodeJS.ErrnoException)?.code;
  const messages: Record<string, string> = {
    ENOENT: 'File or parent directory not found.', EEXIST: 'File already exists; use overwrite=true explicitly.',
    EACCES: 'File access denied.', EPERM: 'Operation not permitted.', ENOTDIR: 'Expected a directory.', EISDIR: 'Expected a file.'
  };
  if (code) return messages[code] || 'File operation failed.';
  return error instanceof Error ? error.message : 'Operation failed.';
}
