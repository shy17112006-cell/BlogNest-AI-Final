const mongoose=require('mongoose');
const blogSchema=new mongoose.Schema({
 title:{type:String,required:true,trim:true,maxlength:200},
 content:{type:String,required:true},
 category:{type:String,trim:true,default:'Uncategorized',index:true},
 tags:{type:[String],default:[],index:true},
 photo:{type:String,default:''},
 media:{type:[Object],default:[]},
 author:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
 authorName:{type:String,required:true},
 status:{type:String,enum:['Draft','Pending Approval','Scheduled','Published'],default:'Draft',index:true},
 scheduledAt:{type:Date},
 likes:{type:Number,default:0,min:0},
 likedBy:{type:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],default:[]},
 views:{type:Number,default:0,min:0},
 publishedAt:{type:Date}
},{timestamps:true});
blogSchema.index({title:'text',content:'text',category:'text',tags:'text'});
module.exports=mongoose.model('Blog',blogSchema);
