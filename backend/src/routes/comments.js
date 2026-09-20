const r=require('express').Router();const c=require('../controllers/comments');const auth=require('../middleware/auth');
r.post('/blog/:blogId',auth,c.create);r.get('/blog/:blogId',auth,c.list);r.patch('/:id/moderate',auth,c.moderate);r.delete('/:id',auth,c.remove);module.exports=r;
