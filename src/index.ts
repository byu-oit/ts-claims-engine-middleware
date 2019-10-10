import {ClaimsAdjudicator} from '@byu-oit/ts-claims-engine';
import Enforcer = require('openapi-enforcer-middleware');
import {getControllers} from './controllers';
import * as api from './api.json';

export {api}

export async function middleware(adjudicator: ClaimsAdjudicator) {
    const controllers = getControllers(adjudicator);
    const enforcer = new Enforcer(api);
    await enforcer.controllers(controllers);
    return enforcer.middleware();
}
