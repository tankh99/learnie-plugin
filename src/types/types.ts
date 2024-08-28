
export type NoteMetadata = {
    id: string;
    reviewLink?: string // Should use formatRelativeLink for this
    questionsLink?: string
    tags?: string[];

}

export type NoteRevisionMetadata = {
    id: string;
    reviewed?: boolean;
    lastReviewed?: Date;
    noteLink: string;
    // lastModified: string; // Date format: 6th Aug 2024, 6:30pm
}

export type QuestionAnswerPair = {
    question: string;
    answer: string;
    lastSeen?: Date;
    categories: string[]
}

export type LearnieSettings = {
	enableNotification: boolean;
	notificationTime: string;
    numQuizQuestions: number;
};
