let file_1 = null;

let file_2 = null;



function turn1(){
    pass
    return ;
}

function turn2(){

    
    pass
    return ;
}
async function compare(){

    const coll = await fetch('/music');

    

    file_1 = document.getElementById('upload1');
    let test = file_1.files;

    const result = await coll.insertOne(test);
    console.log(test);


}



async function insert() {

    file_1 = document.getElementById('upload1');

    const coll = await fetch('music');
    let test = file_1.files;






    
}

async function _set(){
    file_1 = document.getElementById('upload1');

    const _server = await fetch('_server');

    console.log(_server);


}