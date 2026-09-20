const mongoose=require('mongoose');
const commentSchema=new mongoose.Schema({
 post:{type:mongoose.Schema.Types.ObjectId,ref:'Blog',required:true,index:true},
 user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
 userName:{type:String,required:true},
 message:{type:String,required:true,maxlength:2000},
 status:{type:String,enum:['pending','approved','spam'],default:'pending',index:true}
},{timestamps:true});
module.exports=mongoose.model('Comment',commentSchema);
