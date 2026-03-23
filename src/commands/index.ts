import { MarkdownView, Notice, Plugin } from 'obsidian';
import { CreateQuestionAnswerModal } from 'src/modals/create-qna-modal';
import { activateChangedNotesView, activateDiffView, activateQuestionsView } from 'src/views';
import { convertToNote, deleteAllUnusedNoteRevisionFiles as deleteAllUnusedGeneratedFiles, isValidNotePath, readNoteId } from '../utils/note';
import { getLatestNoteRevision, migrateNoteRevisions } from 'src/utils/noteRevisions';
import { UpdateQuestionAnswerModal } from 'src/modals/update-qna-modal';
import { readFrontmatter } from 'src/utils/file';
import { addQuestion, getQuestionFile, migrateQuestions } from 'src/utils/questions';
import { aiService } from 'src/utils/ai';

export enum Commands {
    REVIEW = "review-notes",
    CONVERT_TO_NOTE = "convert-to-note",
    SHOW_DIFF = "show-diff",
    CREATE_QUESTION = "create-question",
    CLEAN_FILES = "clean-files",
    VIEW_QUESTIONS = "view-questions",
    VIEW_NOTE_QUESTIONS = "view-note-question",
    UPDATE_QUESTIONS = "update-questions",
    MIGRATE_NOTE_REVISIONS = "migrate-note-revisions",
    GENERATE_QUESTIONS_AI = "generate-questions-ai",
    TEST = "test"

}

export function addCommands(plugin: Plugin) {
    plugin.addCommand({
        id: Commands.REVIEW,
        name: "Review notes",
        callback: () => {
            activateChangedNotesView();
        }
    })

    plugin.addCommand({
        id: Commands.CONVERT_TO_NOTE,
        name: "Convert to note",
        checkCallback: (checking) => {
            const file = this.app.workspace.getActiveFile();
            if (!file) return false;
            const validNotePath = isValidNotePath(file.path);
            if (!validNotePath) return false;

            if (!checking) {
                convertToNote(plugin.app.vault, file)
            }
            return true;
        }
    })

    plugin.addCommand({
        id: Commands.SHOW_DIFF,
        name: "Show diff view",
        checkCallback: (checking) => {
            const file = plugin.app.workspace.getActiveFile();
            if (!file) return false;

            if (!checking) {
                readNoteId(plugin.app.vault, file)
                .then((noteId) => {
                    if (!noteId) return false;
                    getLatestNoteRevision(plugin.app.vault, noteId)
                    .then((latestNoteRevision) => {
                        if (!latestNoteRevision) return false;
                        activateDiffView(true, file)
                        return true;
                    })
                })
            }
            return true;
        }
    })

    plugin.addCommand({
        id: Commands.CREATE_QUESTION,
        name: "Create question",
        checkCallback: (checking) => {
            const editor = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
            const file = plugin.app.workspace.getActiveFile();

            if (!editor || !file) return false;
            if (!checking) {
                readNoteId(plugin.app.vault, file)
                .then((noteId) => {
                    if (!noteId) return false;
                    const selectedText = editor.getSelection();
                    new CreateQuestionAnswerModal(plugin.app, noteId, selectedText).open()
                });
            }
            return true;
        }
    })

    plugin.addCommand({
        id: Commands.CLEAN_FILES,
        name: "Clean up unused files",
        callback: async () => {
            // await deleteAllUnusedQuestionFiles();
            await deleteAllUnusedGeneratedFiles();
        }
    })

    plugin.addCommand({
        id: Commands.VIEW_QUESTIONS,
        name: "View questions",
        checkCallback: (checking) => {
            const file = plugin.app.workspace.getActiveFile();
            if (!file) return false;

            const noteId = readFrontmatter(file)?.id;
            if (!noteId) return false;

            getQuestionFile(noteId)
            .then(questionFile => {
                if (!checking) {      
                    activateQuestionsView(true, questionFile.path)
                }
            })
            return true;
        }
    })

    plugin.addCommand({
        id: Commands.UPDATE_QUESTIONS,
        name: "Update questions",
        checkCallback: (checking) => {
            const file = this.app.workspace.getActiveFile();
            if (!file) return false;
            
            const noteId = readFrontmatter(file)?.id;
            if (!noteId) return false;

            if (!checking) {
                new UpdateQuestionAnswerModal(this.app, noteId).open();
            }
            return true;
        }
    })

    plugin.addCommand({
        id: Commands.MIGRATE_NOTE_REVISIONS,
        name: "Migrate Legacy Note Revisions",
        callback: async () => {
            await migrateNoteRevisions()
        }
    })

    plugin.addCommand({
        id: Commands.GENERATE_QUESTIONS_AI,
        name: "Generate Quiz Questions with Local AI",
        checkCallback: (checking) => {
            const file = plugin.app.workspace.getActiveFile();
            if (!file) return false;
            
            const validNotePath = isValidNotePath(file.path);
            if (!validNotePath) return false;

            if (!checking) {
                if (!aiService.isReady()) {
                    new Notice("Please initialize the AI Engine in settings first.");
                    return true;
                }

                readNoteId(plugin.app.vault, file).then(async (noteId) => {
                    if (!noteId) {
                        new Notice("Could not find note ID.");
                        return;
                    }

                    new Notice("Generating questions with Local AI...");
                    try {
                        const content = await plugin.app.vault.read(file);
                        const questions = await aiService.generateQuestions(content);
                        
                        if (questions.length === 0) {
                            new Notice("AI did not generate any questions.");
                            return;
                        }

                        for (const q of questions) {
                            await addQuestion(noteId, file, q.question, q.answer);
                        }
                        
                        new Notice(`Successfully generated and added ${questions.length} questions!`);
                    } catch (error) {
                        console.error("Failed to generate questions:", error);
                        new Notice("Failed to generate questions. Check console for details.");
                    }
                });
            }
            return true;
        }
    })

    // plugin.addCommand({
    //     id: Commands.TEST,
    //     name: "test",
    //     callback: async () => {
    //         const formatted = formatDate(new Date())
    //         // console.log(formatted, moment(formatted).toDate())
    //         // console.log(moment().startOf("d").toDate(), moment().startOf("d").toDate())
    //         // console.log(moment("2024-08-26T07:19:05.805Z").toDate())
    //         // console.log(moment("2024-08-25T16:00:00.000Z").toDate())
    //         // console.log(moment("2024-08-26T14:50:21.454Z").toDate())
    //         // console.log(new Date().toString(), moment().toDate());
    //         const questions = await getAllQuestions();
            
    //         const qns = selectRandomWeightedQuestions(questions, 10)
    //         console.log(moment(qns[0].lastSeen).toDate())
    //     }
    // })

    /**
     * Migrates notes that use the old data format (storing isReviewed) to use the new data format (reviewedDate)
     */
    plugin.addCommand({
        id: "migrate-questions",
        name: "Migrate Questions",
        callback: async () => {
            await migrateQuestions()
        }
    })
}
