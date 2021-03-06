<h1 align="center">Claims Engine Middleware</h1>

<p align="center">An Express middleware function to facilitate the rapid use of the <a href="https://github.com/byu-oit/ts-claims-engine">Claims Adjudicator Module (CAM)</a></p>

<p align="center">
    <a href="https://github.com/byu-oit/ts-claims-engine-middleware/actions?query=workflow%3ACI">
      <img alt="CI" src="https://github.com/byu-oit/ts-claims-engine-middleware/workflows/CI/badge.svg" />
    </a>
    <a href="https://codecov.io/gh/byu-oit/ts-claims-engine-middleware">
      <img src="https://codecov.io/gh/byu-oit/ts-claims-engine-middleware/branch/master/graph/badge.svg" />
    </a>
    <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/byu-oit/ts-claims-engine-middleware" />
    <a href="https://prettier.io/"><img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier" /></a>
</p>

<br>

## Installation
`npm i @byu-oit/ts-claims-engine-middleware`

<br>

## Introduction
The Claims Adjudicator Middleware is an _[express](https://expressjs.com)_ middleware function. Its purpose is to make implementing the CAM as convenient as possible to developers already using the express server framework. It is assumed that those reading this already have a knowledge of the Claims Engine -- its use and implementation. To read more about the Claims Engine, visit the [Claims Adjudicator Module GitHub Repo](https://github.com/byu-oit/ts-claims-engine).

<br>

## Usage & Examples

### 1. Define CAM
```js
// example/adjudicator.js
const {ClaimsAdjudicator, Concept, Relationships} = require('@byu-oit/ts-claims-engine')

// Static subjects for demonstrative purposes.
const subjects = {...}

const concepts = [ // Create concepts
    Concept.Boolean({
        name: 'subject_exists',
        description: 'The subject exists',
        longDescription: 'Determines whether a subject is a known entity within the domain.',
        relationships: [Relationships.EQ, Relationships.NE],
        qualifiers: ['age'],
        async getValue (id, qualifiers) {
            if (qualifiers && qualifiers.age) {
                return subjects[id] !== undefined && subjects[id].age === qualifiers.age
            } else {
                return subjects[id] !== undefined
            }
        }
    }),
    Concept.Number({
        name: 'age',
        description: 'The subject is of age',
        longDescription: 'Determine if the subject is of an age',
        relationships: [Relationships.GT, Relationships.GTE, Relationships.LT, Relationships.LTE, Relationships.EQ, Relationships.NE],
        async getValue (id) {
            return subjects[id].age
        }
    })
]

module.exports = new ClaimsAdjudicator(concepts) // Export adjudicator instance
```


### 2. Define the server with adjudicator middleware
```js
// example/server.js
const express = require('express')
const { middleware, EnforcerError } = require('@byu-oit/ts-claims-engine-middleware')
const adjudicator = require('./adjudicator')

;(async function () {
  const app = express()

  // REQUIRED: Body parser to handle POST body
  app.use(express.json())

  // Log requests as they come in
  app.use((req, res, next) => {
    console.log(req.method + ' ' + req.path)
    return next()
  })

  // Implement claims middleware
  const handleClaims = await middleware(adjudicator)
  app.use('/claims', handleClaims)

  // Using the enforcer error middleware catches errors made related to the request format
  // If an error occurs that is not related to formatting, a 500 error response will be returned
  app.use(EnforcerError)

  // Start server
  const port = process.env.PORT || 8080
  app.listen(port, () => {
    console.log(`Server running on port: ${port}`)
  })
})()
```
<br>

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
an error occurred.

If the validation_response code is 200, then the verified property
will also be present and its boolean value is the state of the claim.

If the validation_response code is not 200, then the response will be a single metadata
object.

The CAM returns two errors:

* **400** Bad Request - The claim could not be evaluated because of an error in the 
claim declaration (e.g., an unrecognized concept or relationship). This error response
will include another property in the metadata object `validation_information` which
gives additional information about what went wrong.
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
          },
          "validation_information": [
            "Relationship gt_or_eq is not defined for concept favorite_food"
          ]
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
* **[Claims Adjudicator Module (CAM)](https://github.com/byu-oit/ts-claims-engine)**
* **[Claims Adjudicator Middleware](https://github.com/byu-oit/ts-claims-engine-middleware)**
* **[Claims Adjudicator Client](https://github.com/byu-oit/ts-claims-engine-client)**
* **[Claims Adjudicator WSO2 Request](https://github.com/byu-oit/ts-wso2-claims-request)**
