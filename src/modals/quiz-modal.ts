import { App, Modal, Setting } from "obsidian";
import { getAllQuestions, getAllQuestionsByTags } from "src/utils/questions";
import { normalizeTag } from "src/utils/tags";
import { activateQuizView } from "src/views";

export class QuizModal extends Modal {

    tags: Set<string>
    selectedTags: Set<string> = new Set<string>();

    constructor(app: App, tags: Set<string>) {
        super(app)
        this.tags = tags;
    }

    onOpen() {
        this.display()
    }

    display() {
        const {contentEl} = this;
        contentEl.empty();

        contentEl.createEl("h2", {text: "Start a quiz based on tags"})
        contentEl.createEl("p", {text: `Choose tags you want to quiz yourself on. Don't select anything to quiz yourself on all types of questions.`})

        // Container for checkboxes
        const checkboxContainer = contentEl.createDiv({ 
            cls: 'tag-checkbox-container',
         });
        
        // Create a checkbox for each tag
        this.tags.forEach(tag => {
            tag = normalizeTag(tag);
            new Setting(checkboxContainer)
                .setName(tag)
                .addToggle(toggle => toggle
                    .setValue(false)
                    .onChange(value => {
                        if (value) {
                            this.selectedTags.add(tag);
                        } else {
                            this.selectedTags.delete(tag);
                        }
                    })
                );
        });

        // Add Submit and Cancel buttons
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

        new Setting(buttonContainer)
            .addButton(button => button
                .setButtonText('Cancel')
                .onClick(() => this.close())
            );

        new Setting(buttonContainer)
            .addButton(button => button
                .setButtonText('Create')
                .onClick(() => {
                    if (this.selectedTags.size === 0) {
                        getAllQuestions()
                        .then(questions => {
                            activateQuizView(true, questions);
                        })
                    } else {   
                        const tags = this.selectedTags
                        getAllQuestionsByTags(tags)
                        .then(questionsByTags => {
                            activateQuizView(true, questionsByTags, tags);
                        })
                    }
                    this.close();
                })
            );

        // Optional: Add some styling
        // contentEl.style.overflowY = 'auto';
        // checkboxContainer.style.maxHeight = '300px';
        // checkboxContainer.style.overflowY = 'auto';

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}