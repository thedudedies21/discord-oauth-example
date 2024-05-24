require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
var cookieParser = require('cookie-parser');
var session = require('express-session');
const oauthRouter = require("./routers/oauth");
var cookie = require("cookie")
const apiRouter = require('./routers/api')
const { Server } = require("socket.io")
const io = new Server(server)

const MiddleWare = session({
    secret: "Your secret here",
    resave: true,
    saveUninitialized:false,
    cookie: {maxAge: 10800000}
})

app.use(cookieParser())
app.use(MiddleWare)

io.engine.use(MiddleWare)

app.use("/oauth", oauthRouter);
app.use("/api", apiRouter)

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get("/login", (req, res) => {
    res.redirect("http://10.0.0.103:3000/oauth/login")
});

app.get("/logout", (req, res) => {
    req.session.discord = null
    res.redirect("/")
});

io.on('connection', (socket) => {
    let clientID = socket.request.session.id
    let disc = socket.request.session.discord
    if(disc) socket.emit("loggedIn", disc)
})

server.listen(3000, () => {
    console.log("server started on *:3000")
})