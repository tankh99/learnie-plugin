import {Editor, MarkdownView, Notice, Plugin} from 'obsidian'
import { convertToNote, deleteAllUnusedNoteRevisionFiles } from '../utils/note';
import { CHANGED_NOTES_VIEW_TYPE } from '../views/changed-notes-view';
import { readFrontmatter } from 'src/utils/file';
import { QuestionAnswerModal } from 'src/modals/qna-modal';
import { DIFF_VIEW_TYPE } from 'src/views/markdown-view';
import { QUESTIONS_VIEW } from 'src/views/qns-view';
import { deleteAllUnusedQuestionFiles, getQuestions } from 'src/utils/questions';
import { activateChangedNotesView } from 'src/views';

export function addCommands(plugin: Plugin) {
    plugin.addCommand({
        id: "review",
        name: "Review Notes",
        callback: () => {
            activateChangedNotesView();
        }
    })

    plugin.addCommand({
        id: "convert-to-note",
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
        id: "show-markdown",
        name: "Show Markdown",
        callback: async () => {
            // plugin.showMarkdownView();
            const leaf = plugin.app.workspace.getLeaf(true);
            await leaf.setViewState({ type: DIFF_VIEW_TYPE, active: true });
            plugin.app.workspace.setActiveLeaf(leaf);
        }
    })

    plugin.addCommand({
        id: "create-question",
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
        id: "clean-fils",
        name: "Clean up unused files",
        callback: async () => {
            await deleteAllUnusedQuestionFiles();
            await deleteAllUnusedNoteRevisionFiles();
        }
    })

    plugin.addCommand({
        id: "view-questions",
        name: "View questions",
        callback: async () => {
            const leaf = await plugin.app.workspace.getLeaf(true)
            await leaf.setViewState({ type: QUESTIONS_VIEW, active: true })
            plugin.app.workspace.setActiveLeaf(leaf)
        }
    })

    plugin.addCommand({
        id: "test",
        name: "test",
        callback: async () => {
            const leaf = await plugin.app.workspace.getLeaf(true)
            await leaf.setViewState({ type: QUESTIONS_VIEW, active: true })
            plugin.app.workspace.setActiveLeaf(leaf)
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
