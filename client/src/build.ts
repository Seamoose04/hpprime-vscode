 import * as fs from 'fs';
import * as path from 'path';
import { parseAST } from '../../shared/parser';

export function buildHPProgram(entryFile: string): string {
    const seen = new Set<string>();
    const output: string[] = [];

    function visit(file: string) {
        const realPath = fs.realpathSync(file);
        if (seen.has(realPath)) return;
        seen.add(realPath);
    
        const source = fs.readFileSync(realPath, 'utf8');
        const { includes } = parseAST(source);
    
        for (const inc of includes) {
            const resolved = path.resolve(path.dirname(realPath), inc);
            visit(resolved);
        }
    
        // 🔥 Strip #include lines but preserve original line breaks
        const cleanedSource = source
            .split(/\r?\n/)  // split by actual lines
            .filter(line => !line.trim().toLowerCase().startsWith('#include'))
            .join('\n')      // re-join with actual newlines
    
        output.push(`// ----- ${path.basename(realPath)} -----`);
        output.push(cleanedSource.trimEnd());
        output.push(''); // separator newline
    }    

    visit(entryFile);
    return output.join('\n');
}