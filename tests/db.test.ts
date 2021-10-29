import { Logger } from "tslog";
const log: Logger = new Logger();
require('dotenv').config();

import { Sequelize, DataTypes } from 'sequelize';
import { connectDB } from '../src/db';

test('Test DB connection', () => {
    let sequelize = new Sequelize(
        process.env.db as string,
        { logging: false }
    )

    try {
        connectDB(sequelize);
    } catch (err) {
        expect(err).toBe(null);
    }

});

test('Test fail DB connection', () => {
    try {
        new Sequelize('')
    } catch (err: any) {
        expect(err).not.toBe(null);
    }
});
