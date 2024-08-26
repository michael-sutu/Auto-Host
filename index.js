const express = require("express")
const { MongoClient } = require("mongodb")
const bcrypt = require("bcrypt")
const fetch = require("node-fetch-commonjs")
require('dotenv').config()

const app = express()
app.use(express.json())

const client = new MongoClient(process.env.MONGO_URI)
let db

function randomId(length) {
    try {
        let final = ""
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        const charactersLength = characters.length
        let counter = 0
        while (counter < length) {
            final += characters.charAt(Math.floor(Math.random() * charactersLength))
            counter += 1
        }
        return { code: 200, result: final }
    } catch (error) {
        return { code: 500, error: error.toString() }
    }
}

async function dbCreate(collection, data) {
    try {
        const result = await db.collection(collection).insertOne(data)
        return { code: 200, result: result }
    } catch (error) {
        return { code: 500, error: error.toString() }
    }
}

async function dbGet(collection, query) {
    try {
        const result = await db.collection(collection).findOne(query)
        return { code: 200, result: result }
    } catch (error) {
        return { code: 500, error: error.toString() }
    }
}

async function dbUpdateSet(collection, query, data) {
    try {
        const result = await db.collection(collection).updateOne(query, { $set: data })
        return { code: 200, result: result }
    } catch (error) {
        return { code: 500, error: error.toString() }
    }
}

app.post("/signup", async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(req.body.password, salt)
        const newPrivate = randomId(15)
        const data = {
            email: req.body.email,
            password: hash,
            private: newPrivate.result,
            properties: []
        }
        const createResponse = await dbCreate("users", data)
        if (createResponse.code === 200) {
            res.json(newPrivate)
        } else {
            res.status(500).json(createResponse)
        }
    } catch (error) {
        res.status(500).json({ code: 500, error: error.toString() })
    }
})

app.post("/login", async (req, res) => {
    try {
        const result = await dbGet("users", { email: req.body.email })
        if (result.code === 200 && result.result) {
            const match = await bcrypt.compare(req.body.password, result.result.password)
            if (match) {
                res.json(result.result.private)
            } else {
                res.status(401).json({ code: 401, error: "Unauthorized" })
            }
        } else {
            res.status(401).json({ code: 401, error: "Unauthorized" })
        }
    } catch (error) {
        res.status(500).json({ code: 500, error: error.toString() })
    }
})

app.post("/save", async (req, res) => {
    try {
        await client.connect()
        const db = client.db("main")
        const newId = Math.floor(Math.random() * 100000)
        await db.collection("users").updateOne({ private: req.body.private }, { $push: { properties: {
            name: req.body.name,
            address: req.body.address,
            information: req.body.information,
            id: newId
        }} })
        const data = {
            name: req.body.name,
            address: req.body.address,
            information: req.body.information,
            id: newId
        }
        await dbCreate("properties", data)
        res.json({ code: 200 })
    } catch (error) {
        res.status(500).json({ code: 500, error: error.toString() })
    }
})

app.post("/get", async (req, res) => {
    try {
        const result = await dbGet("users", { private: req.body.private })
        if (result.code === 200) {
            res.json({ properties: result.result.properties })
        } else {
            res.status(500).json(result)
        }
    } catch (error) {
        res.status(500).json({ code: 500, error: error.toString() })
    }
})

app.post("/deleteproperty", async (req, res) => {
    try {
        const result = await dbGet("users", { private: req.body.private })
        if (result.code === 200) {
            for (let i = 0; i < result.result.properties.length; i++) {
                if (result.result.properties[i].address === req.body.address) {
                    result.result.properties.splice(i, 1)
                    await dbUpdateSet("users", { private: req.body.private }, { properties: result.result.properties })
                }
            }
            res.json({ code: 200 })
        } else {
            res.status(500).json(result)
        }
    } catch (error) {
        res.status(500).json({ code: 500, error: error.toString() })
    }
})

app.post("/respond", async (req, res) => {
    try {
        let aiRequest = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo-16k',
                messages: [
                    { "role": "user", "content": req.body.information },
                    { "role": "assistant", "content": "Yes, I understand what I need to do." },
                    { "role": "user", "content": req.body.message }
                ],
                max_tokens: 750,
                temperature: 0.1
            })
        }
        const response = await fetch("https://api.openai.com/v1/chat/completions", aiRequest)
        const chatgpt = await response.json()
        res.json(chatgpt.choices[0].message.content)
    } catch (error) {
        res.status(500).json({ code: 500, error: error.toString() })
    }
})

app.get("/getproperty", async (req, res) => {
    try {
        const result = await dbGet("properties", { id: parseInt(req.query.id) })
        res.json(result)
    } catch (error) {
        res.status(500).json({ code: 500, error: error.toString() })
    }
})

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/public/login.html")
})

app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/public/signup.html")
})

app.get("/dashboard", (req, res) => {
    res.sendFile(__dirname + "/public/dashboard.html")
})

app.get("/files/:path", (req, res) => {
    res.sendFile(__dirname + `/files/${req.params.path}`)
})

app.get("/chat/:id", (req, res) => {
    res.sendFile(__dirname + `/public/chat.html`)
})

app.listen(5000, async () => {
    try {
        await client.connect()
        db = client.db("main")
        console.log(`Server running on http://localhost:5000`)
    } catch (error) {
        console.error("Could not connect to db:", error)
        process.exit(1)
    }
})
