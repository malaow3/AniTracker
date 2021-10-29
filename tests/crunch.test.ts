import { Logger } from "tslog";
const log: Logger = new Logger();
require('dotenv').config();
import { CrunchyAuth, crunchyLogin, getCrunchyHistory } from '../src/crunchy';


test('Test crunchy login', async () => {
    try {
        await crunchyLogin(
            process.env.crunchyusername as string,
            process.env.crunchypassword as string
        )
    } catch (error) {
        expect(error).toBeNull();
    }
})
test('Test failed crunchy login', async () => {
    try {
        await crunchyLogin(
            "",
            ""
        )
    } catch (error) {
        expect(error).not.toBeNull();
    }
})

test('Test get user history', async () => {
    try {
        let resp = await crunchyLogin(
            process.env.crunchyusername as string,
            process.env.crunchypassword as string
        ) as CrunchyAuth
        let history = await getCrunchyHistory(resp)
        expect(history).not.toBeNull();
        expect(Object.keys(history).length).not.toBe(0);

    } catch (error) {
        expect(error).toBeNull();
    }
})

test('Test get empty user history', async () => {
    try {
        let resp = await crunchyLogin(
            "abbbba@fake.com",
            "bbbba01"
        ) as CrunchyAuth
        let history = await getCrunchyHistory(resp)
        expect(history).not.toBeNull();
        expect(Object.keys(history).length).toBe(0);

    } catch (error) {
        expect(error).toBeNull();
    }
})