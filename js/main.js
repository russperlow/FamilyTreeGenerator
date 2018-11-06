let oFileIn; // The uploaded file
let brothers = []; // List of brothers
let treeHeads = []; // List of all tree heads (brothers without bigs)

let canvas, ctx;

window.onload = function(){
    canvas = document.querySelector("canvas");
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    ctx = canvas.getContext('2d');
}

// CONSTANTS, SHOULD READ AS COLUMN TITLES AS THEY APPEAR IN THE EXCEL SHEET
let XLXS_BB_ROLL = "BB Roll"; // NAME OF COLUMN WHERE BIG BROTHER ROLL # IS 
let XLXS_BIG_BROTHER = "Big Brother"; // NAME OF COLUMN WHERE BIG BROTHER'S NAME IS
let XLXS_ROLL = "Roll #"; // NAME OF COLUMN WHERE THIS BROTHERS ROLL # IS
let XLXS_MEMBER = "Member"; // NAME OF COLUMN WHERE THIS BROTHER'S NAME IS
let XLXS_STATUS = "Status"; // NAME OF THE COLUMN FOR THE PERSON'S STATUS (ie. Active, Alumni, Sweetheart, etc.)
let XLXS_STATUS_SWEETHEART = "Sweetheart"; // WHAT SHOWS IN THE STATUS COLUMN FOR SWEETHEARTS
let XLXS_STATUS_PET = "Chapter Dog"; // WHAT SHOWS IN THE STATUS COLUMN FOR CHAPTER PETS (DOGS)
let XLXS_NO_BB = "N/A"; // IN PLACE FOR BROTHERS WHO DO NOT HAVE BIG BROTHERS (Drew Taylor - Kevin Petrella)
let XLXS_MAIN_SHEET_NAME = "Brothers"; // THE NAME OF THE MAIN SHEET, WE DO NOT WANT TO GRAB INFO FROM ANY ADDITIONAL SHEETS

// The input file HTML
$(function() {
    oFileIn = document.getElementById('my_file_input');
    if(oFileIn.addEventListener) {
        oFileIn.addEventListener('change', filePicked, false);
    }
});

// When a file is picked, read it from xlxs, parse to JSON and create brother objects
function filePicked(oEvent) {
    // Get The File From The Input
    let oFile = oEvent.target.files[0];
    let sFilename = oFile.name;
    // Create A File Reader HTML5
    let reader = new FileReader();
    
    // Ready The Event For When A File Gets Selected
    reader.onload = function(e) {
        let data = e.target.result;
        let cfb = XLSX.read(data, {type: 'binary'});
        //console.log(cfb)
        cfb.SheetNames.forEach(function(sheetName) {
            // Obtain The Current Row As CSV
            let sCSV = XLS.utils.make_csv(cfb.Sheets[sheetName]);   
            let oJS = XLS.utils.sheet_to_json(cfb.Sheets[sheetName]);   
    
            // $("#my_file_output").html(sCSV);
            //console.log(oJS)

            // Whenever a new sheet is uploaded, reset and create brothers
            if(sheetName == XLXS_MAIN_SHEET_NAME){
                brothers = [];
                treeHeads = [];
                createBrothers(oJS);
                getBigBrothers();
                makeTreeButtons();
                // makeTrees();
            }
        });
    };
    
    // Tell JS To Start Reading The File.. You could delay this if desired
    reader.readAsBinaryString(oFile);
}

// Create brother objects from JSON
function createBrothers(objects){
    for(let i = 0; i < objects.length; i++){
        let object = objects[i];

        // Don't add chapter pets or sweethearts to the brothers list
        if(object[XLXS_STATUS] == XLXS_STATUS_SWEETHEART || object[XLXS_STATUS] == XLXS_STATUS_PET)
            continue;

        let brother = new Brother(object[XLXS_MEMBER], object[XLXS_ROLL], object[XLXS_BB_ROLL]);

        brothers.push(brother);
    }
    // console.log(brothers);
}

// Loop backwards to get everyones big brother, assign them as their big's little
function getBigBrothers(){
    for(let i = brothers.length - 1; i >= 0; i--){
        let bbRoll = brothers[i].BBRoll;

        if(bbRoll != XLXS_NO_BB){
            let littleBrother = brothers[i];
            let bigBrother = brothers[parseInt(littleBrother.BBRoll)]; // Add one to compensate for 0 index

            // Tyler Monica case
            if(bigBrother == undefined)
                continue;

            bigBrother.AddLittle(brothers[i]);
        }
        else{
            treeHeads.push(brothers[i]);
        }
    }
}

// Makes a button for every tree
function makeTreeButtons(){
    for(let i = 0; i < treeHeads.length; i++){
        var button = document.createElement("button");
        button.value = i;
        button.innerHTML = treeHeads[i].Name;
        button.onclick = function(event){
            makeTrees(event.currentTarget.value);
        };
        var foo = document.getElementById("tree_btns");
        foo.appendChild(button);
    }
}

function makeTrees(treeToMake){
    var treeHead = treeHeads[treeToMake];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTreeYValues(treeHead, 0);
    setTreeXValues(treeHead);
    checkAllChildrenOnScreen(treeHead);
    calculateFinalPositions(treeHead, 0);
    let offsetX = (canvas.width / 2);
    drawLittle(treeHead, 0, 20, 100, 50, 200);
}

// Recursively draw littles all the way down the tree
function drawLittle(brother, x, y, width, height, offsetX){

    let littleBrothers = brother.LittleBrothers;
    for(let i = 0; i < littleBrothers.length; i++){
        drawLittle(littleBrothers[i], brother.X, y + (height * 1.5), width, height, offsetX);
    }

    // Draw this brothers rectangle
    ctx.strokeStyle = 'black';
    ctx.strokeRect(brother.X * offsetX, y, width, height);
    ctx.fillStyle = 'white';
    ctx.fillRect(brother.X * offsetX, y, width, height);

    // Draw this brothers name inside their rectangle
    ctx.fillStyle = 'red';
    ctx.font = '12px Arial';
    ctx.fillText(brother.Name, brother.X * offsetX, y + (height / 2));

    // Draw the 2 lines connecting this brother to his big, except for tree head
    if(brother.Big != null){
        var bigY = y - (height * 1.5) + (height / 2);
        var bigX = brother.Big.X * offsetX;
        var centerX = brother.X * offsetX + (width / 2);
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.lineTo(centerX, bigY);
        ctx.lineTo(bigX, bigY);
        ctx.stroke();
    }
}

$("#export").click(function() {
    var img    = canvas.toDataURL("image/png");
    var a = $("<a>").attr("href", img).attr("download", "family_tree").appendTo("body");
    a[0].click();
    a.remove();
    
});