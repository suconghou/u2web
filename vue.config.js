const resolve = require('path').resolve;

const target = 'http://127.0.0.1:6060'
module.exports = {
    publicPath: process.env.production ? "https://assets.suconghou.cn/u2web/static/dist" : "/",
    productionSourceMap: false,
    configureWebpack: {
        externals: {
            vue: 'Vue',
            'vue-router': 'VueRouter',
            axios: 'axios',
        },
        resolve: {
            alias: {
            }
        }
    },
    devServer: {
        proxy: {
            '/video/api': {
                target,
                changeOrigin: true
            },
            '/video/.*\.(json|ts|jpg)': {
                target,
                changeOrigin: true
            },
            '/static': {
                target,
                changeOrigin: true
            }
        }
    }
}
