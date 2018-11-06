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