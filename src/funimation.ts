/**
* @author malaow3
* @file Perform funimation operations
*/
import { Logger } from "tslog";
const log: Logger = new Logger();
import axios from 'axios';
import { AxiosRequestConfig, AxiosError } from "axios";
import qs = require('qs');
import { BaseShow } from "../index"
import { formatDate } from "./formatdate";



/**
 * @description Perform funimation login
 * @export
 * @param {string} username funimation username
 * @param {string} password funimation password
 * @returns {*}  {Promise<string>} funimation login token
 */
export async function funimationLogin(username: string, password: string): Promise<string> {
    var data = {
        'username': username,
        'password': password
    };
    var config = {
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify(data),
        url: "https://prod-api-funimationnow.dadcdigital.com/api/auth/login/"
    } as AxiosRequestConfig;

    try {
        let response = await axios(config) as any;
        return Promise.resolve(response.data.token);
    } catch (error: any) {
        let axerr = error as AxiosError;
        return Promise.reject(axerr.message);
    }
}


/**
 * @description Gets funimation user history
 * @export
 * @param {string} token funimation login token
 * @returns {*}  {Promise<any>} funimation user history object
 */
export async function getHistory(token: string): Promise<any> {
    let offset = 0;
    var config = {
        method: 'get',
        url: 'https://prod-api-funimationnow.dadcdigital.com/api/source/funimation/history/?return_all=true&offset=' + offset + '&limit=25',
        headers: {
            'Authorization': 'Token ' + token,
        }
    } as AxiosRequestConfig;

    let results = {} as any;
    let first = true;
    let response: any;
    while (first == true || offset > response.data.total) {
        first = false;
        config.url = 'https://prod-api-funimationnow.dadcdigital.com/api/source/funimation/history/?return_all=true&offset=' + offset + '&limit=25'
        try {
            response = await axios(config) as any;
            offset = response.data.count
            for (let item of response.data.items) {
                if (item.watched == 0) {
                    continue
                }
                let title = item.show_title
                let UID = title + "|" + item.show_id + "|" + item.season_id;
                if (!results[UID]) {
                    results[UID] = {
                        name: title,
                        platform: "Funimation",
                        progress: item.episode_number,
                        season: item.season_num,
                        image: item.title_images.apple_horizontal_banner_show,
                        showID: item.show_id,
                        seasonID: item.season_id,
                        watched: formatDate(item.last_watched),
                        watchedGMT: item.last_watched
                    } as BaseShow;
                } else {
                    let currentSeason = results[UID].season;
                    let currentEpisode = results[UID].progress;
                    if (parseInt(item.season_num) >= parseInt(currentSeason)) {
                        if (parseInt(item.episode_number) > parseInt(currentEpisode)) {
                            results[UID].progress = item.episode_number;
                            results[UID].season = item.season_num;
                        }
                    }
                }
            }
        } catch (error: any) {
            return Promise.reject("Failed to get Funimation history")
        }
    }

    return Promise.resolve(results)
}