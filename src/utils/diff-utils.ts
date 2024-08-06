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
 * Process: html -> format classes -> remove noise characters -> sanitise
 * @param app 
 * @param content HTML content only. (Any markdown should be convert to HTML prior)
 * @returns Sanitised html
 */
export async function formatDiffContent(app: App, content: string) {
    content = transformLinks(app, content);
    const lines = content.split("\n")
    const diffStartIndex = lines.findIndex(line => line.startsWith('@@')) + 5;

    content = lines.slice(diffStartIndex).join("\n");
    const parser = new DOMParser()
    const indexTitle = lines[0].split(" ");
    // Example Format: Index: file name.md
    const fileName = indexTitle.slice(1).join(" ");

    const title = fileName.split(".").slice(0, fileName.split(".").length - 1).join(".");

    // WE add content like this instead of using html.prepend because otherwise, we'd see stray "+" and "-" characters
    content = `<h2>${title}</h2>\n${content}`
    const doc = parser.parseFromString(content, "text/html");

    function processNode(node: Node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            Array.from(element.childNodes).forEach(processNode);

            // Check if this element or its first child text node starts with '+' or '-'
            const firstTextNode = Array.from(element.childNodes).find(
                child => child.nodeType === Node.TEXT_NODE && child.textContent?.trim()
            ) as Text | undefined;

            if (firstTextNode) {
                const text = firstTextNode.textContent || '';
                if (text.trim().startsWith('+') || text.trim().startsWith('-')) {
                    const className = text.trim().startsWith('+') 
                        ? 'diff-insert' 
                        : text.startsWith('-')
                            ? 'diff-delete'
                            : ''
                    element.setAttribute('class', (element.getAttribute('class') || '') + ' ' + className);
                }
            }
        }
    }

    processNode(doc.body);

    
    const newHtml = doc.body.innerHTML.replace(/^[+-]/gm, '')
    const clean = DOMPurify.sanitize(newHtml);
    return clean;
}