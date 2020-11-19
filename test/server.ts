import express, {Application} from 'express'
import { middleware, EnforcerError } from '../src'
import adjudicator from './adjudicator'

export default async function (): Promise<Application> {
    const app = express()
    app.use(express.json())

    const handleClaims = await middleware(adjudicator)
    app.use('/claims', handleClaims) // Handle requests to the claims endpoint
    app.use(EnforcerError) // Handle errors thrown by the

    return app
}
