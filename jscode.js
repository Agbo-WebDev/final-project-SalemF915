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
async function server_test(){

    const response = await fetch('/music');
    const coll = await response.json();

    file_1 = document.getElementById('upload1');
    let test = file_1.files;

    console.log("Music retrieve from database success", coll);


}



async function insert(){

    file_1 = document.getElementById('upload1');
    await fetch('/insert');

}
