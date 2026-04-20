const http = require('http');
const fs = require('fs');
const url = require('url');

const jwt = require('jsonwebtoken');


const { BSON, ServerApiVersion } = require('mongodb');

const hostname = '127.0.0.1';
const port = 8080; // you can use any port
///********************************************
///USER SETUP **********************

const bcrypt = require('bcryptjs');



///********************************************
///MONGO ATLAS SET UP **********************
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const uri = "mongodb+srv://guest_user:1234@mycluster0.zwstjen.mongodb.net/";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


const dbo = client.db("MusicDataBase");
//stores all the information regarding user data
const usersCollection = dbo.collection('users');
const collection = dbo.collection('msc');





/////////////////////////////////////////////////////
//function connects the database 
async function connectToDatabase(){
  try {
    await client.connect();
    ///console.log("Mongo Atlas connected successfully");
    let atlas_music_files = await dbo.collection('msc').find({}).toArray();
    ///console.log(atlas_music_files);
  } catch(err) {
    console.error("Failed to connect to MongoDB:", err);
    throw err;
  }
}




//used to get the data from the database
async function setup(user){


    //gets the desired database

    let music_files = await dbo.collection('msc').find({'p_data.user':new ObjectId(user.id)}).toArray();


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






async function insert(user,item) {

    ///gets the user's current token to find user id to connect to correct database

    const inserting = item

    if (!inserting.data || !inserting.__filename) {
        throw new Error('Item must have data and filename properties');
    }


    /// First it needs to compare the file to other existing files in database, if the file is similar or the exact same, it should add it to the same family

    const music_files = await dbo.collection('msc').find({'p_data.user':new ObjectId(user.id)}).toArray();

    ///goes through all the music files in the database, compares them to new file, if similar, adds new file to the same family, and makes the new file the priority file. If not, creates a new family for new file
    for (const file of music_files) {

        if (file.p_data.priority === true){
            ///if the file is a priority file, it should be compared to the new file, if the file is not a priority file, it should not be compared to the new file, because it is not the most up to date version of the family
        
        const similarity = await compare(inserting.data, file.data);
        console.log("similarity",similarity);
        if (similarity >= 0.75){

            
            ///if the file is similar to an existing file, it should be added to the same family, and the new file should be the priority file
            const family_id = file.p_data.unique_id;
            const _p_data = {
                unique_id: family_id,
                priority: true,
                name:item.name,
                description: "This is a test",
                date: new Date(),
                user: new ObjectId(user.id)
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

    create_project(user,inserting);
    return;


    

}

async function create_project(user,item) {
    /// This function creates a unquie project that can be used to store music files

    console.log("USER", user)

    const p_data = {

        ///unquie id for the project is used to identify the project family
        unique_id: new BSON.ObjectId(),

        /// used to determine if the project should be displayed on html page
        priority: true,
        name: item.name,  // Get from item or use default
        description: item.description || "This is a test",
        ///date that project was uploaded to the database
        date: new Date(),
        user: new ObjectId(user)
    }
    const project = {
        ...item, 
        p_data
    };


    const result = await dbo.collection('msc').insertOne(project);


}

async function get_projects(user) {

    const projects = []

    const music_files = await dbo.collection('msc').find({'p_data.user':new ObjectId(user.id)}).toArray();

    for (const file of music_files) {
        if (file.p_data && file.p_data.priority) {
            const memberCount = await dbo.collection('msc').countDocuments({'p_data.unique_id': file.p_data.unique_id});
            projects.push({
                _id: file._id,
                unique_id: file.p_data.unique_id,
                name: file.__filename,
                members: memberCount
            });
        }
    }

    return projects;
    
}

async function get_family(user,project_id) {
    
    const searchId = new ObjectId(project_id);
    const music_files = await dbo.collection('msc').find({'p_data.unique_id':searchId, 'p_data.user': new ObjectId(user.id)}).toArray();

    console.log(music_files);

    return music_files;

}

/////////////////////////////// FUnctions for User setup


async function authenticateToken(req, res) {
    // 1. Grab the 'Authorization' header
    const authHeader = req.headers['authorization'];
    
    // 2. Extract the token (Expected format: "Bearer <token>")
    // If the header exists, split it at the space and take the second part
    const token = authHeader && authHeader.split(' ')[1];

    // 3. If there is no token, send a 401 error and return null
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        console.log("Access denied: Suck it loser")
        res.end(JSON.stringify({ error: "Access denied. No token provided." }));
        return null;
    }

    try {
        // 4. Verify the token using your secret key
        const decodedUser = jwt.verify(token, 'your-jwt-secret-key');
        
        // 5. Return the user data (this makes the 'await' result truthy)
        return decodedUser; 
    } catch (err) {
        // 6. If the token is fake or expired, send a 403 error and return null
        res.writeHead(403, { 'Content-Type': 'application/json' });
        console.log("Access denied: Suck it loser")

        res.end(JSON.stringify({ error: "Invalid or expired token." }));
        return null;
    }
}

async function user_setup(item) {
    /// This function creates a new user in the database, and hashes the password using bcrypt



    if (!item.username || !item.password) {
        throw new Error('Usernameand password are required');
    }

    const passwordHash = await bcrypt.hash(item.password, 10);

    const user = {
        username:item.username,
        password: passwordHash
    }

    const result = await usersCollection.insertOne(user);

    return result;

}

async function user_login(item) {

    const {username, password} = item;

    if (!username || !password) {
        throw new Error(' Incorrect username and/or password!')
    }

    ///checks to see if the user is in the usercollection
    const user =  await usersCollection.findOne({username : username});

    if (!user) {
            throw new Error('Incorrect username and/or password!');
    }


    const un_hash = await bcrypt.compare(password, user.password);

    if (!un_hash){
        throw new Error(' Incorrect username and/or password!')
    }

    const payload = {
            username: user.username,
            id: user._id
        };
    
    const JWT_SECRET = 'your-jwt-secret-key';
    const token = jwt.sign(payload, JWT_SECRET,{ expiresIn: '10m' })

    console.log("Login successful", token);
    return token;
}

/////////////////////////////// FUnctions for User setup
const server = http.createServer(async function (req, res) {


    let filePath;

        ///public requests
        if (req.url === '/') {
            filePath = './visual.html';
        }
        else if (req.url === '/jscode.js') {
            filePath = './jscode.js';
        }

        //sets up a new user profile
        else if (req.url === '/user_setup' && req.method === 'POST') {
            let body = '';
                req.on('data', chunk =>{
                body += chunk;
            })

            req.on('end', async() => {
                try{
                    const item = JSON.parse(body);
                    const result = await user_setup(item);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                }    catch(err){
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            })
            return;

        }

        else if (req.url === '/user_login' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk =>{
                body += chunk;
            })

            req.on('end', async() =>{
                try{
                    const item = JSON.parse(body);
                    const result = await user_login(item);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                }
                catch(err){
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            })
            return;
        }


        ///private requests

        else if (req.url === '/music'){
            const user = await authenticateToken(req, res);
            if (!user) return; // Stop if authentication failed

            setup(user).then(data =>{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(data));
            });

        return;
        }

        else if (req.url === '/insert' && req.method === 'POST') {
            const user = await authenticateToken(req, res);
            if (!user) return; // Stop if authentication failed

            let body = '';

            req.on('data', chunk => {
                body += chunk;
                if (body.length > 1e6) req.connection.destroy();
            })

            req.on('end', async() => {
                try{
                    const item = JSON.parse(body);
                    await insert(user ,item);
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
            const user = await authenticateToken(req, res);
            if (!user) return; // Stop if authentication failed
            let body = '';


            req.on('data', chunk =>{
                body += chunk;
            })

            req.on('end', async() => {
                try{
                    const item = JSON.parse(body);
                    const result = await create_project(user,item);
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
            const user = await authenticateToken(req, res);
            if (!user) return; // Stop if authentication failed

            get_projects(user).then(data =>{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(data));
            })

            return;

        }
        else if (req.url === '/get_family_files' && req.method === 'POST') {
            const user = await authenticateToken(req, res);
            if (!user) return; // Stop if authentication failed
            let body = '';


            req.on('data', chunk =>{
                body += chunk;
            })
            req.on('end', async() => {
                try{
                    const item = JSON.parse(body);
                    console.log("this ran")
                    const data = await get_family(user,item.id);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(data));
                }
                
                catch(err){
                    console.error('Insert error:', err);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            })
            return;

        }


        else {
        res.writeHead(404);
        console.log("TESTING");
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




// Start server and connect to database
server.listen(port, hostname, async () => {
  try {
    await connectToDatabase();
    console.log(`Server running at http://${hostname}:${port}/`);
  } catch(err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
});

