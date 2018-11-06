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
                makeTrees();
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

        let brother = {};
        
        // SS info
        brother.Name = object[XLXS_MEMBER];
        brother.Roll = object[XLXS_ROLL];
        brother.BBRoll = object[XLXS_BB_ROLL];

        // Big, littles, twins info
        brother.LittleBrothers = [];
        brother.PreviousLittle = null;
        brother.NextLittle = null;
        brother.Big = null;
        
        // Tree position info
        brother.X = -1;
        brother.Y = 0;
        brother.Mod = 0;

        // When adding a little to this brother
        brother.AddLittle = function(brother){

            // Set the littles big as this
            brother.Big = this;

            // Set the little to a lower depth than the big
            //brother.Y = this.Y++;

            // If littles already exist, connect them
            if(this.LittleBrothers.length > 0){
                this.LittleBrothers[0].PreviousLittle = brother;
                brother.NextLittle = this.LittleBrothers[0];
            }

            // Put the little to the front of the array since we are working backwards
            this.LittleBrothers.unshift(brother);

        }
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

function makeTrees(){
    for(let i = 0; i < treeHeads.length; i++){
        let treeHead = treeHeads[i];

        if(treeHead.Name == "Tyler Pixley"){
            setTreeYValues(treeHead, 0);
            setTreeXValues(treeHead);
            checkAllChildrenOnScreen(treeHead);
            calculateFinalPositions(treeHead, 0);
            let offsetX = (canvas.width / 2);
            drawLittle(treeHead, 0, 20, 100, 50, 200);
        }
    }
}
let NODESIZE = 1;
let SIBLINGDISTANCE = 0;

// Sets the inital x value for each brother
function setTreeXValues(brother){
    let littleBrothers = brother.LittleBrothers;
    for(let i = 0; i < littleBrothers.length; i++){
        setTreeXValues(littleBrothers[i]);
    }

    if(littleBrothers.length == 0){ // If no littles
        if(brother.PreviousLittle != null){ // If big had a previous little
            brother.X = brother.PreviousLittle.X + NODESIZE + SIBLINGDISTANCE
        }
        else{
            brother.X = 0;
        }
    }
    else if(littleBrothers.length == 1){ // If only 1 little
        if(brother.PreviousLittle == null){ // If big has had no previous littles
            brother.X = littleBrothers[0].X;
        }
        else{
            brother.X = brother.PreviousLittle.X + NODESIZE + SIBLINGDISTANCE;
            brother.Mod = brother.X - littleBrothers[0].X;
        }
    } // If multiple littles
    else{
        let leftChild = littleBrothers[0];
        let rightChild = littleBrothers[littleBrothers.length - 1];
        let mid = (leftChild.X + rightChild.X) / 2;

        if(brother.PreviousLittle == null){
            brother.X = mid;
        }
        else{
            brother.X = brother.PreviousLittle.X + NODESIZE + SIBLINGDISTANCE;
            brother.Mod = brother.X - mid;
        }
    }

    // CHECK FOR CONFLICT
    if(brother.LittleBrothers.length > 0 && brother.PreviousLittle != null){
        checkForConflicts(brother);
    }
}

function setTreeYValues(brother, yValue){
    brother.Y = yValue;
    for(var i = 0; i < brother.LittleBrothers.length; i++){
        setTreeYValues(brother.LittleBrothers[i], yValue+1);
    }
}

function checkForConflicts(brother){
    let minDistance = 0 + NODESIZE;
    let shiftValue = 0;

    var nodeContour = new Dictionary();
    nodeContour = getLeftContour(brother, 0, nodeContour);

    var sibling = brother.Big.LittleBrothers[0];
    while(sibling != null && sibling != brother){
        var siblingContour = new Dictionary();
        siblingContour = getRightContour(sibling, 0, siblingContour);

        var sibKey = siblingContour.KeysMax();
        var nodeKey = nodeContour.KeysMax();
        var min = Math.min(siblingContour.KeysMax(), nodeContour.KeysMax());
        for(let level = brother.Y + 1; level <= Math.min(siblingContour.KeysMax(), nodeContour.KeysMax()); level++){
            var distance = nodeContour.Get(level) - siblingContour.Get(level);
            if(distance + shiftValue < minDistance){
                shiftValue = minDistance - distance;
            }
        }

        if(shiftValue > 0){
            brother.X += shiftValue;
            brother.Mod += shiftValue;

            CenterNodesBetween(brother, sibling);

            shiftValue = 0;
        }

        sibling = sibling.NextLittle;
    }
}

function getLeftContour(brother, modSum, values){
    if(!values.ContainsKey(brother.Y)){
        values.Add(brother.Y, brother.X + modSum);
    }
    else{
        values.Add(brother.Y, Math.min(values.Get(brother.Y), brother.X + modSum));
    }

    modSum += brother.Mod;
    for(let i = 0; i < brother.LittleBrothers.length; i++){
        values = getLeftContour(brother.LittleBrothers[i], modSum, values);
    }
    return values;
}

function getRightContour(brother, modSum, values){
    if(!values.ContainsKey(brother.Y)){
        values.Add(brother.Y, brother.X + modSum);
    }
    else{
        values.Add(brother.Y, Math.max(values.Get(brother.Y), brother.X + modSum));
    }

    modSum += brother.Mod;
    for(let i = 0; i < brother.LittleBrothers.length; i++){
        values = getRightContour(brother.LittleBrothers[i], modSum, values);
    }
    return values;
}

function CenterNodesBetween(leftNode, rightNode){

    var leftIndex = leftNode.Big.LittleBrothers.indexOf(rightNode);
    var rightIndex = leftNode.Big.LittleBrothers.indexOf(leftNode);

    var numNodesBetween = (rightIndex - leftIndex) - 1;

    if(numNodesBetween > 0){
        var distanceBetweenNodes = (leftNode.X - rightNode.X) / (numNodesBetween + 1);

        var count = 1;
        for(var i = leftIndex + 1; i < rightIndex; i++){
            var middleNode = leftNode.Big.LittleBrothers[i];
            
            var desiredX = rightNode.X + (distanceBetweenNodes * count);
            var offset = desiredX - middleNode.X;
            middleNode.X += offset;
            middleNode.Mod += offset;

            count++;
        }

        checkForConflicts(leftNode);
    }
}

// Checks all of the children from the root node
function checkAllChildrenOnScreen(brother){
    var nodeContour = new Dictionary();
    nodeContour = getLeftContour(brother, 0, nodeContour);

    var shiftAmount = 0;
    for(var key in nodeContour.GetKeys()){
        if(nodeContour.Get(key) + shiftAmount < 0){
            shiftAmount = (nodeContour.Get(key) * -1);
        }
    }

    if(shiftAmount > 0){
        brother.X += shiftAmount;
        brother.Mod += shiftAmount;
    }
}

// Calculates the final positions on the screen to avoid overlapping and misplacement
function calculateFinalPositions(brother, modSum){

    brother.X += modSum;
    modSum += brother.Mod;

    for(var i = 0; i < brother.LittleBrothers.length; i++){
        calculateFinalPositions(brother.LittleBrothers[i], modSum);
    }
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

class Dictionary{
    constructor(){
        this.kvp = {};
    }

    Add(key, value){
        this.kvp[key] = value;
    }

    Remove(key){
        delete this.kvp[key];
    }

    Get(key){
        return this.kvp[key];
    }

    KeysMax(){
        var max = -1;
        for(var key in this.kvp){
            if(key > max){
                max = key;
            }
        }
        return max;
    }

    Contains(value){
        for(var key in this.kvp){
            if(this.kvp[key] == value){
                return true;
            }
        }
        return false;
    }

    ContainsKey(_key){
        for(var key in this.kvp){
            if(key == _key){
                return true;
            }
        }
        return false;
    }

    GetKeys(){
        return this.kvp;
    }

    Count(){
        return this.kvp.length;
    }
}