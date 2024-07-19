import * as diff from 'diff';
import { App } from 'obsidian';
import { transformLinks } from './md-utils';

// Purpose: diff.createPatch() returns a string indicating "\ no newline at end of file"
export function ensureNewline(content: string) {
    return content.endsWith('\n') ? content : content + '\n';
}

export async function getDiff(text1: string, text2: string) {
    const diffResult = diff.createPatch('filename', text1, text2);
    return diffResult
}

export function formatDiffContent(app: App, content: string) {
    content = transformLinks(app, content);
    const diffLines = content.split('\n');
    let result = '';
    
    const indexTitle = diffLines[0].split(" ");
    // Example Format: Index: file name.md
    const fileName = indexTitle.slice(1, diffLines.length).join(" ");

    const title = fileName.split(".").slice(0, fileName.split(".").length - 1).join(".");

    result += `<h2>${title}</h2>`
    diffLines.forEach(line => {
        // Ignore all metadata from diff and the id header
        if (line.trim().startsWith('#') 
            || line.trim().startsWith("@@") 
            || line.trim().startsWith('===')
            || line.trim().startsWith("Index:")
            || line.trim().startsWith("--")
            || line.trim().startsWith("++")){
            return; // Ignore title lines
        }

        if (line.startsWith('+')) {
            line = line.slice(1, line.length)
            result += `<p class="diff-line diff-insert">${line}</p>`;
        } else if (line.startsWith('-')) {
            line = line.slice(1, line.length)
            result += `<div class="diff-line diff-delete">${line}</div>`;
        } else if (!line.startsWith('+') && !line.startsWith('-')) {
            result += `<div class="diff-line">${line}</div>`;

        }
    });

    return result;
}