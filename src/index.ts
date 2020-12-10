import {ClaimsAdjudicator} from '@byu-oit/ts-claims-engine';
import Enforcer from 'openapi-enforcer-middleware';
import * as path from 'path';
import controllers from './controllers/claims';

export async function middleware(adjudicator: ClaimsAdjudicator) {
    const enforcer = new Enforcer(path.resolve(__dirname, './api.json'));
    await enforcer.controllers(controllers, adjudicator);
    return enforcer.middleware();
}
