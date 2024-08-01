import {moment} from 'obsidian'

export function getDatePart(date: Date) {
    const formattedDate = moment(date).format("yyyy-MM-dd");
    return formattedDate
}
