/**
* @author malaow3
* @file Perform initial DB operations
*/
import { Sequelize, DataTypes } from 'sequelize';
import { Logger } from "tslog";
const log: Logger = new Logger();


/**
 * @description - Connects to the database
 */
export async function connectDB(inst: Sequelize) {
    // connect to db
    try {
        await inst.authenticate()
        // log.info('Connection has been established successfully.');
    } catch (err) {
        log.error('Unable to connect to the database: ', err);
        process.exit(1)
    }
    // sync models
    await inst.sync({ force: false });
}