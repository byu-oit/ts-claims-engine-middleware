# ts-claims-engine-middleware
[![Build Status](https://travis-ci.org/byu-oit/ts-claims-engine-middleware.svg?branch=master)](https://travis-ci.org/byu-oit/ts-claims-engine-middleware)
[![Coverage Status](https://coveralls.io/repos/github/byu-oit/ts-claims-engine-middleware/badge.svg?branch=master)](https://coveralls.io/github/byu-oit/ts-claims-engine-middleware?branch=master)
![GitHub package.json version](https://img.shields.io/github/package-json/v/byu-oit/ts-claims-engine-middleware)

## Installation
`npm i @byu-oit/ts-claims-engine-middleware`

## Introduction
The Claims Adjudicator Middleware is an _![express](https://expressjs.com)_ middleware function. It's purpose is to make implementing the CAM as convenient as possible to developers already using the express server framework. It is assumed that those reading this already have a knowledge of the Claims Engine -- its use and implementation. To read more about the Claims Engine, visit the [Claims Adjudicator Module GitHub Repo](https://github.com/byu-oit/ts-claims-engine).

## Example

### 1. Define CAM
```js
// adjudicator.js
const {ClaimsAdjudicator} = require('@byu-oit/ts-claims-engine')

const subjects = {...} // Static value for demonstrative purposes

const concepts = { // Create concepts
    subject_exists: new Concept({
        description: 'The subject exists',
        longDescription: 'Determines whether a subject is a known entity within the domain.',
        type: 'boolean',
        relationships: ['eq', 'not_eq'],
        qualifiers: ['age'],
        getValue: async (id, qualifiers) => {
            if (qualifiers && qualifiers.age) {
                return subjects[id] !== undefined && subjects[id].age === qualifiers.age
            } else {
                return subjects[id] !== undefined
            }
        }
    }),
    age: new Concept({
        description: 'The subject is of age',
        longDescription: 'Determine if the subject is of an age',
        type: 'int',
        relationships: ['gt', 'gt_or_eq', 'lt', 'lt_or_eq', 'eq', 'not_eq'],
        getValue: async (id) => subjects[id].age
    })
}

export default new ClaimsAdjudicator(concepts) // Export adjudicator instance
```


### 2. Define server with adjudicator middleware
```js
// app.js
const express = require('express')
const {middleware} = require('@byu-oit/ts-claims-engine-middleware')
const adjudicator = require('./adjudicator')

const app = express()
app.use(middleware(adjudicator))

const port = process.env.PORT || 8080
app.listen(port, () => {
    console.log(`Server running on port: ${port}`)
})
```


## API

### HTTP Responses

Aside from HTTP connection and service errors (e.g., 400 and 500), the CAM will always
response with 200 (Success). The response object must be inspected to determine whether
the claim was validated.

### Verification Response Object and Response Codes

A verification response is a JSON object that can be considered an associative array.
Each property on the object is a verification response object what has two properties.

```json
    {
        "verified": true,
        "metadata": {
          "validation_response": {
            "code": 200,
            "message": "Success"
          }
        }
    }
```

The metadata property will always be present and must be inspected to determine whether
an error occurred. If the validation_response code is 200, then the verified property
will also be present and its boolean value is the state of the claim.

The CAM returns two errors:

* **400** Bad Request - The claim could not be evaluated because of an error in the claim declaration (e.g., an unrecognized concept or relationship).
* **404** Not Found - The subject ID could not be resolved to a resource.

### Endpoints

#### GET /

A GET on the CAM endpoint returns a list of the concept identifiers that can be
used in claims submitted to this domain.

```json
    {
      "metadata": {
        "validation_response": {
          "code": 200,
          "message": "Success"
        }
      },
      "values": [
        {
          "id": "age",
          "type": "integer",
          "range": "0-120"
        }
      ]
    }
```

Note: The "type" and "range" properties are hints. The CAM will simply not
verify a claim if the reference value is nonsensical.

#### PUT /

A PUT on the CAM endpoint must include a JSON request body that is an associative array
of one or more independent claims, where the property key is a unique claim identifier
and the property value is a claim object.

```json
    {
      "claim1": "<claim object>",
      "claim2": "<claim object>",
      "claim3": "<claim object>"
    }
```

Each claim object takes the following form:

```json
    {
      "subject": "123456789",
      "mode": "ALL",
      "claims": [
        {
          "concept": "age",
          "relationship": "gt_or_eq",
          "value": "21",
          "qualifier": { "ageOffset": -5 }
        }
      ]
    }
```

An example claim request:

```json
    {
      "claim_id1": {
        "subject": "123456789",
        "mode": "ALL",
        "claims": [
          {
            "concept": "age",
            "relationship": "gt_or_eq",
            "value": "21"
          }
        ]
      },
      "claim_id2": {
        "claim_id": "2",
        "subject": "987654321",
        "mode": "ALL",
        "claims": [
          {
            "concept": "age",
            "relationship": "gt_or_eq",
            "value": "21"
          }
        ]
      }
    }
```

#### PUT / Response

The CAM responds with an associative array where each property's key matches the
key given in the request body and each property's value is a claim response
object.

```json
    {
      "claim1": "<claim response object>",
      "claim2": "<claim response object>",
      "claim3": "<claim response object>"
    }
```

Each claim response object takes the following form:

```json
    {
      "verified": true,
      "metadata": {
        "validation_response": {
          "code": 200,
          "message": "Success"
        }
      }
    }
```

The "verified" property is only present if the validation_response code is 200.
Otherwise, the validation_response contains error information.

An example claim response (including both validation states and both error responses):

```json
	{
      "claim_id1": {
        "verified": true,
        "metadata": {
          "validation_response": {
            "code": 200,
            "message": "Success"
          }
        }
      },
      "claim_id2": {
        "verified": false,
        "metadata": {
          "validation_response": {
            "code": 200,
            "message": "Success"
          }
        }
      },
      "claim_id3": {
        "metadata": {
          "validation_response": {
            "code": 400,
            "message": "Bad Request"
          }
        }
      },
      "claim_id4": {
        "metadata": {
          "validation_response": {
            "code": 404,
            "message": "Not Found"
          }
        }
      }
    }
```

## Appendix

### Related Packages
* **![Claims Adjudicator Module (CAM)](https://github.com/byu-oit/ts-claims-engine)**
* **![Claims Adjudicator Middleware](https://github.com/byu-oit/ts-claims-engine-middleware)**
* **![Claims Adjudicator Client](https://github.com/byu-oit/ts-claims-engine-client)**
* **![Claims Adjudicator WSO2 Request](https://github.com/byu-oit/ts-wso2-claims-request)**
