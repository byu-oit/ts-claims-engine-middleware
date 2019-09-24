import {ClaimsAdjudicator} from '@byu-oit/ts-claims-engine';
import Enforcer = require('openapi-enforcer-middleware');
import * as path from 'path';
import {getControllers} from './controllers';

export async function middleware(adjudicator: ClaimsAdjudicator) {
    const pathToOAS = path.resolve(__dirname, './swagger.json');
    const controllers = getControllers(adjudicator);

    const enforcer = new Enforcer(pathToOAS);
    await enforcer.controllers(controllers);

    return enforcer.middleware();
}
