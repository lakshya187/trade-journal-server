const uuid = require("uuid");
const crypto = require("crypto");
const jsSHA = require("jssha/dist/sha1");
const axios = require("axios");
const imageToBase64 = require("image-to-base64");
const fs = require("fs");
const base64 = require("base-64");
const twitter = require("twitter");
const { render } = require("../app");
const handlebars = require("express-handlebars");
const createHtmlForTemplate = require("../utils/template");
const Options = require("../models/optionsModel");
const htmlToImage = require("node-html-to-image");

const generateBase64Image = () => {
  try {
    return imageData;
  } catch (e) {
    console.log(e);
  }
};

const sortString = (requiredParameters, endpoint) => {
  let base_signature_string = "POST&" + encodeURIComponent(endpoint) + "&";
  const requiredParameterKeys = Object.keys(requiredParameters);
  for (let i = 0; i < requiredParameterKeys.length; i++) {
    if (i == requiredParameterKeys.length - 1) {
      base_signature_string += encodeURIComponent(
        requiredParameterKeys[i] +
          "=" +
          requiredParameters[requiredParameterKeys[i]]
      );
    } else {
      base_signature_string += encodeURIComponent(
        requiredParameterKeys[i] +
          "=" +
          requiredParameters[requiredParameterKeys[i]] +
          "&"
      );
    }
  }
  return base_signature_string;
};

const signing = (signature_string, consumer_secret) => {
  let hmac;
  if (typeof signature_string !== "undefined" && signature_string.length > 0) {
    //console.log('String OK');
    if (typeof consumer_secret !== "undefined" && consumer_secret.length > 0) {
      // console.log('Secret Ok');

      const secret = encodeURIComponent(consumer_secret) + "&";

      let shaObj = new jsSHA("SHA-1", "TEXT", {
        hmacKey: { value: secret, format: "TEXT" },
      });
      shaObj.update(signature_string);

      hmac = encodeURIComponent(shaObj.getHash("B64"));
    }
  }
  return hmac;
};

exports.generateSignature = async (req, res) => {
  try {
    const oauth_timestamp = Math.floor(Date.now() / 1000);
    const oauthNonceObject = new jsSHA("SHA-1", "TEXT", { encoding: "UTF8" });
    oauthNonceObject.update(Math.round(new Date().getTime() / 1000.0));
    const oauth_nonce = oauthNonceObject.getHash("HEX");

    const endpoint = "https://api.twitter.com/oauth/request_token";
    const oauth_consumer_key = process.env.AUTH_CONSUMER_KEY;
    const oauth_consumer_secret = process.env.AUTH_CONSUMER_SECRET;
    const requiredParameters = {
      oauth_consumer_key,
      oauth_nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp,
      oauth_version: "1.0",
    };
    const sorted_string = sortString(requiredParameters, endpoint);
    const oauth_signature = signing(sorted_string, oauth_consumer_secret);

    const config = {
      method: "post",
      url: endpoint,
      headers: {
        Authorization: `OAuth oauth_consumer_key=${process.env.AUTH_CONSUMER_KEY},oauth_nonce=${oauth_nonce},oauth_signature=${oauth_signature},oauth_signature_method="HMAC-SHA1",oauth_timestamp=${oauth_timestamp},oauth_version="1.0"`,
        "Content-Type": "application/json",
      },
    };
    const response = await axios(config);
    const responseSTR = JSON.stringify(response.data);
    const responseTokens = responseSTR.split("&");
    const oauth_token = responseTokens[0].split("=")[1];
    const oauth_verifier = responseTokens[1].split("=")[1];
    const oauthString = `https://api.twitter.com/oauth/authorize?oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}`;
    res.status(200).json({
      status: "success",
      oauthString,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
    });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const { oauthToken } = req.body;
    const { verifier } = req.body;
    console.log(oauthToken, verifier);

    const response = await axios.post(
      `https://api.twitter.com/oauth/access_token?oauth_verifier=${verifier}&oauth_token=${oauthToken}`,
      null
    );
    const oauth_token = response.data.split("&")[0].split("=")[1];
    const oauth_verifier = response.data.split("&")[1].split("=")[1];
    const user = response.data.split("&")[2].split("=")[1];
    res.status(200).json({
      status: "success",
      oauth_token,
      oauth_verifier,
      user,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
    });
  }
};

exports.tweetImage = async (req, res) => {
  try {
    const { token, verifier, message, id } = req.body;

    console.log(req.body.id);
    const client = new twitter({
      consumer_key: process.env.AUTH_CONSUMER_KEY,
      consumer_secret: process.env.AUTH_CONSUMER_SECRET,
      access_token_key: token,
      access_token_secret: verifier,
    });
    console.log(id);
    const trade = await Options.findById(id);

    const details = {
      ticker: trade.ticker,
      strategyName: trade.strategyName,
      expireDate: new Date(trade.expireDate).toDateString(),
      netPremium: trade.netPremium,
      legLength: trade.leg.length,
      netProfitLoss: trade.netProfitLoss,
      typeOfTrade: trade.typeOfTrade,
    };
    const html = createHtmlForTemplate("tweet.html", details);
    const rawImage = await htmlToImage({
      output: "./image.png",
      html: html,
    });
    const image = Buffer.from(rawImage, "base64");

    const responseFromUpload = await client.post("media/upload", {
      media: image,
    });
    const status = {
      status: message,
      media_ids: responseFromUpload.media_id_string,
    };
    const updateStatus = await client.post("statuses/update", status);
    console.log(updateStatus);
    res.status(200).json({
      status: "success",
    });
    // res.send(rawImage);
    res.status(200).json({
      status: "success",
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};
