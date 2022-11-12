export default async (response: Response): Promise<string | Blob> => {
    if (response.status === 204 || response.status === 302) {
        return '';
    }

    if (response.headers.get('content-type') === 'application/x-zip-compressed') {
        return response.blob();
    }

    const responseText = await response.text();

    if (response.headers.get('content-type') === 'text/html;charset=UTF-8') {
        return responseText;
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(responseText);
    } catch {
        return responseText;
    }
};
