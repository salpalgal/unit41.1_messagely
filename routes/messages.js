const jwt = require("jsonwebtoken");
const express = require("express")
const router = new express.Router()
const db = require("../db");
const bcrypt = require("bcrypt");

const User = require("../models/user");
const Message = require("../models/message")
const {SECRET_KEY, BCRYPT_WORK_FACTOR} = require("../config");
const ExpressError = require("../expressError");
const { ensureCorrectUser, ensureLoggedIn } = require("../middleware/auth");
const now = new Date()
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", async function(req,res,next){
    try{
        let msg = await Message.get(req.params.id)
        if(msg.from_user.username === req.user.username || msg.to_user.username === req.user.username){
            return res.json({message:msg})
        }throw new ExpressError("not authorized", 404)
 
    }catch(err){
        return next(err)
    }

    
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function(req,res,next){
    try{
        let{to_username,from_username,body} = req.body
        let post = await Message.create({from_username,to_username, body})
        return res.json({message:post})
    }catch(err){
        return next(err)
    }

})
/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", async function(req,res,next){
    try{
        let msg = await Message.get(req.params.id)
        if( msg.to_user.username === req.user.username){
            let marked = await Message.markRead(req.params.id)
            return res.json({message: marked})
        }throw new ExpressError("not authorized", 404)
        
    }catch(err){
        return next(err)
    }

})

module.exports = router;