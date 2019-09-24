import {ClaimsAdjudicator} from "@byu-oit/ts-claims-engine";
import {middleware} from "../src";
import {
    generateMetadataResponseObj,
    generateValidationResponseObj,
    getControllers,
    isObjEmpty
} from '../src/controllers';
import {NextFunction, Request, Response} from 'express';
import {assert} from 'chai';
import {testClaims, testConcepts} from './static';
import _ = require('lodash');

describe('Claims Adjudicator Middleware', () => {
    let engine: ClaimsAdjudicator;
    let controllers: {
        getConcepts: (req: Request, res: Response, next?: NextFunction) => Promise<any>;
        validateClaims: (req: Request, res: Response, next?: NextFunction) => Promise<any>;
    };

    const res: any = {status: (code: number) => ({send: (res: any) => res})};

    beforeEach(() => {
        const goodConcepts = _.omit(testConcepts, ['bad_cast_favorite_color', 'bad_compare_favorite_color']);
        engine = new ClaimsAdjudicator(goodConcepts);
        controllers = getControllers(engine);
    });

    describe('Middleware', () => {
        it('will instantiate the enforcer middleware', async () => {
            const CAM = await middleware(engine);
            assert.isFunction(CAM);
        });
    });

    describe('Controllers', () => {
        it('will retrieve a collection of properties against which claims can be made', async () => {
            const expected = {
                "metadata": {
                    "validation_response": {
                        "code": 200,
                        "message": "Success"
                    }
                },
                "values": [
                    {
                        "id": "subject_exists",
                        "description": "The subject exists",
                        "longDescription": "Determines whether a subject is a known entity within the domain.",
                        "type": "boolean",
                        "relationships": [
                            "eq",
                            "not_eq"
                        ],
                        "qualifiers": [
                            "age"
                        ]
                    },
                    {
                        "id": "age",
                        "description": "The subject is of age",
                        "longDescription": "Determine if the subject is of an age",
                        "type": "int",
                        "relationships": [
                            "gt",
                            "gt_or_eq",
                            "lt",
                            "lt_or_eq",
                            "eq",
                            "not_eq"
                        ],
                        "qualifiers": []
                    },
                    {
                        "id": "height",
                        "description": "The subject's height",
                        "longDescription": "The subject's measured height in feet",
                        "type": "float",
                        "relationships": [
                            "gt",
                            "gt_or_eq",
                            "lt",
                            "lt_or_eq",
                            "eq",
                            "not_eq"
                        ],
                        "qualifiers": []
                    },
                    {
                        "id": "favorite_color",
                        "description": "The subject has the favorite color",
                        "longDescription": "The subject considers their favorite color to be",
                        "type": "string",
                        "relationships": [
                            "gt",
                            "gt_or_eq",
                            "lt",
                            "lt_or_eq",
                            "eq",
                            "not_eq"
                        ],
                        "qualifiers": []
                    },
                    {
                        "id": "favorite_food",
                        "description": "The subject has the favorite food",
                        "longDescription": "The subject considers their favorite food to be",
                        "type": "food",
                        "relationships": [
                            "eq",
                            "not_eq"
                        ],
                        "qualifiers": []
                    },
                    {
                        "id": "sex",
                        "description": "The subject is of the sex",
                        "longDescription": "The subject is biologically considered",
                        "type": "sex",
                        "relationships": [
                            "eq",
                            "not_eq"
                        ],
                        "qualifiers": []
                    },
                    {
                        "id": "subjectExists",
                        "description": "The subject exists",
                        "longDescription": "Determines whether a subject is a known entity within the domain.",
                        "type": "boolean",
                        "relationships": [
                            "eq",
                            "not_eq"
                        ],
                        "qualifiers": [
                            "age"
                        ]
                    }
                ]
            };
            const actual = await controllers.getConcepts({} as Request, res as Response);
            assert.deepEqual(actual, expected);
        });

        it('will return a collection of claim validation responses', async () => {
            const req = {
                body: {
                    '1': {
                        'subject': '123456987',
                        'claims': [
                            {
                                'concept': 'subject_exists',
                                'relationship': 'eq',
                                'value': 'true'
                            }
                        ]
                    },
                    '2': {
                        'subject': '123456987',
                        'claims': [
                            {
                                'concept': 'subject_exists',
                                'relationship': 'not_eq',
                                'value': 'true'
                            }
                        ]
                    },
                    '3': {
                        'subject': '123456987',
                        'mode': 'any',
                        'claims': [
                            {
                                'concept': 'subject_exists',
                                'relationship': 'eq',
                                'qualifier': {
                                    'age': 25
                                },
                                'value': 'true'
                            }
                        ]
                    },
                    '4': {
                        'subject': '000000000',
                        'claims': [
                            {
                                'concept': 'subject_exists',
                                'relationship': 'eq',
                                'value': 'true'
                            }
                        ]
                    }
                }
            };
            const expected = {
                '1': {
                    'metadata': {
                        'validation_response': {
                            'code': 200,
                            'message': 'Success',
                        }
                    },
                    'verified': true
                },
                '2': {
                    'metadata': {
                        'validation_response': {
                            'code': 200,
                            'message': 'Success',
                        }
                    },
                    'verified': false
                },
                '3': {
                    'metadata': {
                        'validation_response': {
                            'code': 200,
                            'message': 'Success'
                        }
                    },
                    'verified': true
                },
                '4': {
                    'metadata': {
                        'validation_response': {
                            'code': 404,
                            'message': 'Not Found'
                        }
                    }
                }
            };
            const actual = await controllers.validateClaims(req as Request, res as Response);
            assert.deepEqual(actual, expected)
        });

        it('will return an empty response', async () => {
            const req = {
                body: {}
            };
            const expected = {};
            const actual = await controllers.validateClaims(req as Request, res as Response);
            assert.deepEqual(actual, expected);
        });

        it('will return an empty response', async () => {
            const req = {
                body: 'Bad Request'
            };
            const expected = {};
            const actual = await controllers.validateClaims(req as Request, res as Response);
            assert.deepEqual(actual, expected);
        });

        it('will return true claim verification responses', async () => {
            const claims = _.pick(testClaims, Object.keys(testClaims).filter(key => key.startsWith('t')));
            const req = {
                body: claims
            };
            const expected = {
                "t1": {
                    "verified": true,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "t2": {
                    "verified": true,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "t3": {
                    "verified": true,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "t4": {
                    "verified": true,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "t5": {
                    "verified": true,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "t6": {
                    "verified": true,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "t7": {
                    "verified": true,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "t8": {
                    "verified": true,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                }
            };
            const actual = await controllers.validateClaims(req as Request, res as Response);
            assert.deepEqual(actual, expected);
        });

        it('will return false claim verification responses', async () => {
            const claims = _.pick(testClaims, Object.keys(testClaims).filter(key => key.startsWith('f')));
            const req = {
                body: claims
            };
            const expected = {
                "f1": {
                    "verified": false,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "f2": {
                    "verified": false,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "f3": {
                    "verified": false,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "f4": {
                    "verified": false,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "f5": {
                    "verified": false,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "f6": {
                    "verified": false,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "f7": {
                    "verified": false,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                },
                "f8": {
                    "verified": false,
                    "metadata": {
                        "validation_response": {
                            "code": 200,
                            "message": "Success"
                        }
                    }
                }
            };
            const actual = await controllers.validateClaims(req as Request, res as Response);
            assert.deepEqual(actual, expected);
        });

        it('will return bad request error claim verification responses', async () => {
            const claims = _.pick(testClaims, Object.keys(testClaims).filter(key => key.startsWith('e_bad_request')));
            const req = {
                body: claims
            };
            const expected = {
                "e_bad_request_invalid_claim_object": {
                    "metadata": {
                        "validation_response": {
                            "code": 400,
                            "message": "Bad Request"
                        }
                    }
                },
                "e_bad_request_invalid_claim_item": {
                    "metadata": {
                        "validation_response": {
                            "code": 400,
                            "message": "Bad Request"
                        }
                    }
                },
                "e_bad_request_undefined_relationship": {
                    "metadata": {
                        "validation_response": {
                            "code": 400,
                            "message": "Bad Request"
                        }
                    }
                },
                "e_bad_request_invalid_mode": {
                    "metadata": {
                        "validation_response": {
                            "code": 400,
                            "message": "Bad Request"
                        }
                    }
                },
                "e_bad_request_invalid_claim_array": {
                    "metadata": {
                        "validation_response": {
                            "code": 400,
                            "message": "Bad Request"
                        }
                    }
                },
                "e_bad_request_invalid_relationship": {
                    "metadata": {
                        "validation_response": {
                            "code": 400,
                            "message": "Bad Request"
                        }
                    }
                },
                "e_bad_request_invalid_subject": {
                    "metadata": {
                        "validation_response": {
                            "code": 400,
                            "message": "Bad Request"
                        }
                    }
                },
                "e_bad_request_invalid_qualifier_type": {
                    "metadata": {
                        "validation_response": {
                            "code": 400,
                            "message": "Bad Request"
                        }
                    }
                },
                "e_bad_request_undefined_qualifier": {
                    "metadata": {
                        "validation_response": {
                            "code": 400,
                            "message": "Bad Request"
                        }
                    }
                }
            };
            const actual = await controllers.validateClaims(req as Request, res as Response);
            assert.deepEqual(actual, expected);
        });

        it('will return internal error claim verification responses', async () => {
            const concepts = _.pick(testConcepts, ['subject_exists', 'bad_cast_favorite_color', 'bad_compare_favorite_color']);
            engine = new ClaimsAdjudicator(concepts);
            controllers = getControllers(engine);

            const claims = _.pick(testClaims, Object.keys(testClaims).filter(key => key.startsWith('e_internal')));
            const req = {
                body: claims
            };

            const expected = {
                "e_internal_bad_compare": {
                    "metadata": {
                        "validation_response": {
                            "code": 500,
                            "message": "Internal Server Error"
                        }
                    }
                },
                "e_internal_bad_cast": {
                    "metadata": {
                        "validation_response": {
                            "code": 500,
                            "message": "Internal Server Error"
                        }
                    }
                }
            };
            const actual = await controllers.validateClaims(req as Request, res as Response);
            assert.deepEqual(actual, expected);
        });
    });

    describe('Metadata', () => {
        it('will return success', () => {
            const actual = generateMetadataResponseObj(200);
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 200,
                        "message": "Success"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return success', () => {
            const actual = generateMetadataResponseObj(200, 200);
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 200,
                        "message": "200"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return success', () => {
            const actual = generateMetadataResponseObj(200, null);
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 200,
                        "message": "Response is null"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return success', () => {
            const actual = generateMetadataResponseObj(200, {});
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 200,
                        "message": "Response body is empty"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return success', () => {
            const actual = generateMetadataResponseObj(200, {response: 'cool'});
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 200,
                        "message": {
                            "response": "cool"
                        }
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return success', () => {
            const actual = generateMetadataResponseObj(200, 'Successful');
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 200,
                        "message": "Successful"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return created', () => {
            const actual = generateMetadataResponseObj(201);
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 201,
                        "message": "Created"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return created', () => {
            const actual = generateMetadataResponseObj(204);
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 204,
                        "message": "No Content"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return bad request', () => {
            const actual = generateMetadataResponseObj(400);
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 400,
                        "message": "Bad Request"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return unauthorized', () => {
            const actual = generateMetadataResponseObj(401);
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 401,
                        "message": "Unauthorized"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return forbidden', () => {
            const actual = generateMetadataResponseObj(403);
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 403,
                        "message": "Forbidden"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return not found', () => {
            const actual = generateMetadataResponseObj(404);
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 404,
                        "message": "Not Found"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return conflict', () => {
            const actual = generateMetadataResponseObj(409);
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 409,
                        "message": "Conflict"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });

        it('will return internal server error', () => {
            const actual = generateMetadataResponseObj(500);
            const expect = {
                "metadata": {
                    "validation_response": {
                        "code": 500,
                        "message": "Internal Server Error"
                    }
                }
            };
            assert.deepEqual(actual, expect);
        });
    });

    describe('Validation Response', () => {
        it('will return a 500 response for an invalid http response code', () => {
            const actual = generateValidationResponseObj(700);
            const expect = {
                "validation_response": {
                    "code": 500,
                    "message": "Internal Server Error"
                }
            };
            assert.deepEqual(actual, expect);
        });
    });

    describe('Is Empty Object', () => {
        it('will return true when input is null', () => {
            const actual = isObjEmpty(null);
            assert.isTrue(actual);
        });

        it ('will return true when input is not an object', () => {
            const actual = isObjEmpty('not an object');
            assert.isTrue(actual);
        });

        it('will return true when the object has no properties', () => {
            const actual = isObjEmpty({});
            assert.isTrue(actual);
        });

        it('will return false when the object has at least one property', () => {
            const actual = isObjEmpty({ greet: 'hello' });
            assert.isFalse(actual);
        });
    })
});
