const pad2str = date => date.toString().padStart(2, '0')

// Mapping from escape character to date
const FMT_ESCAPE = {
    "%a": now => now.toLocaleString('en-us', {weekday: 'short'}),
    "%A": now => now.toLocaleString('en-us', {weekday: 'long'}),
    "%w": now => now.getDay().toString(),
    "%d": now => pad2str(now.getDate()),
    "%b": now => now.toLocaleString('en-us', {month: 'short'}),
    "%B": now => now.toLocaleString('en-us', {month: 'long'}),
    "%m": now => pad2str(now.getMonth() + 1),
    "%y": now => now.toLocaleString('en-us', {year: '2-digit'}),
    "%Y": now => now.getFullYear().toString(),
    "%H": now => pad2str(now.getHours()),
    "%M": now => pad2str(now.getMinutes()),
    "%S": now => pad2str(now.getSeconds())
}

function formatDateEscapeCharacter(char, date){
    return FMT_ESCAPE[char](date);
}

/**
 * Create a date string for the current time based on the given format
 * Js does't have native date parsing format because it's not a real language :)
 * @param fmt The format
 * @returns
 */
export function fmtDate(fmt) {
    let date = "";
    let ptr = 0;
    const now = new Date();
    while (ptr < fmt.length){
        if (fmt[ptr] == "%"){
            date += formatDateEscapeCharacter(fmt.slice(ptr,ptr+2), now)
            ptr += 2
        } else{
            date += fmt[ptr];
            ptr += 1
        }
    }
    return date;
}

export function parseDate(date, fmt){

    let ptr = 0;
    let epoch = new Date(0);

    while (ptr < fmt.length){
        if (fmt[ptr] == "%"){
            switch (fmt.slice(ptr, ptr+2)){
            case "%H":
                epoch.setHours(parseInt(date.slice(0, 2))); break;
            case "%M":
                epoch.setMinutes(parseInt(date.slice(0, 2))); break;
            case "%S":
                epoch.setSeconds(parseInt(date.slice(0, 2))); break;
            case "%f":
                epoch.setMilliseconds(parseInt(date.slice(0, 3))); break;
            case "%Y":
                epoch.setFullYear(parseInt(date.slice(0,4))); break;
            case "%y":
                // This will break in 1000 years!
                epoch.setFullYear(2000 + parseInt(date.slice(0, 2))); break;
            case "%m":
                epoch.setMonth(parseInt(date.slice(0, 2)) - 1); break;
            case "%d":
                epoch.setDate(parseInt(date.slice(0, 2))); break;
            default:
                break
            }
            ptr += 2
            date = date.slice(fmt[ptr + 1] == "f" ? 3 : fmt[ptr + 1] == "Y" ? 4 : 2)
        } else{
            date = date.slice(1)
            ptr += 1
        }
    }

    return epoch;
}
