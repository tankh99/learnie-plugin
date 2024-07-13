import * as diff from 'diff';


export async function getDiff(text1: string, text2: string) {
    const diffResult = diff.createPatch('filename', text1, text2);
    return diffResult
}

export function formatDiffContent(content: string) {
    const diffLines = content.split('\n');
    let result = '';

    diffLines.forEach(line => {
        if (line.startsWith('#')) {
            return; // Ignore title lines
        }
        if (line.startsWith('+')) {
            result += `<div class="diff-line diff-insert">${line}</div>`;
        } else if (line.startsWith('-')) {
            result += `<div class="diff-line diff-delete">${line}</div>`;
        } else {
            result += `<div class="diff-line">${line}</div>`;
        }
    });

    return result;
}