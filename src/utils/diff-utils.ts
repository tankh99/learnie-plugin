import * as diff from 'diff';
import { App } from 'obsidian';
import { transformLinks } from './md-utils';
import { marked } from 'marked';
import * as DOMPurify from 'dompurify';

// Purpose: diff.createPatch() returns a string indicating "\ no newline at end of file"
export function ensureNewline(content: string) {
    return content.endsWith('\n') ? content : content + '\n';
}

export async function getDiff(text1: string, text2: string) {
    const diffResult = diff.createPatch('filename', text1, text2);
    return diffResult
}

/**
 * Formats the diff content provided to id and tags each insertion/deletion with appropriate classes
 * All markdown content is formatted at the same time
 * Then we sanitise the html before returning
 * @param app 
 * @param content content, mix of HTML and markdown
 * @returns Sanitised html
 */
export async function formatDiffContent(app: App, content: string) {
    content = transformLinks(app, content);
    const diffLines = content.split('\n');
    let result = '';
    
    const indexTitle = diffLines[0].split(" ");
    // Example Format: Index: file name.md
    const fileName = indexTitle.slice(1, diffLines.length).join(" ");

    const title = fileName.split(".").slice(0, fileName.split(".").length - 1).join(".");

    result += `<h2>${title}</h2>`
    for (let line of diffLines) {
        // Ignore all metadata from diff and the id header
        if (line.trim().startsWith('#') 
            || line.trim().startsWith("@@") 
            || line.trim().startsWith('===')
            || line.trim().startsWith("Index:")
            || line.trim().startsWith("--")
            || line.trim().startsWith("++")){
            continue;
        }
        
        if (line.startsWith('+')) {
            line = line.slice(1, line.length)
            line = await marked(line);
            result += `<div class="diff-line diff-insert">${line}</div>`;
        } else if (line.startsWith('-')) {
            line = line.slice(1, line.length)
            line = await marked(line);
            result += `<div class="diff-line diff-delete">${line}</div>`;
        } else if (!line.startsWith('+') && !line.startsWith('-')) {
            line = await marked(line);
            result += `<div class="diff-line">${line}</div>`;
        }
    }

    const clean = DOMPurify.sanitize(result);
    return clean;
}