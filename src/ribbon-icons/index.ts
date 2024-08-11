import { activateChangedNotesView } from "../views";
import { Plugin } from "obsidian";

export function registerRibbonIcons(plugin: Plugin) {
    plugin.addRibbonIcon('book', 'Review notes', async () => {
        activateChangedNotesView();
    })
}