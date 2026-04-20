const e = require("express");
const { response } = require("express");

const fs = require("fs");


//The file contains stuff for user accounts
let users = {
  _id: ObjectId,
  username: "string",
  email: "string",
  passwordHash: "hashed-password",
  createdAt: Date,
  lastLogin: Date
}


async function update_table(){
        //gets nessessary token
    const token = localStorage.getItem('my_jwt_token');

    const response = await fetch('/get_projects', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    const items = await response.json();

    const table = document.getElementById('projectTableBody');
    table.innerHTML = '';

    for (const item of items) {
        const row = document.createElement('tr');

        const idCell = document.createElement('td');

        idCell.textContent = item._id;
        row.appendChild(idCell);

        const nameCell = document.createElement('td');
        nameCell.textContent = item.name;
        row.appendChild(nameCell);

        const memberCell = document.createElement('td');
        memberCell.textContent = item.members;
        row.appendChild(memberCell);

        table.appendChild(row);
    }

    ///creates a collapse for the projects, so you can see all the family memebers of a project 

    
}

async function download_file(params) {
    
    const file = params

}

///updates the other table, to show the family of a related project
async function family_update(project) {
    const token = localStorage.getItem('my_jwt_token')

    const family_id = project
  
    const response = await fetch('/get_family_files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({id: family_id}),
    })
    const music_files = await response.json()

    const family_table = document.getElementById('familyTableBody');
    family_table.innerHTML = '';

    for (const item of music_files) {
        const row = document.createElement('tr');


        const nameCell = document.createElement('td');
        nameCell.textContent = item.__filename;
        row.appendChild(nameCell);

        const timeCell = document.createElement('td');
        timeCell.textContent = item.p_data.date;
        row.appendChild(timeCell);

        const priority = document.createElement('td');
        priority.textContent = item.p_data.priority;
        row.append(priority)

        const download = document.createElement('a')
        const data = item.data;

        const jsonstring = JSON.stringify(data, null, 2);

        const blob = new Blob([jsonstring], { type: 'application/json' });

        const url = URL.createObjectURL(blob);
        download.textContent = 'Download Project';
        download.href = url;
        download.download = 'data.json';
        download.classList.add('btn', 'btn-primary');
        row.append(download)


        family_table.appendChild(row);
    }

    
}

///displays all projects when the dropdown table is dropped
async function dropdown_update() {
    const token = localStorage.getItem('my_jwt_token');
    const response = await fetch('/get_projects', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    ///gets a list of all the projects 
    const music_projects = await response.json();

    const dropdown = document.querySelector('.dropdown-menu');
    /// clears the dropdown menu so it does not grow infinatly
    dropdown.innerHTML = '';

    for (const items of music_projects) {
        const dropitem = document.createElement('a');

        dropitem.text = String(items.name);
        dropitem.value = items.id;
        
        dropitem.addEventListener('click', (e) =>{
            e.preventDefault();
            family_update(items.unique_id);
        });

        dropdown.append(dropitem);

    }
    
}





async function server_test(){

    const response = await fetch('/music');
    const coll = await response.json();

    file_1 = document.getElementById('upload1');
    let test = file_1.files;

    console.log("Music retrieve from database success", coll);


}

async function createproject() {
    //gets nessessary token
    const token = localStorage.getItem('my_jwt_token');


    const project = document.getElementById('project_name');

    const read_file = project.files[0];
    const text = await read_file.text();

    const jsonData = JSON.parse(text);

    ///gets the name of the project, to keep the name
    const name = project.files[0].name;

    const payload = {
        data: jsonData,
        __filename: name
    }

    const response = await fetch('/create_project', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
    });

    /// create the project and adds it onto the mongodb server


    console.log("Project created", response);

    server_test();

    /// after creating the project, update the table to show the new project
    update_table();

    
}

async function insert(){

    //gets nessessary token
    const token = localStorage.getItem('my_jwt_token');



    //gets the file from input
    file_1 = document.getElementById('upload1');

    ///gets the files name in relation to how it was saved on the computer
    const name = file_1.files[0].name;

    console.log("File name:", name);



    const read_file = file_1.files[0];
    const text = await read_file.text();

    ///is the data that is given
    const jsonData = JSON.parse(text);

    const payload = {
        data: jsonData,
        __filename: name
    }


    await fetch('/insert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`

        },
        body: JSON.stringify(payload),
    });


    update_table();
}


//compare the similarity of two music files, return a score between 0 and 1, 1 means they are identical
async function compare(){

    const flattenJSON = (obj, prefix = '') => {
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

    const getSimilarity = (obj1, obj2) => {
    const flat1 = flattenJSON(obj1);
    const flat2 = flattenJSON(obj2);

    const set1 = new Set(Object.entries(flat1).map(e => JSON.stringify(e)));
    const set2 = new Set(Object.entries(flat2).map(e => JSON.stringify(e)));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
    };

    const _fileA = document.getElementById('upload1').files[0];
    const _fileB = document.getElementById('upload2').files[0];


    const dataA = JSON.parse(await _fileA.text());
    const dataB = JSON.parse(await _fileB.text());

    const files = [dataA, dataB];

    const matrix = files.map(file1 => 
    files.map(file2 => getSimilarity(file1, file2).toFixed(2))
    );

    console.table(matrix);

}


document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  if (data.success) {
    alert('Logged in successfully!');
    location.reload();
  } else {
    alert('Login failed: ' + data.error);
  }
});

async function create_user(){
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;

  console.log(username, password);

  const response = await fetch('/user_setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
    
  const data = await response.json();

  console.log("User creation response:", data.acknowledged);
  if (data.acknowledged) {
    alert('Registration sucessful!');
    location.reload();
  }
  else{
    alert('Registration failed: ' + data.error);
  }
}

async function login_user(){
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch('/user_login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, password})
    });
  const token = await response.json(); 

      if (token) {
          // SAVE the token in the browser's memory (localStorage)
          localStorage.setItem('my_jwt_token', token);
          console.log("Token saved!");
      }
    


}

async function logout(){
    localStorage.removeItem('my_jwt_token');
    Location.reload();
}