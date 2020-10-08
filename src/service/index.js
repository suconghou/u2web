import Vue from 'vue'
import Toast from 'muse-ui-toast';
Vue.use(Toast);
import axios from 'axios'

// 编译为组件时 videoBaseURL 必须为https绝对地址
const abs = 'https://stream.pull.workers.dev/video' // "https://video.feds.club/video"
let vBaseURL = localStorage.getItem("baseurl") || abs || '/video';
if (abs) {
    vBaseURL = vBaseURL.split(';').filter(v => v.substr(0, 4) == 'http').join(';')
}
export const videoBaseURL = vBaseURL
const apiBaseURL = localStorage.getItem("apibaseurl") || 'https://r.suconghou.cn/video/api/v3' || '/video/api/v3';

export const defaultImg = 'https://assets.suconghou.cn/defaultImg.png'

const errors = (e) => {
    console.error(e)
    Toast.error(e);
}

const filter = (res) => {
    const { status, statusText, data } = res;
    if (status >= 200 && status < 300) {
        res.ok = true;
        return res;
    }
    res.ok = false;
    if (data.error && data.error.errors && data.error.errors[0] && data.error.errors[0].message) {
        errors(data.error.errors[0].message)
    } else {
        errors(statusText)
    }
    return res;
}

export const httpCreate = (baseURL, timeout = 60e3) => {
    const instance = axios.create({
        baseURL,
        timeout,
        validateStatus: function (status) {
            return true
        },
    });
    instance.interceptors.response.use(filter);
    return instance;
};


export const imgSrc = (id) => {
    return videoBaseURL.split(';')[0] + `/${id}.jpg`;
}

const http = httpCreate(apiBaseURL)
const player = httpCreate(videoBaseURL.split(';')[0])

export const mostPopularVideos = (regionCode = 'HK', videoCategoryId = 1) => {
    const params = {
        chart: 'mostPopular',
        maxResults: 30,
        regionCode,
        videoCategoryId
    }
    return http.get('/videos', { params })
}

export const videoInfo = (id) => {
    const params = {
        id
    }
    return http.get('/videos', { params })
}

export const playerInfo = (id) => {
    return player.get(`/${id}.json`)
}

export const search = (q, pageToken = undefined, channelId = undefined, regionCode = undefined, type = 'video', maxResults = 20) => {
    let order = undefined;
    if (!q) {
        order = 'viewCount';
    }
    const params = {
        q,
        type,
        order,
        channelId,
        regionCode,
        pageToken,
        maxResults
    }
    return http.get('/search', { params })
}

export const relatedVideo = (relatedToVideoId, pageToken = undefined, type = 'video', maxResults = 30) => {
    const params = {
        type,
        relatedToVideoId,
        pageToken,
        maxResults
    }
    return http.get('/search', { params })
}

export const channels = (id) => {
    const params = {
        id
    }
    return http.get('/channels', { params })
}

export const playlists = (id) => {
    const params = {
        id
    }
    return http.get('/playlists', { params })
}


export const playlistsInChannel = (channelId, pageToken = undefined, maxResults = 20) => {
    const params = {
        channelId,
        maxResults,
        pageToken
    }
    return http.get('/playlists', { params })
}

export const playlistItems = (playlistId, pageToken = undefined, maxResults = 30) => {
    const params = {
        playlistId,
        pageToken,
        maxResults
    }
    return http.get('/playlistItems', { params })
}