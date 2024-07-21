import { Plugin, TFile } from "obsidian";
import { CHANGED_NOTES_VIEW_TYPE, ChangedNotesView } from "./changed-notes-view";
import { DIFF_VIEW_TYPE, DiffMarkdownView } from "./markdown-view";
import { QUESTIONS_VIEW, QuestionsView } from "./qns-view";
import { Commands } from "src/commands";

export async function activateChangedNotesView(newLeaf = false) {
    const leaf = this.app.workspace.getLeaf(newLeaf);
    await leaf.setViewState({ type: CHANGED_NOTES_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
}

export async function activateQuestionsView(newLeaf = false) {
    const leaf = this.app.workspace.getLeaf(newLeaf);
    await leaf.setViewState({ type: QUESTIONS_VIEW, active: true });
    this.app.workspace.revealLeaf(leaf);
}

export async function activateDiffView(newLeaf = false, file?: TFile) {
    const leaf = this.app.workspace.getLeaf(newLeaf);
    await leaf.setViewState({
        type: DIFF_VIEW_TYPE, state: {
            file: file
        }, active: true
    });
    this.app.workspace.revealLeaf(leaf);
}



export function registerViews(plugin: Plugin) {
    plugin.registerView(CHANGED_NOTES_VIEW_TYPE, (leaf) => new ChangedNotesView(leaf));
    plugin.registerView(QUESTIONS_VIEW, (leaf) => new QuestionsView(leaf));
    plugin.registerView(DIFF_VIEW_TYPE, (leaf) => new DiffMarkdownView(leaf));
    

    // TODO: Convert these handler strings into global constants
    plugin.registerObsidianProtocolHandler(Commands.VIEW_QUESTIONS, (params) => {
        activateQuestionsView(true);
    })

    plugin.registerObsidianProtocolHandler(Commands.SHOW_DIFF, async (params) => {
        activateDiffView(true);
    })