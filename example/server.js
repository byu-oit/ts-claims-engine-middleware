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
