const http = require('http');
const fs = require('fs');
///const { BSON } = require('mongodb');

const { BSON, ServerApiVersion } = require('mongodb');

const hostname = '127.0.0.1';
const port = 8080; // you can use any port


///********************************************
///MONGO ATLAS SET UP **********************
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://adrian951_db_user:CatPeeSink915@mycluster0.zwstjen.mongodb.net/";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

client.connect().then(() => {
    console.log("Connected to MongoDB Atlas");
})


const dbo = client.db("MusicDataBase");
const collection = dbo.collection('msc');

//function connects the database 
async function connectToDatabase(){



    ///Mongo Atlas set up

    console.log("Mongo Atlas connected successfully");
    let atlas_music_files = await dbo.collection('msc').find({}).toArray();
    console.log(atlas_music_files);
    
}


//used to get the data from the database
async function setup(){


    //gets the desired database

    let music_files = await dbo.collection('msc').find({}).toArray();


    return music_files;

}

async function compare(obj1, obj2){

    const flattenJSON = (obj, prefix = '') => {
    if (obj === undefined || obj === null) {
        return {};
    }
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenJSON(obj[k], pre + k));
        } else {
        acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
    };
    ///flattens the json files, so they can be compared more easily
    const getSimilarity = (obj1, obj2) => {
    const flat1 = flattenJSON(obj1);
    const flat2 = flattenJSON(obj2);

    const set1 = new Set(Object.entries(flat1).map(e => JSON.stringify(e)));
    const set2 = new Set(Object.entries(flat2).map(e => JSON.stringify(e)));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
    };

    const similarity = getSimilarity(obj1, obj2);
    return similarity;

}






async function insert(item) {


    const inserting = item;

    if (!inserting.data || !inserting.__filename) {
        throw new Error('Item must have data and filename properties');
    }


    /// First it needs to compare the file to other existing files in database, if the file is similar or the exact same, it should add it to the same family

    const music_files = await dbo.collection('msc').find({}).toArray();

    ///goes through all the music files in the database, compares them to new file, if similar, adds new file to the same family, and makes the new file the priority file. If not, creates a new family for new file
    for (const file of music_files) {

        if (file.p_data.priority === true){
            ///if the file is a priority file, it should be compared to the new file, if the file is not a priority file, it should not be compared to the new file, because it is not the most up to date version of the family
        
        const similarity = await compare(inserting.data, file.data);
        console.log("similarity",similarity);
        if (similarity >= 0.75){

            
            ///if the file is similar to an existing file, it should be added to the same family, and the new file should be the priority file
            const family_id = file.p_data.unque_id;
            const _p_data = {
                unique_id: family_id,
                priority: true,
                name:item.name,
                description: "This is a test",
                date: new Date()
            }
            const new_file = {
                ...item,
                p_data: _p_data
            }

            await dbo.collection('msc').insertOne(new_file);
            ///after inserting the new file, it should update the old file to not be the priority file
            await dbo.collection('msc').updateOne({_id: file._id}, {$set: {"p_data.priority": false}});

            return;

        }

        }
        ///if the file is not a priority file, it should not be compared, and stuff file is ignored




    }
    ///if the file is not similar , create a new family for the new file, and make it the priority

    create_project(inserting);
    return;


    

}

async function create_project(item) {
    /// This function creates a unquie project that can be used to store music files

    const p_data = {

        ///unquie id for the project is used to identify the project family
        unique_id: new BSON.ObjectId(),

        /// used to determine if the project should be displayed on html page
        priority: true,
        name: item.name,  // Get from item or use default
        description: item.description || "This is a test",
        ///date that project was uploaded to the database
        date: new Date()
    }
    const project = {
        ...item, 
        p_data
    };


    const result = await dbo.collection('msc').insertOne(project);


}

async function get_projects() {

    const projects = []

    const music_files = await dbo.collection('msc').find({}).toArray();

    for (const file of music_files) {
        if (file.p_data && file.p_data.priority) {
            projects.push({
                _id: file._id,
                name: file.__filename,
                members: 0
            });
        }
    }

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

            req.on('data', chunk => {
                body += chunk;
                if (body.length > 1e6) req.connection.destroy();
            })

            req.on('end', async() => {
                try{
                    const item = JSON.parse(body);
                    await insert(item);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch(err){
                    console.error('Insert error:', err);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
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

            get_projects().then(data =>{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(data));
            })

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
    connectToDatabase();
    console.log(`Server running at http://${hostname}:${port}/`);
    
});

