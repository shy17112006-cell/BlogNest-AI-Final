const express=require('express');const cors=require('cors');const morgan=require('morgan');const helmet=require('helmet');const {sanitize,apiLimiter}=require('./middleware/security');
const app=express();app.use(helmet());app.use(cors());app.use(express.json({limit:'2mb'}));app.use(sanitize);app.use(apiLimiter);app.use(morgan('dev'));
app.get('/',(req,res)=>res.json({message:'AI BlogNest API is running',version:'2.0'}));
app.use('/api/auth',require('./routes/auth'));app.use('/api/blogs',require('./routes/blogs'));app.use('/api/comments',require('./routes/comments'));app.use('/api/categories',require('./routes/categories'));app.use('/api/ai',require('./routes/ai'));app.use('/api/analytics',require('./routes/analytics'));
app.use(require('./middleware/error'));module.exports=app;
