const http = require('http');
const fs = require('fs');
const { BSON } = require('mongodb');

const hostname = '127.0.0.1';
const port = 8080; // you can use any port



let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://localhost:27017/";

const client = new MongoClient(url);

client.connect().then(() => {
    console.log("Connected to MongoDB");
}
);

const dbo = client.db('MusicDataBase')

const collection = dbo.collection('msc');

//function connects the database 
async function connectToDatabase(){

    console.log("Database connected successfully");
    let music_files = await dbo.collection('msc').find({}).toArray();

    ///console.log(music_files);
    
}


//used to get the data from the database
async function setup(){


    //gets the desired database

    let music_files = await dbo.collection('msc').find({}).toArray();


    return music_files;

}


async function insert(item) {

    ///console.log("Inserting item:", item);
    ///const bson_input = BSON.serialize(item);

    ///connects to the database
    const result = await dbo.collection('msc').insertOne(item);
    

}

async function create_project(item) {
    /// This function creates a unquie project that can be used to store music files

    
    const result = await dbo.collection('msc').insertOne(item);
    console.log(result);
    console.log(Str(result.insertedId));


}

async function get_projects() {
    const projects = await dbo.collection('msc').find({}).toArray();

    return projects;
    
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

        else if (req.url === '/insert' && req.method === 'POST') {

            let body = '';

            req.on('data', chunk =>{
                body += chunk;
            })

            req.on('end', async() => {
                try{
                    const item = JSON.parse(body);
                    const result = await insert(item);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                }    catch(err){
                      res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            })
            return;
        }

        else if (req.url === '/create_project' && req.method === 'POST') {
            let body = '';

            req.on('data', chunk =>{
                body += chunk;
            })

            req.on('end', async() => {
                try{
                    const item = JSON.parse(body);
                    const result = await create_project(item);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                }    catch(err){
                      res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            })
            return;

        }

        else if (req.url === '/get_projects') {

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
    connectToDatabase();
    console.log(`Server running at http://${hostname}:${port}/`);
    
});

