
const http = require('http');
const fs = require('fs');
const hostname = '127.0.0.1';
const port = 8080; // you can use any port



let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://localhost:27017/";


//used to get the data from the database
async function setup(){


    //connects to the database through a connection with the url
    client = await MongoClient.connect(url);

    //gets the desired database
    const dbo = client.db("MusicDataBase");

    const music_files = await dbo.collection('msc').find({}).toArray();

    console.log(music_files);

    return music_files;

}

async function _server(){
    client = await MongoClient.connect(url);

    const dbo = client.db('MusicDataBase');

    return dbo;
}

async function insert(item) {
    client = await MongoClient.connect(url);

    const dbo = client.db("MusicDataBase");

    const result = await dbo.collection('msc').insertOne(item);
    console.log(result);
    

}


const server =http.createServer(function (req, res) {
    let filePath;

        if (req.url === '/') {
            filePath = './visual.html';
        }
        else if (req.url === '/jscode.js') {
            filePath = './jscode.js';
        }
        else if (req.url === '/music'){
            setup().then(data =>{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(data));
            });

        return;
        }

        else if (req.url === '/insert') {
            insert().then(data => {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(data));
            });
            return;
        }

        else if (req.url === '_server'){
            _server().then(data => {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(data);
            });
            return;
        }
        else {
        res.writeHead(404);
        res.end('File not found');
        return;
        }


        fs.readFile(filePath, (err,data) => {

            if (err) {
                //write head means, everything went wrong
                res.writeHead(404);
                res.end('Contents you are looking for-not found');
            }
            else {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            }

        });
});

server.listen(port,hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});


setup()