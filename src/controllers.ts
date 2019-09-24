import {
    BadRequest,
    ClaimsAdjudicator,
    ClaimsResponse,
    InternalError,
    UnidentifiedSubjectError,
    ValidationError
} from '@byu-oit/ts-claims-engine';
import {Request, Response} from 'express';

export function getControllers(adjudicator: ClaimsAdjudicator) {
    const getConcepts = async (req: Request, res: Response) => {
        const metadata = generateValidationResponseObj(200);
        const values = adjudicator.getConcepts();
        return res.status(200).send({metadata, values});
    };
    const validateClaims = async (req: Request, res: Response) => {
        let verified: ClaimsResponse;
        try {
            verified = await adjudicator.verifyClaims(req.body);
        } catch (e) {
            return res.status(400).send({});
        }
        const results = Object.entries(verified).reduce((acc, [key, result]) => {
            if (result instanceof UnidentifiedSubjectError) {
                return Object.assign(acc, {[key]: generateMetadataResponseObj(404)});
            } else if (result instanceof ValidationError || result instanceof BadRequest) {
                return Object.assign(acc, {[key]: generateMetadataResponseObj(400)});
            } else if (result instanceof InternalError) {
                return Object.assign(acc, {[key]: generateMetadataResponseObj(500)});
            } else {
                const metadata = generateValidationResponseObj(200);
                return Object.assign(acc, {[key]: {verified: result, metadata}});
            }
        }, {});

        return res.status(200).send(results);
    };
    return {getConcepts, validateClaims};
}

export function getResponseForReturnCode(code: number) {
    if (code === 200) {
        return 'Success';
    }
    if (code === 201) {
        return 'Created';
    }
    if (code === 204) {
        return 'No Content';
    }
    if (code === 400) {
        return 'Bad Request';
    }
    if (code === 401) {
        return 'Unauthorized';
    }
    if (code === 403) {
        return 'Forbidden';
    }
    if (code === 404) {
        return 'Not Found';
    }
    if (code === 409) {
        return 'Conflict';
    }
    if (code === 500) {
        return 'Internal Server Error';
    }
    return '';
}

export function isObjEmpty(obj: any) {
    if (typeof obj !== 'object') {
        return true;
    }
    if (obj === null) {
        return true;
    }
    return (Object.keys(obj).length === 0);
}

export function generateValidationResponseObj(code: number, message?: any) {
    if ([200, 201, 204, 400, 401, 403, 404, 409, 500].indexOf(code) === -1) {
        code = 500;
    }
    if (message === undefined) {
        message = getResponseForReturnCode(code);
    }
    if (typeof message === 'number') {
        message = message.toString();
    }
    if (typeof message === 'object' && message === null) {
        message = 'Response is null';
    }
    if (typeof message === 'object' && isObjEmpty(message)) {
        message = 'Response body is empty';
    }
    return {'validation_response': {'code': code, 'message': message}};
}

export function generateMetadataResponseObj(code: number, message?: any) {
    return {'metadata': generateValidationResponseObj(code, message)};
}
