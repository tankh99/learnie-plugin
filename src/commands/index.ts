import { MarkdownView, Notice, Plugin } from 'obsidian';
import { QuestionAnswerModal } from 'src/modals/qna-modal';
import { readFrontmatter } from 'src/utils/file';
import { activateChangedNotesView, activateDiffView, activateQuestionsView } from 'src/views';
import { convertToNote, deleteAllUnusedNoteRevisionFiles as deleteAllUnusedGeneratedFiles } from '../utils/note';


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
        name: "Review Notes",
        callback: () => {
            activateChangedNotesView();
        }
    })

    plugin.addCommand({
        id: Commands.CONVERT_TO_NOTE,
        name: "Convert to note",
        callback: async () => {
            const file = await this.app.workspace.getActiveFile();
            if (!file) return new Notice("No file selected")
            // TODO: Check that the file is NOT already
            // 1. a note
            // 2. a file in the history folder
            convertToNote(plugin.app.vault, file)
        }
    })

    plugin.addCommand({
        id: Commands.SHOW_DIFF,
        name: "Show Diff View",
        callback: async () => {
            activateDiffView(false)
        }
    })

    plugin.addCommand({
        id: Commands.CREATE_QUESTION,
        name: "Create Question",
        callback: async () => {
            // selected text
            const editor = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
            if (!editor) return;
            const file = await plugin.app.workspace.getActiveFile();
            if (!file) return;

            const filecontent = await plugin.app.vault.read(file);
            const frnotmatter = readFrontmatter(filecontent);
            const noteId = frnotmatter["id"];

            const selectedText = editor.getSelection();

            new QuestionAnswerModal(plugin.app, noteId, selectedText).open()
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
        callback: async () => {
            const file = plugin.app.workspace.getActiveFile();
            if (!file) {
                new Notice("No file selected")
                return;
            }
            activateQuestionsView(true, file.path)
        }
    })

    plugin.addCommand({
        id: Commands.VIEW_NOTE_QUESTIONS,
        name: "View current note's questions",
        callback: async () => {
            const file = plugin.app.workspace.getActiveFile();
            if (!file) {
                new Notice("No file selected")
                return;
            }
            activateQuestionsView(true, file.path)
        }
    })

    plugin.addCommand({
        id: "test",
        name: "test",
        callback: async () => {
            
            // const leaf = await plugin.app.workspace.getLeaf(true)
            // await leaf.setViewState({ type: QUESTIONS_VIEW, active: true })
            // plugin.app.workspace.setActiveLeaf(leaf)
            // plugin.app.workspace.revealLeaf(leaf)
            // new QuestionAnswerModal(plugin.app,).open()
            // const file = plugin.app.workspace.getActiveFile();
            // if (!file) return
            // const content = await plugin.app.vault.read(file)
            // const frontmatter = readFrontmatter(content);
            // const noteId = frontmatter["id"]
            // console.log(frontmatter, noteId)
            // await addQuestion(noteId, "What is the capital of France?", "Paris")

            // const questionse = await getQuestions(noteId)
            // console.log("questions", questionse)
        }
    })

}
