import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { addCommands } from 'src/commands';
import { handleNoteChange } from "src/utils/note";
import { registerViews } from 'src/views';
import "./styles.css";
import { registerRibbonIcons } from 'src/ribbon-icons';
import { notificationTimeoutId, scheduleDailyNotification } from 'src/utils/notifications';
import { LearnieSettings } from 'src/types/types';
import { aiService } from 'src/utils/ai';

const DEFAULT_SETTINGS: LearnieSettings = {
	enableNotification: false,
	notificationTime: "20:00",
	numQuizQuestions: 10,
	aiModel: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
}

export default class Learnie extends Plugin {
	settings: LearnieSettings;

	async onload() {

		await this.loadSettings();
		
		// This sets the tokenizer globally for all marked import 
		this.registerEvent(this.app.vault.on("modify", async (file: TFile) => {
			await handleNoteChange(this.app.vault, file)
		}))

		registerViews(this, this.settings);

		addCommands(this)

		registerRibbonIcons(this)

		this.addSettingTab(new LearnieSettingTab(this.app, this));


		this.clearNotifications()

		const shouldScheduleNotification = this.settings.enableNotification && !notificationTimeoutId
		if (shouldScheduleNotification ) {
			this.scheduleNotification()
		}
	}


    scheduleNotification() {
        const [hours, minutes] = this.settings.notificationTime.split(':').map(Number);
        scheduleDailyNotification({ hours, minutes });
    }


	onunload() {
		
	}

	// Cleanup method to clear all excess notifications.
	// Note: To be run BEFORE scheduling notifications
	clearNotifications() {
		// Code to clear all scheduled notifictions except 1
		let id = window.setTimeout(function() {}, 0);

		while (id >= 0) {
			window.clearTimeout(id); // will do nothing if no timeout with id is present
			id -= 1
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}



class LearnieSettingTab extends PluginSettingTab {
	plugin: Learnie;
	noticeTimeout: any;

	constructor(app: App, plugin: Learnie) {
		super(app, plugin);
		this.plugin = plugin;
		this.noticeTimeout = null;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl("h2", {text: "Notification settings"})

		new Setting(containerEl)
			.setName('No. of quiz questions to show')
			.setDesc('Sets the maximum number of questions to show per quiz')
			.addText(text => text
				.setPlaceholder("Enter a number")
				.setValue(this.plugin.settings.numQuizQuestions.toString())
				.onChange(async (value) => {
					this.plugin.settings.numQuizQuestions = Number(value);
					if (this.noticeTimeout) {
						clearTimeout(this.noticeTimeout)
					}

					// Input debounce code
					this.noticeTimeout = setTimeout(() => {
						this.plugin.saveSettings()
						.then(() => {
							new Notice(`Successfully set number of quiz questions to ${value}`)
						})
					}, 500);
				})
			)

		new Setting(containerEl)
			.setName('Enable notification')
			.setDesc('Turn daily notifications on or off')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableNotification)
				.onChange(async (value) => {
					this.plugin.settings.enableNotification = value;
					await this.plugin.saveSettings();
					this.display()
					if (value) {
						this.plugin.scheduleNotification()
					}
				})
			)

		if (this.plugin.settings.enableNotification) {
			// Notification Time Setting
			new Setting(containerEl)
				.setName('Notification Time')
				.setDesc('Set the 24hr time for daily notifications (HH:MM format).')
				.addText(text => text
					.setPlaceholder('Enter time')
					.setValue(this.plugin.settings.notificationTime)
					.onChange(async (value) => {
						this.plugin.settings.notificationTime = value;
						// Regex for validating "HH:MM" format, allowing 24-hour times
                        const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
						if (this.noticeTimeout) {
							clearTimeout(this.noticeTimeout)
						}
						this.noticeTimeout = setTimeout(() => {
							if (!timeFormatRegex.test(value)) {
								// Debounce logic to prevent notice-spamming
								this.noticeTimeout = null;
								new Notice("Invalid time format. Please use HH:MM format (24-hour).");
							} else {
								this.plugin.saveSettings()
								.then(() => {
									if (this.plugin.settings.enableNotification) {
										this.plugin.scheduleNotification();
										this.noticeTimeout = null;
										new Notice(`Successfully set notification time to ${value}`)
									}
								})
							}
						}, 500);
					}));
		}

		containerEl.createEl("h2", {text: "Local AI Settings"});

		new Setting(containerEl)
			.setName('AI Model')
			.setDesc('Select the local AI model to use for generating questions.')
			.addDropdown(dropdown => dropdown
				.addOption('Phi-3.5-mini-instruct-q4f32_1-MLC', 'Phi-3.5 Mini Instruct')
				.addOption('DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC', 'Deepseek-R1 (Qwen-7B Distill)')
				.addOption('WizardMath-7B-V1.1-q4f16_1-MLC', 'WziardMath-7B')
				.addOption('gemma-2-2b-it-q4f32_1-MLC-1k', 'Gemma2-2B')
				.addOption('gemma-2-9b-it-q4f16_1-MLC', 'Gemma2-9B')
				.addOption('Qwen3-1.7B-q4f32_1-MLC', 'Qwen3-1.7B')
				.addOption('Qwen3-4B-q4f16_1-MLC', 'Qwen3-4B')
				.addOption('Qwen3-8B-q4f32_1-MLC', 'Qwen3-8B')
				.setValue(this.plugin.settings.aiModel)
				.onChange(async (value) => {
					this.plugin.settings.aiModel = value;
					await this.plugin.saveSettings();
				})
			);

		const progressEl = containerEl.createEl("div", { text: "" });
		progressEl.style.marginTop = "10px";
		progressEl.style.fontSize = "0.9em";
		progressEl.style.color = "var(--text-muted)";

		new Setting(containerEl)
			.setName('Initialize AI Engine')
			.setDesc('Download and load the selected model into memory. This may take a while the first time.')
			.addButton(button => button
				.setButtonText('Load Model')
				.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('Loading...');
					progressEl.setText("Initializing...");

					const success = await aiService.initialize(this.plugin.settings.aiModel, (progress) => {
						progressEl.setText(progress.text);
					});

					if (success) {
						new Notice("AI Engine initialized successfully!");
						progressEl.setText("AI Engine is ready.");
						button.setButtonText('Model Loaded');
					} else {
						progressEl.setText("Failed to initialize AI Engine.");
						button.setDisabled(false);
						button.setButtonText('Load Model');
					}
				})
			);
	}
}
