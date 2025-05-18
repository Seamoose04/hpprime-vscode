"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHPProgram = buildHPProgram;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const parser_1 = require("../../shared/parser");
function buildHPProgram(entryFile) {
    const seen = new Set();
    const output = [];
    function visit(file) {
        const realPath = fs.realpathSync(file);
        if (seen.has(realPath))
            return;
        seen.add(realPath);
        const source = fs.readFileSync(realPath, 'utf8');
        const { includes } = (0, parser_1.parseAST)(source);
        for (const inc of includes) {
            const resolved = path.resolve(path.dirname(realPath), inc);
            visit(resolved);
        }
        // 🔥 Strip #include lines but preserve original line breaks
        const cleanedSource = source
            .split(/\r?\n/) // split by actual lines
            .filter(line => !line.trim().toLowerCase().startsWith('#include'))
            .join('\n'); // re-join with actual newlines
        output.push(`// ----- ${path.basename(realPath)} -----`);
        output.push(cleanedSource.trimEnd());
        output.push(''); // separator newline
    }
    visit(entryFile);
    return output.join('\n');
}
