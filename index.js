const express = require('express');
const app = express();
const port = 3000;
const githubAPI = "https://api.github.com/users/";
const { createClient } = require('redis');


app.get("/:username", async (req, res) => {
    const timeAtStart = Date.now();
    try {
        const { username } = req.params;
        const client = await createClient({
            host: 'redis-server',
            port: 6379
        })
            .on('error', err => console.log('Redis Client Error', err))
            .connect();

        let cachedResponse = await client.GET(username);
        if (cachedResponse) {
            console.log("CACHE HIT");
            const timeAtEnd = Date.now();
            const timeTaken = timeAtEnd - timeAtStart;
            cachedResponse = JSON.parse(cachedResponse);
            return res.status(200).json({
                success: true,
                msg: `Github user ${username} has ${cachedResponse.followers} followers`,
                cache: "hit",
                timeTaken: `${timeTaken}ms`,
            })
        }

        console.log("CACHE MISS");
        const fetchedResponse = await fetch(`${githubAPI}${username}`);
        const data = await fetchedResponse.json();
        await client.SETEX(username, 3600, JSON.stringify(data));
        const timeAtEnd = Date.now();
        const timeTaken = timeAtEnd - timeAtStart;
        return res.status(200).json({
            success: true,
            msg: `Github user ${username} has ${data.followers} followers`,
            cache: "miss",
            timeTaken: `${timeTaken}ms`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: "Something went wrong" });
    }
})


app.use("*", (req, res) => {
    res.status(404).json({
        msg : "try the endpoint /:username"
    })
})



app.listen(port, () => console.log("server is on :", port))