#!/usr/bin/env python3
import re
from pathlib import Path
from collections import defaultdict, deque

# Regex to match:
FUNC_DEF_RE = re.compile(r"^(\w+)\s*\(\)\s*\n\s*BEGIN\b", re.MULTILINE)
FUNC_CALL_RE = re.compile(r"\b(\w+)\s*\(")
INCLUDE_RE = re.compile(r'#include\s+"(.+?)"')

def parse_file(path: Path):
    """Extract includes, function definitions, and calls from a file"""
    text = path.read_text()
    includes = INCLUDE_RE.findall(text)
    defs = set(FUNC_DEF_RE.findall(text))
    calls = set(FUNC_CALL_RE.findall(text)) - defs
    return text, includes, defs, calls

def resolve_includes(entry: Path, seen: set[Path]):
    """Recursively resolve #includes"""
    if entry in seen or not entry.exists():
        return []
    seen.add(entry)

    text, includes, defs, calls = parse_file(entry)
    blocks = []

    for include in includes:
        include_path = entry.parent / include
        blocks.extend(resolve_includes(include_path, seen))

    blocks.append((entry, text))
    return blocks

def build_dependency_graph(files):
    """Builds dependency graph based on function calls"""
    defines = {}
    calls_in_file = {}

    for path, text in files:
        _, _, defs, calls = parse_file(path)
        calls_in_file[path] = calls
        for d in defs:
            defines[d] = path

    graph = defaultdict(set)
    for path, _ in files:
        for call in calls_in_file[path]:
            if call in defines and defines[call] != path:
                graph[path].add(defines[call])

    return graph

def topo_sort(files, graph):
    """Topologically sort files by dependency graph"""
    indegree = {f[0]: 0 for f in files}
    for deps in graph.values():
        for dep in deps:
            indegree[dep] += 1

    q = deque(f for f in files if indegree[f[0]] == 0)
    ordered = []

    while q:
        path, text = q.popleft()
        ordered.append((path, text))
        for neighbor in graph[path]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                text_n = next(t for (p, t) in files if p == neighbor)
                q.append((neighbor, text_n))

    if len(ordered) != len(files):
        raise Exception("🛑 Cyclic dependency detected")

    return ordered

def write_output(files, out_path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w') as out:
        for path, raw_text in files:
            cleaned_text = "\n".join(
                line for line in raw_text.splitlines()
                if not line.strip().startswith("#include")
            ).strip()

            out.write(f"// File: {path.name}\n")
            out.write(cleaned_text + "\n\n")
    print(f"✅ Wrote combined output to: {out_path}")


def build_project():
    workspace = Path.cwd()
    src_dir = workspace / "src"
    out_file = workspace / "dist" / "combined.hpprgm"

    if not src_dir.exists():
        print("🛑 Missing src/ directory.")
        return

    # 1. Collect all .hpprgm files (including includes)
    seen = set()
    blocks = []
    for file in sorted(src_dir.glob("*.hpprgm")):
        blocks.extend(resolve_includes(file, seen))

    # 2. Deduplicate based on file path
    seen_files = {}
    for p, t in blocks:
        if p not in seen_files:
            seen_files[p] = (p, t)
    files = list(seen_files.values())

    # 3. Build dependency graph
    graph = build_dependency_graph(files)

    # 4. Sort by dependency order
    sorted_files = topo_sort(files, graph)

    # 5. Write output
    write_output(sorted_files, out_file)

if __name__ == "__main__":
    build_project()