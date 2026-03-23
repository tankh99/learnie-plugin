import { CreateMLCEngine, InitProgressReport, MLCEngine } from "@mlc-ai/web-llm";
import { Notice } from "obsidian";

export class AIService {
    private engine: MLCEngine | null = null;
    private isInitializing = false;
    private currentModel = "";

    public async initialize(model: string, progressCallback?: (progress: InitProgressReport) => void): Promise<boolean> {
        if (this.engine && this.currentModel === model) {
            return true;
        }

        if (this.isInitializing) {
            new Notice("AI Engine is already initializing...");
            return false;
        }

        this.isInitializing = true;
        try {
            this.engine = await CreateMLCEngine(model, {
                initProgressCallback: progressCallback,
            });
            this.currentModel = model;
            return true;
        } catch (error) {
            console.error("Failed to initialize AI Engine:", error);
            new Notice("Failed to initialize AI Engine. Check console for details.");
            this.engine = null;
            this.currentModel = "";
            return false;
        } finally {
            this.isInitializing = false;
        }
    }

    public async generateQuestions(text: string): Promise<{ question: string; answer: string }[]> {
        if (!this.engine) {
            throw new Error("AI Engine not initialized");
        }

        const prompt = `Based on the following text, generate 3 quiz questions and answers. Return ONLY a JSON array of objects with 'question' and 'answer' keys.

Text:
${text}

JSON output:`;

        try {
            const reply = await this.engine.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                // We remove response_format: { type: "json_object" } because it causes GrammarCompiler.CompileJSONSchema issues
                // Instead we rely on the prompt to ask for JSON
            });

            const content = reply.choices[0].message.content;
            if (!content) {
                throw new Error("Empty response from AI");
            }

            // Attempt to parse the JSON
            // Sometimes models wrap json in markdown code blocks
            let jsonString = content;
            if (jsonString.startsWith("```json")) {
                jsonString = jsonString.replace(/^```json\n/, "").replace(/\n```$/, "");
            } else if (jsonString.startsWith("```")) {
                jsonString = jsonString.replace(/^```\n/, "").replace(/\n```$/, "");
            }

            const parsed = JSON.parse(jsonString);
            
            // Handle cases where the model returns an object with a property containing the array
            if (Array.isArray(parsed)) {
                return parsed;
            } else if (parsed.questions && Array.isArray(parsed.questions)) {
                return parsed.questions;
            } else {
                // Try to find the first array value
                for (const key in parsed) {
                    if (Array.isArray(parsed[key])) {
                        return parsed[key];
                    }
                }
                throw new Error("Could not find array of questions in response");
            }
        } catch (error) {
            console.error("Error generating questions:", error);
            throw error;
        }
    }

    public isReady(): boolean {
        return this.engine !== null;
    }
}

export const aiService = new AIService();
