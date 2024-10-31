

export function getAllTags(): Set<string> {
    // In the format of {"#ai": 1}, where the value represents the nubmer of tag instances
    const tags: Record<string, number> = this.app.metadataCache.getTags()
    const tagStrings = new Set<string>()
    for (const key of Object.keys(tags)) {
        tagStrings.add(key)
    }
    return tagStrings
}