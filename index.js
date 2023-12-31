const express = require('express');
const app = express();
const port = 3000;
const githubAPI = "https://api.github.com/users/";
const { createClient } = require('redis');


app.get("/:username", async (req, res) => {
    const timeAtStart = Date.now();
    try {

        // const client = await createClient()
        //     .on('error', err => console.log('Redis Client Error', err))
        //     .connect();

        // const { username } = req.params;
        // const response = await client.GET(username);
        // if(response){
        //     console.log("cache hit");
        //     return res.json(JSON.parse(response));
        // }
        // console.log("cache miss");
        // const data = await fetch(`${githubAPI}${username}`)
        // .then(res => res.json())
        // .then(data => {
        //     client.SETEX(username, 3600, JSON.stringify(data));
        //     return res.json({username , data});
        // })



        const { username} = req.params;
        const client = await createClient()
        .on('error', err => console.log('Redis Client Error', err))
        .connect();

        let cachedResponse = await client.GET(username);
        if(cachedResponse){
            console.log("CACHE HIT");
            const timeAtEnd = Date.now();
            const timeTaken = timeAtEnd - timeAtStart;
            cachedResponse = JSON.parse(cachedResponse);
            return res.status(200).json({
                success: true,
                msg: `Github user ${username} has ${cachedResponse.followers} followers`,
                cache : "hit",
                timeTaken: `${timeTaken}ms`,
            })
        }

        console.log("CACHE MISS");
        const fetchedResponse = await fetch(`${githubAPI}${username}`);
        const data = await fetchedResponse.json();
        await client.SETEX(username,3600,JSON.stringify(data));
        const timeAtEnd = Date.now();
        const timeTaken = timeAtEnd - timeAtStart;
        return res.status(200).json({
            success: true,
            msg: `Github user ${username} has ${data.followers} followers`,
            cache : "miss",
            timeTaken: `${timeTaken}ms`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: "Something went wrong" });
    }
})



app.listen(port, () => console.log("server is on :", port));