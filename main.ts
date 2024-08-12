import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { addCommands } from 'src/commands';
import { handleNoteChange } from "src/utils/note";
import { registerViews } from 'src/views';
import "./styles.css";
import { registerRibbonIcons } from 'src/ribbon-icons';
import { scheduleDailyNotification } from 'src/utils/notifications';

type LearnieSettings = {
	enableNotification: boolean;	
	notificationTime: string;
}

const DEFAULT_SETTINGS: LearnieSettings = {
	enableNotification: false,
	notificationTime: "20:00",
}

export default class Learnie extends Plugin {
	settings: LearnieSettings;

	async onload() {

		await this.loadSettings();
		
		// This sets the tokenizer globally for all marked import 
		this.registerEvent(this.app.vault.on("modify", () => {
			handleNoteChange(this.app.vault, this.app.workspace.getActiveFile())
		}))

		registerViews(this);

		addCommands(this)

		registerRibbonIcons(this)

		this.addSettingTab(new LearnieSettingTab(this.app, this));

		if (this.settings.enableNotification) {
			this.scheduleNotification()
		}

		// Code to clear all scheduled notifictions
		// let id = window.setTimeout(function() {}, 0);

		// while (id--) {
		// 	console.log(id)
		// 	window.clearTimeout(id); // will do nothing if no timeout with id is present
		// }
	}


    scheduleNotification() {
        const [hours, minutes] = this.settings.notificationTime.split(':').map(Number);
        scheduleDailyNotification({ hours, minutes });
    }


	onunload() {
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
									}
								})
							}
						}, 500);
					}));
		}

	}
}
