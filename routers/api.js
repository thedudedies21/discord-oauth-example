const axios = require("axios");

const router = require("express").Router();

router.get("/", (req, res) => res.json({ hello: "world" }));

router.get("/user", async (req, res) => {
  const { access_token } = req.cookies;
  const tokens = req.session.tokens
  if (!access_token) {
    if(!tokens){
    return res.status(401).json({
      status: 401,
      message: 'Missing "access_token" cookie'
    });
  }else{
    access_token = tokens.access
  }
  }

  const response = await axios.get("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  if(!req.session.discord){
    req.session.discord = response.data
  }
  res.redirect('/')
});

router.get("/guilds", async (req, res) => {
  const { access_token } = req.cookies;
  if(!access_token) {
    return res.status(402).json({
      status: 401,
      message: 'Missing "access_token" cookie'
    });
  }
  
  const response = await axios.get("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  
  res.status(response.status).json(response.data)
})

module.exports = router;
