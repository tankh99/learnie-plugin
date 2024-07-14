import { App } from "obsidian";
import { convertPathToObsidianLink } from "./obsidian-utils";

// Replaces all MD Links with actual 
export function replaceAllMdLinks(content: string) {


    
}
export function transformLinks(app: App, markdown: string) {

    return markdown.replace(/\[\[([^\]]+)\]\]/g, (match, p1) => {
        return `<a href="${convertPathToObsidianLink(app, p1)}">${p1}</a>`;
    });
}
