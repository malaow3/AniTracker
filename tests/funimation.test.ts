import { Logger } from "tslog";
const log: Logger = new Logger();
require('dotenv').config();
import { funimationLogin, getHistory } from '../src/funimation';

test('Test Funimation login', async () => {
    expect(await funimationLogin(
        process.env.funusername as string,
        process.env.funpassword as string
    )).not.toBeNull();
})

test("Test failed funimation login", async () => {
    try {
        await funimationLogin("", "")
    } catch (err: any) {
        expect(err).not.toBeNull();
    }
})

test("Test get history", async () => {
    try {
        let token = await funimationLogin(
            process.env.funusername as string,
            process.env.funpassword as string
        )
        let history = await getHistory(token)
        expect(history.length).not.toBe(0);
    } catch (err: any) {
        expect(err).toBeNull();
    }
})

test("Test empty get history", async () => {
    try {
        let token = await funimationLogin(
            "aaabbb123@fake.com",
            "Fakefake01!"
        )
        let history = await getHistory(token)
        expect(Object.keys(history).length).toBe(0);
    } catch (err: any) {
        expect(err).toBeNull();
    }
})