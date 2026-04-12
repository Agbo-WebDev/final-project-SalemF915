let file_1 = null;

let file_2 = null;

async function table_create(){
    const table = document.getElementById('ProjectTable');

    const items = await fetch('/get_projects');


}

async function server_test(){

    const response = await fetch('/music');
    const coll = await response.json();

    file_1 = document.getElementById('upload1');
    let test = file_1.files;

    console.log("Music retrieve from database success", coll);


}

async function createproject() {
    const project = document.getElementById('project_name');

    const read_file = project.files[0];
    const text = await read_file.text();

    const jsonData = JSON.parse(text);

    const response = await fetch('/create_project', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData),
    });

    server_test();

    
}

async function insert(){

    //gets the file from input
    file_1 = document.getElementById('upload1');

    const read_file = file_1.files[0];
    const text = await read_file.text();


    const jsonData = JSON.parse(text);


    const response = await fetch('/insert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData),
    });


    server_test();
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
