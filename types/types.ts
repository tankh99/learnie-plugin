
export type NoteMetadata = {
    id: string;
    link?: string // Should use formatRelativeLink for this
    questionsLink?: string
    reviewed?: boolean;
}