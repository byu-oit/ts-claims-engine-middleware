import {
    BadRequest,
    ClaimsAdjudicator,
    ClaimsResponse,
    InternalError,
    UnidentifiedSubjectError,
    ValidationError
} from '@byu-oit/ts-claims-engine';
import {NextFunction, Request, Response} from 'express';
import {generateMetadataResponseObj, generateValidationResponseObj} from './util';

export interface Operations {
    [key: string]: (req: Request, res: Response, next?: NextFunction) => Promise<any>;
}

export interface Controller {
    [key: string]: Operations;
}

export default function(adjudicator: ClaimsAdjudicator): Controller {
    const controller: Operations = {};

    controller.getConcepts = async (req: Request, res: Response) => {
        const metadata = generateValidationResponseObj(200);
        const values = adjudicator.getConcepts();
        return res.status(200).send({metadata, values});
    };

    controller.validateClaims = async (req: Request, res: Response) => {
        let verified: ClaimsResponse;
        try {
            verified = await adjudicator.verifyClaims(req.body);
        } catch (e) {
            return res.status(400).send({});
        }
        const results = Object.entries(verified).reduce((acc, [key, result]) => {
            if (result.constructor.name === 'UnidentifiedSubjectError') {
                return Object.assign(acc, {[key]: generateMetadataResponseObj(404)});
            } else if (['ValidationError', 'BadRequest'].includes(result.constructor.name)) {
                return Object.assign(acc, {[key]: generateMetadataResponseObj(400)});
            } else if (result.constructor.name === 'InternalError') {
                return Object.assign(acc, {[key]: generateMetadataResponseObj(500)});
            } else {
                const metadata = generateValidationResponseObj(200);
                return Object.assign(acc, {[key]: {verified: result, metadata}});
            }
        }, {});
        return res.status(200).send(results);
    };

    return {claims: controller};
}
