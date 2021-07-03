import {ClaimsAdjudicator} from '@byu-oit/ts-claims-engine'
import Enforcer, { MiddlewareFunction } from 'openapi-enforcer-middleware'
import { Request, Response, NextFunction } from 'express'
import * as path from 'path'
import { generateMetadataResponseObj } from './controllers/util'
import controllers from './controllers/claims'


// TODO - Add better type definitions when openapi enforcer adds them
// eslint-disable-next-line
export function EnforcerError (err: Error & { exception?: any }, req: Request, res: Response, next: NextFunction): any {
    const title = 'Request has one or more errors'
    if (err && err.exception && err.exception.header === title) {
        const validationErrors = err.message.replace(title + '\n ', '').split('\n ')
        return res.status(400).send(generateMetadataResponseObj(400, undefined, ...validationErrors))
    }
    console.error(err.stack)
    return res.status(500).send(generateMetadataResponseObj(500))
}

export async function middleware(adjudicator: ClaimsAdjudicator): Promise<MiddlewareFunction> {
    const enforcer = new Enforcer(path.resolve(__dirname, './api.json'))
    await enforcer.promise // wait for enforcer to resolve

    await enforcer.controllers(controllers(adjudicator))
    return enforcer.middleware()
}
