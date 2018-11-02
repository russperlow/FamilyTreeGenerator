// var fileInput = document.getElementById("csv");
// var readFile = function(){
//     var reader = new FileReader();
//     reader.onload = function(){
//         var result = reader.result;
//         debugger;
//         document.getElementById('out').innerHTML = reader.result;
//     }

//     reader.readAsBinaryString(fileInput.files[0]);
// }
// fileInput.addEventListener('change', readFile);

// function getArray(result){
//     var loop = true;
//     while(loop){

//     }
// }

var oFileIn;

$(function() {
    oFileIn = document.getElementById('my_file_input');
    if(oFileIn.addEventListener) {
        oFileIn.addEventListener('change', filePicked, false);
    }
});


function filePicked(oEvent) {
    // Get The File From The Input
    var oFile = oEvent.target.files[0];
    var sFilename = oFile.name;
    // Create A File Reader HTML5
    var reader = new FileReader();
    
    // Ready The Event For When A File Gets Selected
    reader.onload = function(e) {
        var data = e.target.result;
        var cfb = XLSX.read(data, {type: 'binary'});
        console.log(cfb)
        cfb.SheetNames.forEach(function(sheetName) {
            // Obtain The Current Row As CSV
            var sCSV = XLS.utils.make_csv(cfb.Sheets[sheetName]);   
            var oJS = XLS.utils.sheet_to_json(cfb.Sheets[sheetName]);   
    
            $("#my_file_output").html(sCSV);
            console.log(oJS)
            // $scope.oJS = oJS
        });
    };
    
    // Tell JS To Start Reading The File.. You could delay this if desired
    reader.readAsBinaryString(oFile);
}