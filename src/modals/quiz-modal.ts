import { App, Modal, Notice, Setting } from "obsidian";

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
        this.tags.forEach(tag => {
            
        })

        // Container for checkboxes
        const checkboxContainer = contentEl.createDiv({ 
            cls: 'tag-checkbox-container',
         });
        
        // Create a checkbox for each tag
        this.tags.forEach(tag => {
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
                        new Notice('Please select at least one tag.');
                        return;
                    }
                    // this.onSubmit(Array.from(this.selectedTags));
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