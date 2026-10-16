# Tool reference

All paths are relative to the workspace. `.` refers to its root. Absolute paths, Windows drive paths, traversal outside the root, and symlinks/junctions are blocked. Backslashes are normalized. Parent directories must already exist. Tool errors use `isError: true`; they should not be treated as successful output.

| Tool | Input fields | Behavior |
|---|---|---|
| list_files | path (default `.`) | Immediate children; links labeled blocked_link |
| read_file | path | Text content up to 1 MB |
| write_file | path, content, overwrite (default false) | Exclusive create or explicit overwrite |
| str_replace | path, old_text, new_text | Exactly one literal match; otherwise fail |
| delete_file | path | Individual regular files only |
| search_files | path (default `.`), query | Recursive case-insensitive filename substring |
| search_text | path (default `.`), query | Recursive case-sensitive literal text with 1-based lines |
| file_info | path | Type, byte size and UTC modification time |

## Inspector exercise (in order)

1. list_files: `{"path":"."}`
2. write_file: `{"path":"demo/test.txt","content":"Hello MCP","overwrite":false}`
3. read_file: `{"path":"demo/test.txt"}`
4. str_replace: `{"path":"demo/test.txt","old_text":"Hello MCP","new_text":"Hello Claude"}`
5. search_files: `{"path":"demo","query":"test"}`
6. search_text: `{"path":"demo","query":"Claude"}`
7. file_info: `{"path":"demo/test.txt"}`
8. delete_file: `{"path":"demo/test.txt"}`

## Negative cases

- read_file `../package.json`: rejected.
- write_file `../outside.txt`: rejected; no outside file should appear.
- delete_file `.`: rejected.
- delete_file `demo`: rejected.
- Existing write without overwrite: rejected without changing contents.
- Missing or multiple old_text matches: rejected without changing contents.
- Missing inputs: SDK schema validation error.

## Limits

1,000,000 bytes per text file; maximum path length 500 characters; query length 200. Search visits at most 2000 entries and depth 20. Filename/text results cap at 200 and report truncation. Text search skips unreadable, oversized or NUL-containing files and reports skipped paths. It truncates displayed matching lines to 500 characters. Symlinks are skipped during recursive search. The tools are not suitable for large or binary repositories.

Tool summaries in PM2 logs record timestamp, name and success only. They deliberately do not record contents.
