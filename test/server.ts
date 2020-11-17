import express, {Application} from 'express'
import * as CAM from '../src'
import adjudicator from './adjudicator'

export default async function (): Promise<Application> {
    const app = express()
    app.use(express.json())

    const handleClaims = await CAM.middleware(adjudicator)
    app.use('/claims', handleClaims)
    return app
}
