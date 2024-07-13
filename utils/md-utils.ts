
export function convertPathToObsidianLink(path: string) {
    return `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(path)}`
}

// Replaces all MD Links with actual 
export function replaceAllMdLinks(content: string) {

}