const path = require("path");
const express = require("express");
const AWS = require('aws-sdk');
require('dotenv').config();

process.env.AWS_SDk_JS_SUPPRESS_MAITENANCE_MODE_MESSAGE = '1';
AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  region: process.env.REGION
});

const configViewEngine = (app) => {
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "../views"));

    app.use(express.json({ extended: false }));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static('./views'));
    app.use(express.static(path.join(__dirname, '../public')));
};
module.exports = configViewEngine;