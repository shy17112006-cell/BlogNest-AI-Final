const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxlength:100},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  password:{type:String,required:true,minlength:6},
  role:{type:String,enum:['admin','editor','author','reader'],default:'reader',index:true},
  active:{type:Boolean,default:true}
},{timestamps:true});
module.exports=mongoose.model('User',userSchema);
