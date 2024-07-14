import { App } from "obsidian"

export function formatLink(path: string, label: string) {
    const link = convertPathToObsidianLink(this.app, path)
    return `[${label}](${link})`
}

/**
 * @param path Accepts a relative file path
 * @param label Custom label for link
 * @returns 
 */
export function formatRelativeLink(path: string, label: string) {

    return `[[${path}|${label}]]`
}

export function convertPathToObsidianLink(app: App, path: string) {
    const vaultName = app.vault.getName();
    return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(path)}`;
}
