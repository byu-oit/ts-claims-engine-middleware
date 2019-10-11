const express = require('express')
const CAM = require('../dist')
const adjudicator = require('./adjudicator')

;(async function () {
  const app = express()

  // Body parser to handle POST body
  app.use(express.json())

  // Log requests as they come in
  app.use((req, res, next) => {
    console.log(req.method + ' ' + req.path)
    return next()
  })

// Handle claims
  const handleClaims = await CAM.middleware(adjudicator)
  app.use('/claims', handleClaims)

  const port = process.env.PORT || 8080
  app.listen(port, () => {
    console.log(`Server running on port: ${port}`)
  })
})()
