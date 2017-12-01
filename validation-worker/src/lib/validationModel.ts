import * as uuidv4 from 'uuid/v4';
import * as path from 'path';
import * as os from 'os';
import * as debug from "debug"
import * as fs from 'fs-extra';

const oav = require('oav');
const debugLogger: debug.IDebugger = debug(`Worker:ValidationModel`);

class ValidationModel {

    validator: any;
    resourceProvider: string;
    apiVersion: string;
    validationId: string;
    directory: string;
    constructor(resourceProvider: string, apiVersion: string, validatorOptions: any) {
        this.validationId = uuidv4();
        this.directory = path.resolve(os.homedir(), `repo-${this.validationId}`);
        validatorOptions.directory = this.directory;
        this.validator = new oav.LiveValidator(validatorOptions);
    }

    validate(requestResponsePair: any): any {
        const validationResult = this.validator.validateLiveRequestResponse(requestResponsePair);
        return validationResult;
    }
    async initialize(): Promise<void> {
        await this.validator.initialize();
        fs.removeSync(this.directory);
        return Promise.resolve();
    }
}

export default ValidationModel;