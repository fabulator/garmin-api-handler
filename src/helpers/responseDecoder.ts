export default async (response: Response): Promise<string> => {
    if (response.status === 204 || response.status === 302) {
        return '';
    }

    const responseText = await response.text();

    if (response.headers.get('content-type') === 'text/html;charset=UTF-8') {
        return responseText;
    }

    try {
        return JSON.parse(responseText);
    } catch {
        return responseText;
    }
};
