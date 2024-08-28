import {moment} from 'obsidian'

export function getDatePart(date: Date) {
    const formattedDate = moment(date).format("yyyy-MM-DD");
    return formattedDate
}

export function formatDate(date: Date) {
    // const formattedDate = moment(date).format("Do MMM YYYY, h:mma"); // ^th Aug 2024, 6:30pm
    // const formattedDate = moment(date).format("DD/MM/yyyy, hh:mm"); // 6th Aug 2024, 6:30pm
    const formattedDate = formatDateToTimezone(date)
    return formattedDate
}

export function formatDateToTimezone(date: Date) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,  // 24-hour format
    }).format(date);
}