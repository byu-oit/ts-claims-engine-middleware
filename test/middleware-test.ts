import {ClaimsAdjudicator, Modes, Relationships} from '@byu-oit/ts-claims-engine'
import {Request, Response, Application} from 'express'
import chai from 'chai'
import chaiHttp from 'chai-http'

import claimsController, {Controller} from '../src/controllers/claims'
import {generateMetadataResponseObj, generateValidationResponseObj} from '../src/controllers/util'
import {testClaims, testConcepts} from './static'
import createApp from './server'
import _ = require('lodash')
import {EnforcerError} from "../src";

chai.use(chaiHttp)

describe('Claims Adjudicator Middleware', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const res = {status: (code: number) => ({send: (res: unknown) => res})}

    describe('Server Integration', () => {
        let app: Application

        before(async () => {
            app = await createApp()
        })

        it('will request the getConcepts endpoint on the server', async () => {
            const expected = {
                metadata: {
                    validation_response: {
                        code: 200,
                        message: 'Success'
                    }
                },
                values: [
                    {
                        name: 'subject_exists',
                        description: 'The subject exists',
                        longDescription: 'Determines whether a subject is a known entity within the domain.',
                        relationships: [
                            Relationships.EQ,
                            Relationships.NE
                        ],
                        qualifiers: [
                            'age'
                        ]
                    },
                    {
                        name: 'age',
                        description: 'The subject is of age',
                        longDescription: 'Determine if the subject is of an age',
                        relationships: [
                            Relationships.GT,
                            Relationships.GTE,
                            Relationships.LT,
                            Relationships.LTE,
                            Relationships.EQ,
                            Relationships.NE
                        ],
                        qualifiers: []
                    }
                ]
            }
            const actual = await chai.request(app).get('/claims')
            chai.assert.deepEqual(actual.body, expected)
        })
        it('will request the verifyClaims endpoint on the server', async () => {
            const expected = {
                1: {
                    verified: true,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                }
            }
            const actual = await chai.request(app).put('/claims').send({
                1: {
                    subject: '123456987',
                    claims: [
                        {
                            concept: 'subject_exists',
                            relationship: Relationships.EQ,
                            value: 'true'
                        }
                    ]
                }
            })
            chai.assert.deepEqual(actual.body, expected)
        })
        it('will fail with a 400 response for a poorly formatted request to verifyClaims', async () => {
            const result = await chai.request(app).put('/claims').send('')
            chai.assert.equal(result.body.metadata.validation_response.code, 400)
            chai.assert.equal(result.body.metadata.validation_information.length, 1)
            chai.assert.equal(result.status, 400)
            chai.assert.isTrue(result.clientError)
        })
        it('will fail with a 500 response for an error thrown in the OpenAPI Enforcer', async () => {
            const err = new Error('Fake Error')
            const result = EnforcerError(err, {} as Request, res as Response, () => { chai.assert.isTrue(false) })
            chai.assert.equal(result.metadata.validation_response.code, 500)
        })
    })

    describe('Controllers', () => {
        let engine: ClaimsAdjudicator
        let controllers: Controller

        beforeEach(() => {
            const goodConcepts = testConcepts.filter(concept => !['bad_cast_favorite_color', 'bad_compare_favorite_color'].includes(concept.name))
            engine = new ClaimsAdjudicator(goodConcepts)
            controllers = claimsController(engine)
        })

        it('will retrieve a collection of properties against which claims can be made', async () => {
            const expected = {
                metadata: {
                    validation_response: {
                        code: 200,
                        message: 'Success'
                    }
                },
                values: [
                    {
                        name: 'subject_exists',
                        description: 'The subject exists',
                        longDescription: 'Determines whether a subject is a known entity within the domain.',
                        relationships: [
                            Relationships.EQ,
                            Relationships.NE
                        ],
                        qualifiers: [
                            'age'
                        ]
                    },
                    {
                        name: 'age',
                        description: 'The subject is of age',
                        longDescription: 'Determine if the subject is of an age',
                        relationships: [
                            Relationships.GT,
                            Relationships.GTE,
                            Relationships.LT,
                            Relationships.LTE,
                            Relationships.EQ,
                            Relationships.NE
                        ],
                        qualifiers: []
                    },
                    {
                        name: 'height',
                        description: 'The height of the subject',
                        longDescription: 'The measured height of the subject in feet',
                        relationships: [
                            Relationships.GT,
                            Relationships.GTE,
                            Relationships.LT,
                            Relationships.LTE,
                            Relationships.EQ,
                            Relationships.NE
                        ],
                        qualifiers: []
                    },
                    {
                        name: 'favorite_color',
                        description: 'The subject has the favorite color',
                        longDescription: 'The subject considers their favorite color to be',
                        relationships: [
                            Relationships.GT,
                            Relationships.GTE,
                            Relationships.LT,
                            Relationships.LTE,
                            Relationships.EQ,
                            Relationships.NE
                        ],
                        qualifiers: []
                    },
                    {
                        name: 'name',
                        description: 'The subject has the name',
                        longDescription: 'The subjects has the name',
                        relationships: [
                            Relationships.GT,
                            Relationships.GTE,
                            Relationships.LT,
                            Relationships.LTE,
                            Relationships.EQ,
                            Relationships.NE
                        ],
                        qualifiers: []
                    },
                    {
                        name: 'favorite_food',
                        description: 'The subject has the favorite food',
                        longDescription: 'The subject considers their favorite food to be',
                        relationships: [
                            Relationships.EQ,
                            Relationships.NE
                        ],
                        qualifiers: []
                    },
                    {
                        name: 'sex',
                        description: 'The subject is of the sex',
                        longDescription: 'The subject is biologically considered',
                        relationships: [
                            Relationships.EQ,
                            Relationships.NE
                        ],
                        qualifiers: []
                    }
                ]
            }
            const actual = await controllers.claims.getConcepts({} as Request, res as Response)
            chai.assert.deepEqual(actual, expected)
        })

        it('will return a collection of claim validation responses', async () => {
            const req = {
                body: {
                    1: {
                        subject: '123456987',
                        claims: [
                            {
                                concept: 'subject_exists',
                                relationship: Relationships.EQ,
                                value: 'true'
                            }
                        ]
                    },
                    2: {
                        subject: '123456987',
                        claims: [
                            {
                                concept: 'subject_exists',
                                relationship: Relationships.NE,
                                value: 'true'
                            }
                        ]
                    },
                    3: {
                        subject: '123456987',
                        mode: Modes.ANY,
                        claims: [
                            {
                                concept: 'subject_exists',
                                relationship: Relationships.EQ,
                                qualifier: {
                                    age: 25
                                },
                                value: 'true'
                            }
                        ]
                    },
                    4: {
                        subject: '000000000',
                        claims: [
                            {
                                concept: 'subject_exists',
                                relationship: Relationships.EQ,
                                value: 'true'
                            }
                        ]
                    }
                }
            }
            const expected = {
                1: {
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success',
                        }
                    },
                    verified: true
                },
                2: {
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success',
                        }
                    },
                    verified: false
                },
                3: {
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    },
                    verified: true
                },
                4: {
                    metadata: {
                        validation_response: {
                            code: 404,
                            message: 'Not Found'
                        }
                    }
                }
            }
            const actual = await controllers.claims.validateClaims(req as Request, res as Response)
            chai.assert.deepEqual(actual, expected)
        })

        it('will return an empty response', async () => {
            const req = {
                body: {}
            }
            const expected = {}
            const actual = await controllers.claims.validateClaims(req as Request, res as Response)
            chai.assert.deepEqual(actual, expected)
        })

        it('will return true claim verification responses', async () => {
            const claims = _.pick(testClaims, Object.keys(testClaims).filter(key => key.startsWith('t')))
            const req = {
                body: claims
            }
            const expected = {
                t1: {
                    verified: true,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                t2: {
                    verified: true,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                t3: {
                    verified: true,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                t4: {
                    verified: true,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                t5: {
                    verified: true,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                t6: {
                    verified: true,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                t7: {
                    verified: true,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                t8: {
                    verified: true,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                t9: {
                    verified: true,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                }
            }
            const actual = await controllers.claims.validateClaims(req as Request, res as Response)
            chai.assert.deepEqual(actual, expected)
        })

        it('will return false claim verification responses', async () => {
            const claims = _.pick(testClaims, Object.keys(testClaims).filter(key => key.startsWith('f')))
            const req = {
                body: claims
            }
            const expected = {
                f1: {
                    verified: false,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                f2: {
                    verified: false,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                f3: {
                    verified: false,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                f4: {
                    verified: false,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                f5: {
                    verified: false,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                f6: {
                    verified: false,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                f7: {
                    verified: false,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                f8: {
                    verified: false,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                },
                f9: {
                    verified: false,
                    metadata: {
                        validation_response: {
                            code: 200,
                            message: 'Success'
                        }
                    }
                }
            }
            const actual = await controllers.claims.validateClaims(req as Request, res as Response)
            chai.assert.deepEqual(actual, expected)
        })

        it('will return bad request error claim verification responses', async () => {
            const claims = _.pick(testClaims, Object.keys(testClaims).filter(key => key.startsWith('e_bad_request')))
            const req = {
                body: claims
            }
            const expected = {
                e_bad_request_undefined_relationship: {
                    metadata: {
                        validation_response: {
                            code: 400,
                            message: 'Bad Request'
                        },
                        validation_information: [
                            'Relationship gt_or_eq is not defined for concept favorite_food'
                        ]
                    }
                },
                e_bad_request_undefined_qualifier: {
                    metadata: {
                        validation_response: {
                            code: 400,
                            message: 'Bad Request'
                        },
                        validation_information: [
                            'Qualifier height is not defined for concept subject_exists'
                        ]
                    }
                }
            }
            const actual = await controllers.claims.validateClaims(req as Request, res as Response)
            chai.assert.deepEqual(actual, expected)
        })

        it('will return internal error claim verification responses', async () => {
            const concepts = testConcepts.filter(concept => ['subject_exists', 'bad_cast_favorite_color', 'bad_compare_favorite_color'].includes(concept.name))
            engine = new ClaimsAdjudicator(concepts)
            controllers = claimsController(engine)

            const claims = _.pick(testClaims, Object.keys(testClaims).filter(key => key.startsWith('e_internal')))
            const req = {
                body: claims
            }

            const expected = {
                e_internal_bad_compare: {
                    metadata: {
                        validation_response: {
                            code: 500,
                            message: 'Internal Server Error'
                        }
                    }
                },
                e_internal_bad_cast: {
                    metadata: {
                        validation_response: {
                            code: 500,
                            message: 'Internal Server Error'
                        }
                    }
                }
            }
            const actual = await controllers.claims.validateClaims(req as Request, res as Response)
            chai.assert.deepEqual(actual, expected)
        })
    })

    describe('Metadata', () => {
        it('will return success', () => {
            const actual = generateMetadataResponseObj(200)
            const expect = {
                metadata: {
                    validation_response: {
                        code: 200,
                        message: 'Success'
                    }
                }
            }
            chai.assert.deepEqual(actual, expect)
        })

        it('will return success', () => {
            const actual = generateMetadataResponseObj(200, null)
            const expect = {
                metadata: {
                    validation_response: {
                        code: 200,
                        message: 'Success'
                    }
                }
            }
            chai.assert.deepEqual(actual, expect)
        })

        it('will return success', () => {
            const actual = generateMetadataResponseObj(200, 'Successful')
            const expect = {
                metadata: {
                    validation_response: {
                        code: 200,
                        message: 'Successful'
                    }
                }
            }
            chai.assert.deepEqual(actual, expect)
        })

        it('will return created', () => {
            const actual = generateMetadataResponseObj(201)
            const expect = {
                metadata: {
                    validation_response: {
                        code: 201,
                        message: 'Created'
                    }
                }
            }
            chai.assert.deepEqual(actual, expect)
        })

        it('will return created', () => {
            const actual = generateMetadataResponseObj(204)
            const expect = {
                metadata: {
                    validation_response: {
                        code: 204,
                        message: 'No Content'
                    }
                }
            }
            chai.assert.deepEqual(actual, expect)
        })

        it('will return bad request', () => {
            const actual = generateMetadataResponseObj(400)
            const expect = {
                metadata: {
                    validation_response: {
                        code: 400,
                        message: 'Bad Request'
                    }
                }
            }
            chai.assert.deepEqual(actual, expect)
        })

        it('will return unauthorized', () => {
            const actual = generateMetadataResponseObj(401)
            const expect = {
                metadata: {
                    validation_response: {
                        code: 401,
                        message: 'Unauthorized'
                    }
                }
            }
            chai.assert.deepEqual(actual, expect)
        })

        it('will return forbidden', () => {
            const actual = generateMetadataResponseObj(403)
            const expect = {
                metadata: {
                    validation_response: {
                        code: 403,
                        message: 'Forbidden'
                    }
                }
            }
            chai.assert.deepEqual(actual, expect)
        })

        it('will return not found', () => {
            const actual = generateMetadataResponseObj(404)
            const expect = {
                metadata: {
                    validation_response: {
                        code: 404,
                        message: 'Not Found'
                    }
                }
            }
            chai.assert.deepEqual(actual, expect)
        })

        it('will return conflict', () => {
            const actual = generateMetadataResponseObj(409)
            const expect = {
                metadata: {
                    validation_response: {
                        code: 409,
                        message: 'Conflict'
                    }
                }
            }
            chai.assert.deepEqual(actual, expect)
        })

        it('will return internal server error', () => {
            const actual = generateMetadataResponseObj(500)
            const expect = {
                metadata: {
                    validation_response: {
                        code: 500,
                        message: 'Internal Server Error'
                    }
                }
            }
            chai.assert.deepEqual(actual, expect)
        })
    })

    describe('Validation Response', () => {
        it('will return a 500 response for an invalid http response code', () => {
            const actual = generateValidationResponseObj(700)
            const expect = {
                validation_response: {
                    code: 500,
                    message: 'Internal Server Error'
                }
            }
            chai.assert.deepEqual(actual, expect)
        })
    })
})
