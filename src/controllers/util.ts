export interface Metadata {
    validation_response: ValidationResponse
}
export interface ValidationResponse {
    code: number
    message: string
}
export function getResponseForReturnCode(code: number): string {
    if (code === 200) {
        return 'Success'
    }
    if (code === 201) {
        return 'Created'
    }
    if (code === 204) {
        return 'No Content'
    }
    if (code === 400) {
        return 'Bad Request'
    }
    if (code === 401) {
        return 'Unauthorized'
    }
    if (code === 403) {
        return 'Forbidden'
    }
    if (code === 404) {
        return 'Not Found'
    }
    if (code === 409) {
        return 'Conflict'
    }
    return 'Internal Server Error'
}

export function generateValidationResponseObj(code: number, message?: null | string ): Metadata {
    if ([200, 201, 204, 400, 401, 403, 404, 409, 500].indexOf(code) === -1) {
        code = 500
    }
    if (message === undefined || message === null) {
        message = getResponseForReturnCode(code)
    }
    return { validation_response: { code, message } }
}

export function generateMetadataResponseObj(code: number, message?: null | string): { metadata: Metadata } {
    return { metadata: generateValidationResponseObj(code, message) }
}
