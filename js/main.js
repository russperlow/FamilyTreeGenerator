let oFileIn; // The uploaded file
let brothers = []; // List of brothers

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
                createBrothers(oJS);
                getBigBrothers();
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
        brother.Name = object[XLXS_MEMBER];
        brother.Roll = object[XLXS_ROLL];
        brother.BBRoll = object[XLXS_BB_ROLL];
        brother.LittleBrothers = [];
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

            bigBrother.LittleBrothers.push(brothers[i]);
        }
    }
    console.log(brothers);
}