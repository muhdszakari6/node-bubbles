const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const cors = require('cors');

const moment = require('moment')
const {userJoin, getCurrentUser,userLeave, getRoomUsers} = require('./util/user')


const app = express();
const server = http.createServer(app)

const io = socketio(server, {
    cors: {
        origin: "http://localhost:4200",
        credentials : true
        //   methods: ["GET", "POST"]
    }
});

var corsOptions = {
    origin: ['http://localhost:4200', 'https://easytalkchat.netlify.app'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'] };

app.use(cors(corsOptions));

const bot = "Bubbles"

//Run when client connect  
io.on('connection', socket => {
    console.log("New WS Connection")
    socket.on('joinRoom', ({ username, room }) => {
        
        const user = userJoin(socket.id, username, room, )
        socket.join(user.room)
        //Emit to only the new connection
        socket.emit('message', formatMessage(bot, "Welcome to Bubbles"))


        //Emit to everyone except new connection
        socket.broadcast.to(user.room).emit('message', formatMessage(bot, `${username} has joined the chat`))

        //Emit to everyone on the connection
        // io.emit()
        io.to(user.room).emit('roomUsers', {
            room: user.room, 
            users: getRoomUsers(user.room)
        })

    })


    socket.on('disconnect', () => {
        const user = userLeave(socket.id)
        if(user){
            io.to(user.room).emit('message', formatMessage(bot, `${user.username} has left the chat.`))
            io.to(user.room).emit('roomUsers', {
                room: user.room, 
                users: getRoomUsers(user.room)
            })
        }
    })

    //Listen for chat message
    socket.on('chatMessage', (message) => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message', formatMessage(user.username , message))

    })
})

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on ${PORT}`))



const formatMessage = (username, message) => {
    return {
        username,
        message,
        time: moment().format('h:mm a')
    }

}