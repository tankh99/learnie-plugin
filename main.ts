import { Plugin } from 'obsidian';
import { addCommands } from 'src/commands';
import { handleNoteChange } from "src/utils/note";
import { registerViews } from 'src/views';
import "./styles.css";
import { registerRibbonIcons } from 'src/ribbon-icons';
import { scheduleDailyNotification } from 'src/utils/notifications';
import { LearnieSettings, DEFAULT_SETTINGS, LearnieSettingTab } from 'src/settings';

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
