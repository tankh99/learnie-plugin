import { sanitize } from 'dompurify';
import * as diff from 'diff';
import { transformLinks } from './md-utils';
import { marked } from 'marked';

// Purpose: diff.createPatch() returns a string indicating "\ no newline at end of file"
export function ensureNewline(content: string) {
    return content.endsWith('\n') ? content : content + '\n';
}

export async function getDiff(text1: string, text2: string) {
    const diffResult = diff.createPatch('filename', text1, text2);
    return diffResult
}

/**
 * We iterate through the list of changes here and add classes to it depending on whether it is 
 * newly-added or deleted.
 * Process: html -> format classes -> remove noise characters -> sanitise
 * @param changes diff.Change array that contains all changes made. 
 * @returns Sanitised html
 */
export async function formatDiffContent(changes: diff.Change[]) {

    const htmlChanges = [];
    const parser = new DOMParser()

    for (const change of changes) {
        if (!change.value.trim()) continue;
        const content = transformLinks(change.value);
        const md = await marked(content);

        const htmlDoc = parser.parseFromString(md, "text/html");

        // Add classes to child elements instead of the body
        htmlDoc.body.querySelectorAll('*').forEach(element => {
            if (change.added) {
                element.classList.add("diff-insert");
            } else if (change.removed) {
                element.classList.add("diff-delete");
            }
        });

        htmlChanges.push(htmlDoc.body.innerHTML);
    }

    let finalHtmlString = "";
    for (const htmlChange of htmlChanges) {
        if (!htmlChange) {
            finalHtmlString += "<br>"
        } else {
            finalHtmlString += sanitize(await marked(htmlChange))
        }
    }
    return finalHtmlString
}