
export type NoteMetadata = {
    id: string;
    reviewLink?: string // Should use formatRelativeLink for this
    questionsLink?: string
    reviewed?: boolean;
}

export type NoteRevisionMetadata = {
    id: string;
    reviewed: boolean;
    noteLink: string;
}

export type QuestionAnswerPair = {
    question: string;
    answer: string;
}