import { Modal, App, MarkdownRenderer, Component } from "obsidian";
import { DiffMarkdownView } from "src/views/markdown-view";

export class DiffModal extends Modal {
    private diffContent: string;
    private styleId = 'diff-modal-style';
    private component: Component;
    private srcPath: string;

    constructor(app: App, diffContent: string, srcPath: string, component: Component) {
        super(app);
        this.diffContent = diffContent;
        this.srcPath = srcPath;
        this.component = component
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        const mdView = new DiffMarkdownView(contentEl, this.diffContent, this.app, this.srcPath, this.component);
        mdView.onload();
        // contentEl.setText('');

        // const styledDiff = this.createStyledDiff(this.diffContent);
        // // const div = contentEl.createDiv({ cls: 'diff-container', });
        // // div.innerHTML = styledDiff;
        // // // this.render
        
        // this.renderMarkdown(styledDiff, contentEl, this.srcPath);
        // this.addStyles();
    }

    private renderMarkdown(markdown: string, container: HTMLElement, sourcePath: string) {
        const renderResult = MarkdownRenderer.render(this.app, markdown, container, sourcePath, this.component);
        console.log(renderResult);
        return renderResult;
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