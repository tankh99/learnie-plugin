import { Modal, App } from "obsidian";

export class DiffModal extends Modal {
    private diffContent: string;
    private styleId = 'diff-modal-style';

    constructor(app: App, diffContent: string) {
        super(app);
        this.diffContent = diffContent;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.setText('');

        const styledDiff = this.createStyledDiff(this.diffContent);
        const div = contentEl.createDiv({ cls: 'diff-container', });
        div.innerHTML = styledDiff;
        this.addStyles();
    }


    private createStyledDiff(diffText: string): string {
        const diffLines = diffText.split('\n');
        let result = '';

        diffLines.forEach(line => {
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
    .diff-container {
      font-family: var(--font-family-editor);
      white-space: pre-wrap;
      padding: 10px;
    }
    .diff-line {
      padding: 2px 0;
    }
    .diff-insert {
      color: var(--text-success);
    }
    .diff-delete {
      color: var(--text-error);
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