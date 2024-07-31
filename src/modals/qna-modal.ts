import { Modal, App, Setting, Notice } from "obsidian";
import { addQuestion } from "src/utils/questions";

export class QuestionAnswerModal extends Modal {
    question: string;
    answer: string;
    noteId: string;

    constructor(app: App, noteId: string, answer: string) {
        super(app);
        this.noteId = noteId
        this.answer = answer;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Enter question and answer' });

        new Setting(contentEl)
            .setName('Question')
            .addText(text => text.onChange(value => {
                this.question = value;
            }));

        new Setting(contentEl)
            .setName('Answer')
            .addTextArea(text => text.setValue(this.answer).onChange(value => {
                this.answer = value;
            }));


        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Submit')
                .setCta()
                .onClick(() => {
                    this.submit();
                }));
    }

    async submit() {
        if (this.question && this.answer) {
            // new Notice(`Question: ${this.question}, Answer: ${this.answer}`);
            const file = await this.app.workspace.getActiveFile();
            if (!file) {
                console.error("No active file")
                return;
            }
            await addQuestion(this.noteId, file, this.question, this.answer);
            this.close();
        } else {
            new Notice('Please fill in both fields.');
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}