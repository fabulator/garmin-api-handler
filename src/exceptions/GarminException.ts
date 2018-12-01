export default class GarminException extends Error {
    public constructor(message: string) {
        super(`Garmin Error: ${message}`);
    }
}
