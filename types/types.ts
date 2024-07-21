
export type NoteMetadata = {
    id: string;
    reviewLink?: string // Should use formatRelativeLink for this
    questionsLink?: string
    reviewed?: boolean;
}