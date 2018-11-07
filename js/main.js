let oFileIn; // The uploaded file
let brothers = []; // List of brothers
let treeHeads = []; // List of all tree heads (brothers without bigs)
let spaceMultipler = 110; // Distance nodes should be when drawn
let fontSize = 12; // Font size for roll numbers and names when drawn
let canvas, ctx; // Canvas & context variable for drawing

// Colors for drawing the tree
let rectOutline = 'black';
let ACTIVE_COLOR = 'white'; // Fill color for actives
let ALUMNI_COLOR = 'white'; // Fill color for alumni
let TRANSFERRED_COLOR = 'white'; // Fill color for those who left/transferred
let DISASSOCIATED_COLOR = 'white'; // Fill color for those who disassociated
let lineColor = 'black';
let textColor = 'blue';

// CONSTANTS, SHOULD READ AS COLUMN TITLES AS THEY APPEAR IN THE EXCEL SHEET
let XLXS_BB_ROLL = "BB Roll"; // NAME OF COLUMN WHERE BIG BROTHER ROLL # IS 
let XLXS_BIG_BROTHER = "Big Brother"; // NAME OF COLUMN WHERE BIG BROTHER'S NAME IS
let XLXS_ROLL = "Roll #"; // NAME OF COLUMN WHERE THIS BROTHERS ROLL # IS
let XLXS_MEMBER = "Member"; // NAME OF COLUMN WHERE THIS BROTHER'S NAME IS
let XLXS_STATUS = "Status"; // NAME OF THE COLUMN FOR THE PERSON'S STATUS (ie. Active, Alumni, Sweetheart, etc.)
let XLXS_STATUS_SWEETHEART = "Sweetheart"; // WHAT SHOWS IN THE STATUS COLUMN FOR SWEETHEARTS
let XLXS_STATUS_PET = "Chapter Dog"; // WHAT SHOWS IN THE STATUS COLUMN FOR CHAPTER PETS (DOGS)
let XLXS_STATUS_DISASSOCIATED = "Disassociated"; // WHAT SHOWS IN THE STATUS COLUMN FOR PEOPLE WHO LEFT/WERE FORM 51'd
let XLXS_STATUS_ACTIVE = "Active"; // WHAT SHOWS IN THE STATUS COLUMN FOR CURRENT ACTIVE BROTHERS AT RIT
let XLXS_STATUS_ALUMNI = "Alumni"; // WHAT SHOWS IN THE STATUS COLUMN FOR ALUMNI
let XLXS_STATUS_TRANSFERRED = "Transferred/ Left School"; // WHAT SHOWS IN THE STATUS COLUMN FOR THOSE WHO LEFT RIT
let XLXS_NO_BB = "N/A"; // IN PLACE FOR BROTHERS WHO DO NOT HAVE BIG BROTHERS (Drew Taylor - Kevin Petrella)
let XLXS_MAIN_SHEET_NAME = "Brothers"; // THE NAME OF THE MAIN SHEET, WE DO NOT WANT TO GRAB INFO FROM ANY ADDITIONAL SHEETS

// Dictionary for storing statuses to colors
let colorDict = new Dictionary();
colorDict.Add(XLXS_STATUS_ACTIVE, ACTIVE_COLOR);
colorDict.Add(XLXS_STATUS_ALUMNI, ALUMNI_COLOR);
colorDict.Add(XLXS_STATUS_TRANSFERRED, TRANSFERRED_COLOR);
colorDict.Add(XLXS_STATUS_DISASSOCIATED, DISASSOCIATED_COLOR);

// Width and height for the tree nodes we will draw
let brotherWidth = 100;
let brotherHeight = 50;

window.onload = function(){
    canvas = document.querySelector("canvas");
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    ctx = canvas.getContext('2d');
}

// The input file HTML
$(function() {
    oFileIn = document.getElementById('my-file-input');
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
  
            // Whenever a new sheet is uploaded, reset and create brothers
            if(sheetName == XLXS_MAIN_SHEET_NAME){
                brothers = [];
                treeHeads = [];
                createBrothers(oJS);
                getBigBrothers();
                makeTreeButtons();
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

        let brother = new Brother(object[XLXS_MEMBER], object[XLXS_ROLL], object[XLXS_BB_ROLL], object[XLXS_STATUS]);

        brothers.push(brother);
    }
}

// Loop backwards to get everyones big brother, assign them as their big's little
function getBigBrothers(){
    for(let i = brothers.length - 1; i >= 0; i--){
        let bbRoll = brothers[i].BBRoll;

        if(bbRoll != XLXS_NO_BB){
            let littleBrother = brothers[i];
            let bigBrother = brothers[parseInt(littleBrother.BBRoll)];

            // Tyler Monica case (For some reason he has no big in the roll)
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
        button.setAttribute("class", "tree-head-btn");
        button.onclick = function(event){
            makeTrees(event.currentTarget.value);
        };
        var foo = document.getElementById("tree-btns");
        foo.appendChild(button);
    }
}

// Given a number make the respective tree from treeTeads
function makeTrees(treeToMake){
    var treeHead = treeHeads[treeToMake];

    // Be sure to clear the screen as to not draw ontop of already selected trees
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Do the math to create the tree
    setTreeYValues(treeHead, 0);
    setTreeXValues(treeHead);
    checkAllChildrenOnScreen(treeHead);
    calculateFinalPositions(treeHead, 0);

    let leftToRight = getLeftToRightDistance(treeHead); // How wide our tree should be
    let treeDepth = getTreeDepth(treeHead, -1); // How deep our tree should be
    canvas.width = (2+leftToRight) * spaceMultipler;
    canvas.height = (2+treeDepth * 1.5) * brotherHeight;

    // The offset is to try and center the tree in canvas
    let offsetX = (canvas.width/2) - (leftToRight * spaceMultipler / 2);

    // Draw the tree
    drawLittle(treeHead, 0, 20, brotherWidth, brotherHeight, offsetX);
}

// Recursively draw littles all the way down the tree
function drawLittle(brother, x, y, width, height, offsetX){

    let littleBrothers = brother.GetLittles();
    for(let i = 0; i < littleBrothers.length; i++){
        drawLittle(littleBrothers[i], brother.X, y + (height * 1.5), width, height, offsetX);
    }

    // Draw this brothers rectangle
    ctx.strokeStyle = rectOutline;
    ctx.strokeRect(brother.X * spaceMultipler + offsetX, y, width, height);
    ctx.fillStyle = colorDict.Get(brother.Status);
    ctx.fillRect(brother.X * spaceMultipler + offsetX, y, width, height);

    // X,Y location for writing bid number
    var rollNumX = (brother.X * spaceMultipler + offsetX) + (width / 2) - (ctx.measureText(brother.Roll).width / 2);
    var rollNumY = y + (height/3);

    // X, Y location for writing first name
    let firstName = brother.Name.split(" ")[0];
    var firstNameX = (brother.X * spaceMultipler + offsetX) + (width / 2) - (ctx.measureText(firstName).width / 2);
    var firstNameY = rollNumY + 12; // 12 IS THE FONT SIZE

    // X, Y location for writing last name
    let lastName = brother.Name.split(" ")[1];
    var lastNameX = (brother.X * spaceMultipler + offsetX) + (width / 2) - (ctx.measureText(lastName).width / 2);
    var lastNameY = firstNameY + 12;

    // Write out their roll number and names
    ctx.fillStyle = textColor;
    ctx.font = fontSize + 'px Arial';
    ctx.fillText(brother.Roll, rollNumX, rollNumY);
    ctx.fillText(firstName, firstNameX, firstNameY);
    ctx.fillText(lastName, lastNameX, lastNameY);

    // Draw 1 diagonal line connecting this brother to his big, except for tree head
    // We do NOT draw 1 x-line and 1 y-line because it will occasionally conflict with existing nodes
    if(brother.Big != null){
        var bigY = y - (height * 1.5) + (height);
        var bigX = brother.Big.X * spaceMultipler + offsetX;
        var centerX = brother.X * spaceMultipler + offsetX + (width / 2);
        ctx.strokeStyle = lineColor;
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.lineTo(bigX + width/2, bigY);
        ctx.stroke();
    }
}

$("#export").click(function() {
    var img = canvas.toDataURL("image/png");
    var a = $("<a>").attr("href", img).attr("download", "family_tree").appendTo("body");
    a[0].click();
    a.remove();
    
});