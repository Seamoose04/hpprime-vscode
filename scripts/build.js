#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const FUNC_DEF_RE = /^\s*(\w+)\s*\([^)]*\)\s*\n\s*BEGIN\b/gim;
const FUNC_CALL_RE = /\b(\w+)\s*\(/g;
const INCLUDE_RE = /#include\s+"(.+?)"/g;

function parseFile(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    const includes = [];
    for (const m of text.matchAll(INCLUDE_RE)) includes.push(m[1]);
    const defs = new Set();
    for (const m of text.matchAll(FUNC_DEF_RE)) defs.add(m[1]);
    const calls = new Set();
    for (const m of text.matchAll(FUNC_CALL_RE)) {
        if (!defs.has(m[1])) calls.add(m[1]);
    }
    return { text, includes, defs, calls };
}

function resolveIncludes(entry, seen) {
    const blocks = [];
    if (seen.has(entry) || !fs.existsSync(entry)) return blocks;
    seen.add(entry);
    const { text, includes } = parseFile(entry);
    for (const inc of includes) {
        const resolved = path.resolve(path.dirname(entry), inc);
        blocks.push(...resolveIncludes(resolved, seen));
    }
    blocks.push({ path: entry, text });
    return blocks;
}

function buildDependencyGraph(files) {
    const defines = new Map();
    const callsInFile = new Map();
    for (const { path: p, text } of files) {
        const { defs, calls } = parseFile(p);
        callsInFile.set(p, calls);
        for (const d of defs) defines.set(d, p);
    }
    const graph = new Map();
    for (const { path: p } of files) {
        const calls = callsInFile.get(p) || new Set();
        for (const c of calls) {
            const dep = defines.get(c);
            if (dep && dep !== p) {
                if (!graph.has(p)) graph.set(p, new Set());
                graph.get(p).add(dep);
            }
        }
    }
    return graph;
}

function topoSort(files, graph) {
    const indegree = new Map();
    for (const { path: p } of files) indegree.set(p, 0);
    for (const deps of graph.values()) {
        for (const dep of deps) indegree.set(dep, (indegree.get(dep) || 0) + 1);
    }
    const queue = files.filter(f => indegree.get(f.path) === 0).map(f => f.path);
    const ordered = [];
    while (queue.length) {
        const p = queue.shift();
        const file = files.find(f => f.path === p);
        ordered.push(file);
        for (const neigh of graph.get(p) || []) {
            indegree.set(neigh, indegree.get(neigh) - 1);
            if (indegree.get(neigh) === 0) queue.push(neigh);
        }
    }
    if (ordered.length !== files.length) throw new Error('Cyclic dependency detected');
    return ordered;
}

function writeOutput(files, outPath) {
    const outDir = path.dirname(outPath);
    fs.mkdirSync(outDir, { recursive: true });
    const out = files.map(({ path: p, text }) => {
        const cleaned = text
            .split(/\r?\n/)
            .filter(l => !l.trim().startsWith('#include'))
            .join('\n')
            .trimEnd();
        return `// File: ${path.basename(p)}\n${cleaned}\n`;
    }).join('\n');
    fs.writeFileSync(outPath, out, 'utf8');
}

function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: build.js <entry.hpprgm> [output.hpprgm]');
        process.exit(1);
    }
    const entry = path.resolve(args[0]);
    const outFile = path.resolve(args[1] || 'combined.hpprgm');
    const blocks = resolveIncludes(entry, new Set());
    const seen = new Set();
    const unique = [];
    for (const b of blocks) {
        if (!seen.has(b.path)) {
            unique.push(b);
            seen.add(b.path);
        }
    }
    const graph = buildDependencyGraph(unique);
    const ordered = topoSort(unique, graph);
    writeOutput(ordered, outFile);
    console.log(`Built ${outFile}`);
}

if (require.main === module) {
    main();
}
