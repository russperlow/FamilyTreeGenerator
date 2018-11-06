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