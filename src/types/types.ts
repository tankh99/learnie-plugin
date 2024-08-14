
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
    // lastModified: string; // Date format: 6th Aug 2024, 6:30pm
}

export type QuestionAnswerPair = {
    question: string;
    answer: string;
}

export type LearnieSettings = {
	enableNotification: boolean;
	notificationTime: string;
    numQuizQuestions: number;
};
