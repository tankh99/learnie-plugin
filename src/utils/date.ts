import { format } from "date-fns";

export function getDatePart(date: Date) {
    const formattedDate = format(date, "yyyy-MM-dd");
    return formattedDate
}
