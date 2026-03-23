import { createNewFile, getUniqueFileName } from "src/utils/file";
import { activateChangedNotesView, activateQuestionsView } from "../views";
import { Notice, Plugin } from "obsidian";
import { convertToNote, isValidNotePath, readNoteId } from "src/utils/note";
import { getAllTags } from "src/utils/tags";
import { QuizModal } from "src/modals/quiz-modal";
import { aiService } from "src/utils/ai";
import { addQuestion } from "src/utils/questions";

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

    plugin.addRibbonIcon('library', 'View all questions', async () => {
        activateQuestionsView(true, "")
    })
    
    plugin.addRibbonIcon("badge-help", "Start quiz", async () => {
        const tags = getAllTags()
        new QuizModal(plugin.app, tags).open()
    })

    plugin.addRibbonIcon("sparkles", "Generate Quiz Questions with Local AI", async () => {
        const file = plugin.app.workspace.getActiveFile();
        if (!file) {
            new Notice("Please open a note first.");
            return;
        }
        
        const validNotePath = isValidNotePath(file.path);
        if (!validNotePath) {
            new Notice("This is not a valid Learnie note.");
            return;
        }

        if (!aiService.isReady()) {
            new Notice("Please initialize the AI Engine in settings first.");
            return;
        }

        const noteId = await readNoteId(plugin.app.vault, file);
        if (!noteId) {
            new Notice("Could not find note ID.");
            return;
        }

        new Notice("Generating questions with Local AI...");
        try {
            const content = await plugin.app.vault.read(file);
            const questions = await aiService.generateQuestions(content);
            
            if (questions.length === 0) {
                new Notice("AI did not generate any questions.");
                return;
            }

            for (const q of questions) {
                await addQuestion(noteId, file, q.question, q.answer);
            }
            
            new Notice(`Successfully generated and added ${questions.length} questions!`);
        } catch (error) {
            console.error("Failed to generate questions:", error);
            new Notice("Failed to generate questions. Check console for details.");
        }
    })
}