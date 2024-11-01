import { createNewFile, getUniqueFileName } from "src/utils/file";
import { activateChangedNotesView, activateQuestionsView } from "../views";
import { Plugin } from "obsidian";
import { convertToNote } from "src/utils/note";
import { getAllTags } from "src/utils/tags";
import { QuizModal } from "src/modals/quiz-modal";

export function registerRibbonIcons(plugin: Plugin) {
    plugin.addRibbonIcon('book', 'Review notes', async () => {
        activateChangedNotesView();
    })

    plugin.addRibbonIcon('plus', 'Create Learnie note', async () => {
        const fileName = await getUniqueFileName("New note", "md")
        const file = await createNewFile(plugin.app.vault, "", fileName, "");
        if (!file) return;
        await convertToNote(plugin.app.vault, file);
        const leaf = plugin.app.workspace.getLeaf();
        leaf.openFile(file);
    })

    plugin.addRibbonIcon('library', 'View all questions', async () => {
        activateQuestionsView(true, "")
    })
    
    plugin.addRibbonIcon("badge-help", "Start quiz", async () => {
        const tags = getAllTags()
        new QuizModal(plugin.app, tags).open()
    })

}