class Brother{
    constructor(name, roll, bbRoll){
        this.Name = name;
        this.Roll = roll;
        this.BBRoll = bbRoll;
        this.LittleBrothers = [];
        this.PreviousLittle = null;
        this.NextLittle = null;
        this.Big = null;
        this.X = -1;
        this.Y = 0;
        this.Mod = 0;
    }

    AddLittle(brother){
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
}