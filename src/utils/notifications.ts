import { setSeconds, setMinutes, setHours, isBefore, addDays, differenceInMilliseconds, addSeconds } from "date-fns";
import { Notice } from "obsidian";

type NotificationTime = {
    hours: number;
    minutes: number;
}

// This schedules a daily notification at the specified time
export function scheduleDailyNotification(notificationTime: NotificationTime) {
    const now = new Date();
    let nextNotificationTime = setSeconds(setMinutes(setHours(now, notificationTime.hours), notificationTime.minutes), 0);

    if (isBefore(nextNotificationTime, now)) {
        nextNotificationTime = addDays(nextNotificationTime, 1);
    }

    const timeUntilNextNotification = differenceInMilliseconds(nextNotificationTime, now);

    setTimeout(() => {
        showNotification();
        scheduleDailyNotification(notificationTime); // Schedule the next notification
    }, timeUntilNextNotification);
}

function showNotification() {
    new Notice("Time to review your notes!");
}