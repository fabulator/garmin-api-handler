import { ApiResponseType } from 'rest-api-handler';
import GarminException from './GarminException';

export default class GarminApiException extends GarminException {
    private response: ApiResponseType<any>;

    /**
     * Constructor.
     */
    public constructor(response: ApiResponseType<any>) {
        super(JSON.stringify(response.data));
        this.response = response;
    }

    public getResponse(): ApiResponseType<any> {
        return this.response;
    }

    public getRequest(): Request {
        return this.response.request;
    }
}
