import { createNewFile, getUniqueFileName } from "src/utils/file";
import { activateChangedNotesView } from "../views";
import { Plugin } from "obsidian";
import { convertToNote } from "src/utils/note";

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

}