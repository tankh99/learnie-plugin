import { App, Component, MarkdownRenderer } from "obsidian";
import { convertPathToObsidianLink } from "./obsidian-utils";

export async function renderMarkdown(markdown: string, srcPath: string, component: Component) {
    // return marked(markdown, {renderer: getMdRenderer()});
    const temp = document.createElement("div");
    await MarkdownRenderer.render(this.app, markdown, temp, srcPath, component)
    return temp.innerHTML
}

/**
 * DEPRECATED
 * @param markdown 
 * @returns 
 */
export function transformLinks(markdown: string) {
    return markdown;
}
