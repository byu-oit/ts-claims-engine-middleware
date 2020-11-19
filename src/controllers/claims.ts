import {
    ClaimsAdjudicator,
    ClaimsResponse, SubjectNotFound, ValidationError
} from '@byu-oit/ts-claims-engine'
import {NextFunction, Request, Response} from 'express'
import {generateMetadataResponseObj, generateValidationResponseObj} from './util'

export interface Operations {
    [key: string]: (req: Request, res: Response, next?: NextFunction) => Promise<unknown>
}

export interface Controller {
    [key: string]: Operations
}

export default function(adjudicator: ClaimsAdjudicator): Controller {
    const controller: Operations = {}

    controller.getConcepts = async (req: Request, res: Response) => {
        const metadata = generateValidationResponseObj(200)
        const values = adjudicator.getConcepts()
        return res.status(200).send({metadata, values})
    }

    controller.validateClaims = async (req: Request, res: Response) => {
        const verified: ClaimsResponse = await adjudicator.verifyClaims(req.body)
        const results = Object.entries(verified).reduce((acc, [key, result]) => {
            if (result instanceof SubjectNotFound) {
                return Object.assign(acc, {[key]: generateMetadataResponseObj(404)})
            } else if (result instanceof ValidationError) {
                return Object.assign(acc, {[key]: generateMetadataResponseObj(400, null, ...result.errors)})
            } else if (result instanceof Error) {
                return Object.assign(acc, {[key]: generateMetadataResponseObj(500)})
            } else {
                const metadata = generateValidationResponseObj(200)
                return Object.assign(acc, {[key]: {verified: result, metadata}})
            }
        }, {})
        return res.status(200).send(results)
    }

    return {claims: controller}
}
