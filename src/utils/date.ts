import {moment} from 'obsidian'

export function getDatePart(date: Date) {
    const formattedDate = moment(date).format("yyyy-MM-DD");
    return formattedDate
}

export function formatDate(date: Date) {
    // const formattedDate = moment(date).format("Do MMM YYYY, h:mma"); // ^th Aug 2024, 6:30pm
    const formattedDate = moment(date).format("DD/MM/yyyy, hh:mm"); // ^th Aug 2024, 6:30pm
    return formattedDate
}
