import { MarkdownView, Notice, Plugin, moment } from 'obsidian';
import { QuestionAnswerModal } from 'src/modals/qna-modal';
import { activateChangedNotesView, activateDiffView, activateQuestionsView } from 'src/views';
import { convertToNote, deleteAllUnusedNoteRevisionFiles as deleteAllUnusedGeneratedFiles, isValidNotePath, readNoteId } from '../utils/note';
import { getLatestNoteRevision } from 'src/utils/noteRevisions';


export enum Commands {
    REVIEW = "review-notes",
    CONVERT_TO_NOTE = "convert-to-note",
    SHOW_DIFF = "show-diff",
    CREATE_QUESTION = "create-question",
    CLEAN_FILES = "clean-files",
    VIEW_QUESTIONS = "view-questions",
    VIEW_NOTE_QUESTIONS = "view-note-question",
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
                    new QuestionAnswerModal(plugin.app, noteId, selectedText).open()
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
            if (!checking) {
                activateQuestionsView(true, file.path)
            }
            return true;
        }
    })

}
