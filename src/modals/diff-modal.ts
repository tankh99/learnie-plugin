import { App, Component, Modal, TFile, WorkspaceLeaf } from "obsidian";
import { DIFF_VIEW_TYPE } from "src/views/markdown-view";

export class DiffModal extends Modal {
    private styleId = 'diff-modal-style';
    private component: Component;
    private leaf: WorkspaceLeaf;
    private file: TFile;

    constructor(app: App, leaf: WorkspaceLeaf, file: TFile) {
        super(app);
        this.leaf = leaf;
        this.file = file;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        this.app.workspace.getLeaf(true).setViewState({
            type: DIFF_VIEW_TYPE,
            state: {
                file: this.file
            }
        })
    }



    private createStyledDiff(diffText: string): string {
        const diffLines = diffText.split('\n');
        let result = '';

        diffLines.forEach(line => {

            if (line.startsWith('#')) {
                return; // Ignore title lines
            }
            if (line.startsWith('+')) {
                result += `<div class="diff-line diff-insert">${line}</div>`;
            } else if (line.startsWith('-')) {
                result += `<div class="diff-line diff-delete">${line}</div>`;
            } else {
                result += `<div class="diff-line">${line}</div>`;
            }
        });

        return result;
    }


    private addStyles() {
        const style = document.createElement('style');

        style.id = this.styleId;
        style.textContent = `
            .diff-insert {
                color: green;
            }
            .diff-delete {
                color: red;
            }
        `;
        document.head.appendChild(style);
    }


    private removeStyles() {
        const existingStyle = document.getElementById(this.styleId);
        if (existingStyle) {
            existingStyle.remove();
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        this.removeStyles();
    }
}