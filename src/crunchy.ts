/**
* @author malaow3
* @file Perform crunchyroll operations
*/
import { Logger } from "tslog";
const log: Logger = new Logger();
import axios, { AxiosResponse } from 'axios';
import { BaseShow } from "..";
import { AxiosRequestConfig } from "axios";
import qs = require('qs');
import { formatDate } from "./formatdate";
var FormData = require('form-data');

/**
 * @description Get the session ID for the user
 * @returns {*}  {(Promise<string | null>)} The session ID or null if it could not be found
 */
async function getSessionID(): Promise<string | null> {

    var data = new FormData();
    data.append('device_id', 'cbbf913c-51f0-488c-91c1-133f9b661814');
    data.append('device_type', 'com.crunchyroll.crunchyroid');
    data.append('access_token', 'WveH9VkPLrXvuNm');

    var config = {
        method: 'post',
        url: 'https://api.crunchyroll.com/start_session.0.json',
        headers: {
            ...data.getHeaders()
        },
        data: data
    } as AxiosRequestConfig;

    try {
        let resp = await axios(config) as any;
        return Promise.resolve(resp.data.data.session_id);
    } catch (err: any) {
        return Promise.reject(err)
    }
}

/** 
 * @description CrunchyAuth is an object containing all the information needed to authenticate with crunchyroll  
*/
export type CrunchyAuth = {
    token: string,
    userID: string,
    etp: string,
    sessionID: string,
    policy: string,
    signature: string,
    key_pair_id: string,
}

type etpResult = {
    etp_rt: string, userID: string
}

/**
 * @description Get the etp and userID for the user
 * @param {string} sessionID The session ID needed for authentication
 * @param {string} username The username of the user
 * @param {string} password The password of the user
 * @returns {*}  {(Promise<etpResult | null>)} The etp and userID or null if it could not be found
 */
async function get_etp(sessionID: string, username: string, password: string): Promise<etpResult | null> {
    var data = qs.stringify({
        'session_id': sessionID,
        'account': username,
        'password': password,
    });
    var config = {
        method: 'post',
        url: 'https://api.crunchyroll.com/login.0.json',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: data
    } as AxiosRequestConfig;

    try {
        let resp = await axios(config) as any;
        let axresp = resp as AxiosResponse<any>;
        let etp_rt = ""
        for (let cookie of axresp.headers["set-cookie"] as string[]) {
            if (cookie.startsWith("etp_rt=")) {
                etp_rt = cookie.split("=")[1];
                break;
            }
        }
        if (etp_rt == "") {
            return Promise.reject("No etp_rt cookie found")
        }

        return Promise.resolve({
            etp_rt: etp_rt,
            userID: resp.data.data.user.etp_guid
        })
    } catch (err: any) {
        return Promise.reject(err)
    }
}


/**
 * @description crunchyLogin performs the login process for crunchyroll and returns the auth object
 * @export
 * @param {string} username The username of the user
 * @param {string} password The password of the user
 * @returns {*}  {(Promise<CrunchyAuth | null>)} The auth object or null if it could not be found
 */
export async function crunchyLogin(username: string, password: string): Promise<CrunchyAuth | null> {
    let sessionID: string
    try {
        sessionID = await getSessionID() as string;
    } catch (err) {
        return Promise.reject(err)
    }

    if (username == "" || password == "") {
        return Promise.reject("Username or password is empty")
    }

    let etp_rt: string
    try {
        let resp = await get_etp(sessionID, username, password) as etpResult;
        etp_rt = resp.etp_rt;
    }
    catch (err) {
        return Promise.reject(err)
    }
    var data = qs.stringify({
        'grant_type': 'etp_rt_cookie'
    });
    var config = {
        method: 'post',
        url: 'https://beta-api.crunchyroll.com/auth/v1/token',
        headers: {
            'authority': 'beta-api.crunchyroll.com',
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/x-www-form-urlencoded',
            'authorization': 'Basic bm9haWhkZXZtXzZpeWcwYThsMHE6',
            'sec-ch-ua-mobile': '?0',
            'origin': 'https://beta.crunchyroll.com',
            'sec-fetch-site': 'same-site',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            'referer': 'https://beta.crunchyroll.com/',
            'accept-language': 'en-US,en;q=0.9',
            'cookie': 'session_id=' + sessionID + '; etp_rt=' + etp_rt + ';'
        },
        data: data
    } as AxiosRequestConfig;

    try {
        let resp = await axios(config) as any;
        let token = resp.data.access_token
        let UID = resp.data.account_id

        let imageCredconfig = {
            method: 'get',
            url: 'https://beta-api.crunchyroll.com/index/v2',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Cookie': `etp_rt=${etp_rt}; session_id=${sessionID}`
            }
        } as AxiosRequestConfig;

        let imageresp = await axios(imageCredconfig) as any;
        let policy;
        let signature;
        let key_pair_id;
        try {
            policy = imageresp.data.cms.policy
            signature = imageresp.data.cms.signature
            key_pair_id = imageresp.data.cms.key_pair_id
        } catch (error) {
        }

        return Promise.resolve({
            token: token,
            userID: UID,
            etp: etp_rt,
            sessionID: sessionID,
            policy: policy,
            signature: signature,
            key_pair_id: key_pair_id
        })
    }
    catch (error) {
        return Promise.reject(error)
    }
}

/**
 * @description getCrunchyHistory retrieves a list of a users watch history
 * @export
 * @param {string} token - the users crunchyroll access token
 * @param {string} userID - the users crunchyroll user id
 * @returns {*}  {Promise<any>} a JSON object where each key is a show title and the value is 
 *                              a BaseShow object
 */
export async function getCrunchyHistory(auth: CrunchyAuth): Promise<any> {
    let page = 1;
    let results = {} as any;
    var config = {
        method: 'get',
        headers: {
            'Authorization': 'Bearer ' + auth.token,
            'Cookie': `etp_rt=${auth.etp}; session_id=${auth.sessionID}`
        }
    } as AxiosRequestConfig;

    let first = true;
    let next = true;
    let response: any;

    while (first == true || next == true) {
        first = false;
        config.url = `https://beta-api.crunchyroll.com/content/v1/watch-history/${auth.userID}?page_size=25&page=${page}&locale=en-US`
        try {
            response = await axios(config) as any;
            if (response.data.next_page) {
                next = true;
                page++;
            } else {
                next = false;
            }
            for (let item of response.data.items) {
                if (item.fully_watched !== true) {
                    continue
                }
                let title = item.panel.episode_metadata.series_title;

                let seasonID = item.panel.episode_metadata.season_id;
                let seriesID = item.panel.episode_metadata.season_id;
                let UID = title + "|" + seriesID + "|" + seasonID
                if (!results[UID]) {
                    let seriesLink = item.panel.__links__["episode/series"]["href"]
                    let imageLink = ""
                    var imageconfig = {
                        method: 'get',
                        url: `https://beta-api.crunchyroll.com${seriesLink}?locale=en-US&Signature=${auth.signature}&Policy=${auth.policy}&Key-Pair-Id=${auth.key_pair_id}`,
                        headers: {
                            'Authorization': 'Bearer ' + auth.token,
                            'Cookie': `etp_rt=${auth.etp}; session_id=${auth.sessionID}`
                        }
                    } as AxiosRequestConfig;
                    try {
                        let imageresp = await axios(imageconfig) as any;
                        let images = imageresp.data.images.poster_wide[0]
                        imageLink = images[images.length - 1].source
                    } catch (err) {
                        log.error(err)
                    }

                    results[UID] = {
                        name: title,
                        platform: "Crunchyroll",
                        progress: item.panel.episode_metadata.episode_number,
                        season: item.panel.episode_metadata.season_number,
                        image: imageLink,
                        showID: seriesID,
                        seasonID: seasonID,
                        watched: formatDate(item.date_played),
                        watchedGMT: item.date_played,
                    } as BaseShow;
                } else {
                    let currentSeason = results[UID].season;
                    let currentEpisode = results[UID].progress;
                    if (parseInt(item.panel.episode_metadata.season_number) >= parseInt(currentSeason)) {
                        if (parseInt(item.panel.episode_metadata.episode_number) > parseInt(currentEpisode)) {
                            results[UID].progress = item.panel.episode_metadata.episode_number;
                            results[UID].season = item.panel.episode_metadata.season_number;
                        }
                    }
                }
            }
        } catch (err) {
            log.error("Error when fetching crunchyroll history")
            return Promise.reject("Failed to get Crunchyroll history")
        }
    }

    return Promise.resolve(results);

}