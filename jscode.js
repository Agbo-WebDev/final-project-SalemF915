let file_1 = null;

let file_2 = null;



function turn1(){
    return;
}

function turn2(){
    return;
}
async function server_test(){

    const response = await fetch('/music');
    const coll = await response.json();

    file_1 = document.getElementById('upload1');
    let test = file_1.files;

    console.log("Music retrieve from database success", coll);


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
