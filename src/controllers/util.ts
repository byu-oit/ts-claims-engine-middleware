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
