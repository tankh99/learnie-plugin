import { Modal, App, Setting, Notice } from "obsidian";
import { QuestionAnswerPair } from "src/types/types";
import { addQuestion, getQuestions } from "src/utils/questions";

export class UpdateQuestionAnswerModal extends Modal {
    noteId: string;
    questions: QuestionAnswerPair[] = [];
    currentQuestion: QuestionAnswerPair | null = null;
    newQuestion = "";
    newAnswer = "";
  
    constructor(app: App, noteId: string) {
        super(app);
        this.noteId = noteId
    }

    async onOpen() {
        const questions: QuestionAnswerPair[] = await getQuestions(this.noteId);
        this.questions = questions;

        this.display()
    }

    async display() {

        const { contentEl } = this;
        contentEl.empty()

        contentEl.createEl('h2', { text: 'Questions' });

        this.questions.forEach((qna, index) => {
            const qnaContainer = contentEl.createEl('div', { cls: 'qna-container' });
            new Setting(qnaContainer)
                .setName(`Question: ${qna.question}`)
            new Setting(qnaContainer)
                .setName("Question")
                .addTextArea(text => text.setValue(qna.question).onChange(value => {
                    qna.question = value
                }))
            new Setting(qnaContainer)
                .setName("Answer")
                .addTextArea(text => text.setValue(qna.answer).onChange(value => {
                    qna.answer = value;
                }))
                // .addButton(btn => btn.setIcon("pencil").onClick(() => this.editQuestion(qna)))
            
            new Setting(qnaContainer)
            .addButton(btn => btn
                .setIcon("pencil")
                .setTooltip("Edit")
                .onClick(() => this.editQuestion(qna))
            )
            .addButton(btn => btn
                .setIcon("trash")
                .setTooltip("Delete")
                .onClick(() => this.deleteQuestion(index))
            );

        // Add a horizontal rule to separate Q&A pairs
        if (index < this.questions.length - 1) {
            qnaContainer.createEl('hr');
        }
        });
    }


    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    editQuestion(qa: QuestionAnswerPair) {
        this.currentQuestion = qa;
        this.newQuestion = qa.question;
        this.newAnswer = qa.answer;
        this.display();
        new Notice("Updated successfully")
    }

    async deleteQuestion(id: number) {
        this.questions.splice(id, 1)
        this.display();
        new Notice("Deleted successfully")
    }

    // CURRENTLY UNUSED.
    async submitQuestion() {
        if (this.newQuestion && this.newAnswer) {
            const file = await this.app.workspace.getActiveFile();
            if (!file) {
                new Notice('No active file');
                return;
            }

            if (this.currentQuestion) {
                // await updateQuestion(this.noteId, file, this.currentQuestion.id, this.newQuestion, this.newAnswer);
                // this.questions = this.questions.map(q =>
                //     q.id === this.currentQuestion?.id ? { ...q, question: this.newQuestion, answer: this.newAnswer } : q
                // );
            } else {
                const newQA = await addQuestion(this.noteId, file, this.newQuestion, this.newAnswer);
                // this.questions.push(newQA);
            }

            this.currentQuestion = null;
            this.newQuestion = "";
            this.newAnswer = "";
            this.display();
        } else {
            new Notice('Please fill in both fields.');
        }
    }
}