import {ClaimsAdjudicator} from '@byu-oit/ts-claims-engine'
import Enforcer, { MiddlewareFunction } from 'openapi-enforcer-middleware'
import * as path from 'path'
import controllers from './controllers/claims'

export async function middleware(adjudicator: ClaimsAdjudicator): Promise<MiddlewareFunction> {
    const enforcer = new Enforcer(path.resolve(__dirname, './api.json'))
    await enforcer.controllers(controllers, adjudicator)
    return enforcer.middleware()
}
