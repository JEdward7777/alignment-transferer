export function parseUsfmHeaders(headers_section: { tag: string, content: string }[]) {
    const parsed_headers: { [key: string]: string } = headers_section.reduce((acc: { [key: string]: string }, entry: { tag: string, content: string }) => {
        if (entry.tag && entry.content) {
            return { ...acc, [entry.tag]: entry.content };
        }
        return acc;
    }, {});
    return parsed_headers;
}

export function is_number( value: string ){
    return !isNaN(parseInt(value));
}

export function only_numbers(to_filter: string[]): string[] {
    return to_filter.reduce((acc: string[], curr: string) => {
        if (is_number(curr)) acc.push(curr);
        return acc;
    }, []);
}