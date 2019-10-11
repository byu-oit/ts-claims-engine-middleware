import express from 'express';
import * as CAM from '../src';
import adjudicator from './adjudicator'
import { Server } from 'http';

const app = express();
let server: Server | null = null;

export const start = async () => {
    app.use(express.json());

    const handleClaims = await CAM.middleware(adjudicator);
    app.use('/claims', handleClaims);

    const port = 8080;
    server = app.listen(port, () => {
        console.log('Server listening on port:', port);
    })
};

export const stop = async () => {
    if (server) {
        server.close();
        console.log('Server closed');
    }
};
