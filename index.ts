import { Logger } from "tslog";
const log: Logger = new Logger();
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import { connectDB } from './src/db';
import { funimationLogin, getHistory } from './src/funimation';

import express = require('express');
import morgan = require("morgan");
import path = require('path');
import basicAuth = require('express-basic-auth');

import { Sequelize, DataTypes, Model, ModelCtor } from 'sequelize';
import { CrunchyAuth, crunchyLogin, getCrunchyHistory } from "./src/crunchy";
import bodyParser = require("body-parser");
import { execSync } from "child_process";

async function getPkgJsonDir() {
    const { dirname } = require('path');
    const { constants, promises: { access } } = require('fs');

    for (let path of module.paths) {
        try {
            let prospectivePkgJsonDir = dirname(path);
            await access(path, constants.F_OK);
            return prospectivePkgJsonDir;
        } catch (e) { }
    }

}


let sequelize: Sequelize;
let Show: ModelCtor<Model<any, any>>


let loginTokens = {
    funimationToken: "",
    crunchyAuth: {} as CrunchyAuth
}

let funimationHistory: any
let crunchyHistory: any

async function main() {
    let rootdir = await getPkgJsonDir()
    require('dotenv').config({ path: path.join(rootdir, '.env') });

    try {
        sequelize = new Sequelize(
            process.env.db as string,
            { logging: false }
        )
    } catch (err) {
        log.error(err)
        log.error("Unable to create DB object, please check the .env file")
        process.exit(1)
    }

    Show = sequelize.define('Show', {
        // Model attributes are defined here
        name: DataTypes.TEXT,
        platform: DataTypes.TEXT,
        progress: DataTypes.TEXT,
        season: DataTypes.TEXT,
        showID: DataTypes.TEXT,
        seasonID: DataTypes.TEXT,
        anilistID: DataTypes.TEXT,
    }, {});

    log.info("Starting DB connection")
    await connectDB(sequelize);
    await updateCredentials()

    await updateHistory()

    const app = express();
    var favicon = require('serve-favicon');
    app.use(morgan('dev'));

    let siteuser = process.env.siteuser as string
    let sitepass = process.env.sitepass as string
    app.use(basicAuth({
        users: { [siteuser]: sitepass },
        challenge: true
    }));
    app.set('views', path.join(rootdir, 'views'));
    app.set('view engine', 'pug');
    app.use(express.json());       // to support JSON-encoded bodies
    app.use(express.urlencoded({ extended: true }));
    app.use('/public', express.static(path.join(rootdir, "dist/public")));
    app.use(favicon(path.join(rootdir, "public/images/merge.png")))
    app.get('/', async function (req, res) {
        res.render('index', {
            funimationHistory,
            crunchyHistory
        });
    });

    app.post("/", async function (req, res) {

        let item: BaseShow
        if (req.body.platform == "Funimation") {
            item = funimationHistory[req.body.uid]
            funimationHistory[req.body.uid].anilistID = req.body.anilistID
        } else {
            item = crunchyHistory[req.body.uid]
            crunchyHistory[req.body.uid].anilistID = req.body.anilistID
        }

        let newTrack = Show.build({
            name: item.name,
            platform: req.body.platform,
            progress: item.progress,
            season: item.season,
            showID: item.showID,
            seasonID: item.seasonID,
            anilistID: req.body.anilistID,
        });

        await newTrack.save();

        let eps = await getEpisodes(req.body.anilistID)
        let status = "CURRENT"
        if (item.progress == eps) {
            status = "COMPLETED"
        }
        await updateEpisodes(req.body.anilistID, item.progress, status)
        await updateHistory();
        res.send({ "success": true });

    })

    app.post("/untrack", async function (req, res) {

        let item: BaseShow
        if (req.body.platform == "Funimation") {
            item = funimationHistory[req.body.uid]
        } else {
            item = crunchyHistory[req.body.uid]
        }

        let dbitem = await Show.findOne({
            where: {
                name: item.name.toString(),
                showID: item.showID.toString(),
                platform: req.body.platform.toString(),
                seasonID: item.seasonID.toString(),
            }
        })
        if (dbitem != null) {
            await dbitem.destroy();
        }
        await updateHistory();
        res.send({ "success": true });

    })

    app.listen("42069", () => log.info(`App listening at http://localhost:42069`));

    while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000 * 125))
        await updateHistory()
    }
}

export type BaseShow = {
    name: string,
    platform: string,
    progress: string,
    season: string,
    image: string,
    showID: string,
    seasonID: string,
    watched: string,
    tracked: boolean,
    watchedGMT: Date,
}

main()

async function updateHistory() {
    try {
        log.info("Getting Funimation history")
        funimationHistory = await getHistory(loginTokens.funimationToken);
    } catch (err) {
        log.error("Error getting history")
        await updateCredentials()
        log.info("Getting Funimation history")
        funimationHistory = await getHistory(loginTokens.funimationToken);
    }

    try {
        log.info("Getting Crunchyroll history")
        crunchyHistory = await getCrunchyHistory(loginTokens.crunchyAuth);
    } catch (err) {
        log.error("Error getting history")
        await updateCredentials()
        log.info("Getting Crunchyroll history")
        crunchyHistory = await getCrunchyHistory(loginTokens.crunchyAuth);
    }

    for (let key in funimationHistory) {
        let dbitem = await Show.findAll({
            where: {
                showID: funimationHistory[key].showID.toString(),
                seasonID: funimationHistory[key].seasonID.toString(),
                platform: "Funimation"
            }
        })
        if (dbitem.length !== 1) {
            continue
        }
        let currentshow = dbitem[0] as any
        funimationHistory[key].tracked = true
        if (parseInt(funimationHistory[key].progress) > parseInt(currentshow.progress)) {
            try {
                let eps = await getEpisodes(currentshow.anilistID)
                let status = "CURRENT"
                if (funimationHistory[key].progress == eps) {
                    status = "COMPLETED"
                }
                await updateEpisodes(currentshow.anilistID, funimationHistory[key].progress, status)

            } catch (err) {
                log.error("Unable to get episode count &/or update")
            }
            currentshow.progress = funimationHistory[key].progress
            await currentshow.save()
        }

    }

    for (let key in crunchyHistory) {
        let dbitem = await Show.findAll({
            where: {
                showID: crunchyHistory[key].showID.toString(),
                seasonID: crunchyHistory[key].seasonID.toString(),
                platform: "Crunchyroll"
            }
        })
        if (dbitem.length !== 1) {
            continue
        }
        let currentshow = dbitem[0] as any
        crunchyHistory[key].tracked = true

        if (parseInt(crunchyHistory[key].progress) > parseInt(currentshow.progress)) {
            try {
                let eps = await getEpisodes(currentshow.anilistID)
                let status = "CURRENT"
                if (crunchyHistory[key].progress == eps) {
                    status = "COMPLETED"
                }
                await updateEpisodes(currentshow.anilistID, crunchyHistory[key].progress, status)

            } catch (err) {
                log.error("Unable to get episode count &/or update")
            }
            currentshow.progress = crunchyHistory[key].progress
            await currentshow.save()
        }
    }

}

async function getEpisodes(mediaID: string) {
    var data = JSON.stringify({
        query: `query {
                    Media(id: ${mediaID}) {
                        episodes
                    }
                }`,
        variables: {}
    });

    var config = {
        method: 'post',
        url: 'https://graphql.anilist.co',
        headers: {
            'Content-Type': 'application/json',
        },
        data: data
    } as AxiosRequestConfig;
    try {
        let resp = await axios(config) as any
        return resp.data.data.Media.episodes
    } catch (err) {
        log.error(err)
        return Promise.reject(null)
    }

}

async function updateEpisodes(mediaID: string, progress: string, status: string) {
    var data = JSON.stringify({
        query: `mutation{
                SaveMediaListEntry(mediaId:${mediaID}, progress:${progress}, status: ${status}) {
                    id
                }
            }`,
        variables: {}
    });

    var config = {
        method: 'post',
        url: 'https://graphql.anilist.co',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.anilistToken
        },
        data: data
    } as AxiosRequestConfig;

    try {

        let resp = await axios(config)
        return Promise.resolve("success")
    } catch (err) {
        log.error(err)
        return Promise.reject(null)
    }
}


async function updateCredentials() {
    log.info("Starting Funimation Login")
    if (process.env.funusername == "" || process.env.funpassword == "") {
        log.info("Funimation username or password not set")
    } else {
        try {
            loginTokens.funimationToken = await funimationLogin(
                process.env.funusername as string,
                process.env.funpassword as string
            );
        } catch (err) {
            try {
                execSync("ping -c 1 funimation.com")
                log.error("Invalid credentials")
                process.exit(1)
            } catch (err) {
                log.error("Funimation may be down right now.")
            }
        }

    }

    log.info("Starting Crunchyroll Login")
    if (process.env.crunchyusername == "" || process.env.crunchypassword == "") {
        log.info("Crunchyroll username or password not set")
    } else {
        try {
            loginTokens.crunchyAuth = await crunchyLogin(
                process.env.crunchyusername as string,
                process.env.crunchypassword as string
            ) as CrunchyAuth;
        } catch (err) {
            try {
                execSync("ping -c 1 crunchyroll.com")
                log.error("Invalid credentials")
                process.exit(1)
            } catch (err) {
                log.error("Crunchyroll may be down right now.")
            }
        }
    }
}
