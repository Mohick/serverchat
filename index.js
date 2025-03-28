require('dotenv').config();
const cors = require('cors');
const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(cors({
    origin: [process.env.FE, "http://192.168.1.9:5173"],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']  // <-- Add headers you need to allow here
}));
const http = require('http');
const server = http.createServer(app);
const port = 3000

const io = require('socket.io')(server, {
    cors: {
        origin: [process.env.FE, "http://192.168.1.9:5173"],
        methods: ['GET', 'POST'],
        withCredentials: true
    }
});
const list = []
const random = () => {
    let ramdom = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    return ramdom[Math.floor(Math.random() * ramdom.length)];
}
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", () => {
        console.log("registered");
        if (!list.includes(socket.id)) {
            list.push(socket.id);
        }
    });

    socket.on("send", ({ text, id }) => {
        console.log("Received send from:", code, (id));

        if (code.includes(id)) {
            for (let i = 0; i < list.length; i++) {
                if (!list[i].includes(socket.id)) {
                    io.to(list[i]).emit("receive-voice", text);
                }
            }
        }
    });
    socket.on("send-voice", (voice) => {
        console.log(voice);

        const audio = document.createElement("audio").src = voice.item;
        console.log(audio);

        audio.play();
    })
});

const createCode = () => {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += random();
    }
    return code;
}
const code = []

app.use(express.json());
app.use(express.static('public'));
const isAdmin = (req, res, next) => {
    console.log(req.cookies.isAdmin);
    const admin = req.cookies.isAdmin.split("=")
    console.log(admin[1].includes(process.env.ADMIN_PASSWORD));

    if (admin[1].includes(process.env.ADMIN_PASSWORD)
        && admin[0].includes(process.env.ADMIN_EMAIL)) {
        next({
            isValid: true,
        });

    } else {
        next({
            isValid: false,
        });
    }
}

app.post("/create-code", isAdmin, (getNext, req, res, next) => {
    console.log(getNext);

    if (getNext.isValid) {
        const newCode = createCode();
        code[0] = undefined
        code.push(newCode);
        res.json({ success: true, code: newCode });
    }
    else {
        res.json({ success: false, message: "Invalid admin credentials" });
    }
})

app.get('/hasLogin', isAdmin, (getNext, req, res, next) => {
    if (getNext.isValid) {
        res.json({ success: true, });
    } else {
        res.json({ success: false, });
    }
})
app.post('/veryfi-code', (req, res, next) => {
    const { id } = req.body
    if (code.includes(id)) {
        res.json({ success: true, message: "Code is valid" });
    } else {
        res.json({ success: false, message: "Code is not valid" });
    }
})
app.post("/login", (req, res) => {
    console.log(req.body.email, process.env.ADMIN_EMAIL, req.body.password, process.env.ADMIN_PASSWORD);

    if (req.body.email.includes(process.env.ADMIN_EMAIL) && req.body.password.includes(process.env.ADMIN_PASSWORD)) {
        res.cookie("isAdmin", `
            ${process.env.ADMIN_EMAIL + "=" + process.env.ADMIN_PASSWORD}
            `, {
            httpOnly: true, // Ngăn chặn truy cập từ JavaScript (giảm nguy cơ XSS)
            secure: true,   // Chỉ gửi cookie qua HTTPS (chỉ bật trên production)
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Cookie mất sau 7 ngày
            sameSite: "None", // Ngăn chặn CSRF
        }).json({ success: true, message: "Login successful" });

    } else {
        res.json({
            success: false, message: "Invalid credentials"
        });
    }
})
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});