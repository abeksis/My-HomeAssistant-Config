var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: "./google-calendar-card.js",
    output: {
        filename: "google-calendar-card.js",
        path: __dirname + "/dist"
    },
    mode: "development"
};