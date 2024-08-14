import { Notice, moment } from "obsidian";
import { activateChangedNotesView } from "src/views";

type NotificationTime = {
    hours: number;
    minutes: number;
}


export let notificationTimeoutId: number | null = null;
// This schedules a daily notification at the specified time
export function scheduleDailyNotification(notificationTime: NotificationTime) {

    if (notificationTimeoutId) {
        window.clearTimeout(notificationTimeoutId);
        notificationTimeoutId = null;
    }
    const now = moment();
    const nextNotificationTime = moment().set({
        hour: notificationTime.hours,
        minute: notificationTime.minutes,
        second: 0,
        millisecond: 0
    });
    
    // If the current time is after today's notification time, schedule for tomorrow
    if (nextNotificationTime.isBefore(now)) {
        nextNotificationTime.add(1, 'day');
    }

    const timeUntilNextNotification = nextNotificationTime.diff(now);

    notificationTimeoutId = window.setTimeout(() => {
        showNotification();
        scheduleDailyNotification(notificationTime); // Schedule the next notification
    }, timeUntilNextNotification);
}

function showNotification() {
    new Notice("Time to review your notes!");
    activateChangedNotesView();
}