import { App } from "obsidian";

export function convertPathToObsidianLink(app: App, path: string) {
    const vaultName = app.vault.getName()
    return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(path)}`
}

// Replaces all MD Links with actual 
export function replaceAllMdLinks(content: string) {


    
}
export function transformLinks(app: App, markdown: string) {

    return markdown.replace(/\[\[([^\]]+)\]\]/g, (match, p1) => {
        return `<a href="${convertPathToObsidianLink(app, p1)}">${p1}</a>`;
    });
}
