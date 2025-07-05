const mongoose=require("mongoose");



const schema = new mongoose.Schema({
  description: String,
  amount: Number,
  date: {
    type: Date,
    default:Date.now()
  },
  
});


module.exports=mongoose.model("transaction",schema);