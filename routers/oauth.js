const express = require("express");
const axios = require("axios");
const { stringify } = require("../utilities/utilities.js");

const router = express.Router();

const { REDIRECT_URI, CLIENT_ID, CLIENT_SECRET } = process.env;
const oauthQuery = {
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: "code",
  scope: "identify guilds"
};

router.get("/login", (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?${stringify(
    oauthQuery
  )}`;
  console.log(url)
  res.redirect(url);
});

router.get("/logout", (req, res) => {
  req.session.discord = null
  res.redirect("/");
})

router.get("/callback", async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.redirect("/");
  
  // Check that the code was provided
  if (!code) {
    return res.status(400).json({
      status: 400,
      message: 'Missing "code" query parameter'
    });
  }

  // Call the Discord API with the provided exchange code
  const response = await axios
    .post(
      "https://discord.com/api/oauth2/token",
      stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        scope: oauthQuery.scope
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    )
    .catch(err => null);

  // Check that response was successful
  if (!response) {
    return res.status(500).json({
      status: 500,
      message: "Unkown error"
    });
  }


  const { access_token, refresh_token, expires_in } = response.data;

  // Set cookies for access_token and refresh_token
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

  res.cookie("access_token", access_token, {
    expire: new Date() + expires_in * 1000 // Set cookie expire date
  });
  res.cookie("refresh_token", refresh_token);

  if(!req.session.tokens){
    req.session.tokens = {
      access: access_token,
      refresh: refresh_token,
    }
  }
  // Redirect
  res.redirect("/api/user");
});

// Refreshes an access_token
router.post("/refresh", async (req, res) => {
  const { token } = req.body;

  // Check that a refresh token was provided
  if (!token) {
    return res.status(400).json({
      status: 400,
      message: 'Missing "token" property in request body.'
    });
  }

  // Call the Discord API to refresh the token
  const response = await axios.post(
    "https://discord.com/api/oauth2/token",
    stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: token,
      redirect_uri: REDIRECT_URI,
      scope: oauthQuery.scope
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  ).catch(err => err.response);
  
  // Respond with the call response
  res.status(response.status).json(response.data);
});

module.exports = router;
