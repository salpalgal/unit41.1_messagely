const jwt = require("jsonwebtoken");
const express = require("express")
const router = new express.Router()
const db = require("../db");
const bcrypt = require("bcrypt");

const User = require("../models/user");
const {SECRET_KEY, BCRYPT_WORK_FACTOR} = require("../config");
const ExpressError = require("../expressError");
const now = new Date()
/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async function(req,res,next){
    try{
        const {username,password} = req.body
        const result = await db.query(`SELECT password FROM users WHERE username =$1`,[username]);
        let user = result.rows[0]
        if (user){
            if(await bcrypt.compare(password, user.password)===true){
                await db.query(`UPDATE users SET last_login_at = $1 WHERE username = $2 RETURNING username`,[now,username])
                let token = jwt.sign({"username":username}, SECRET_KEY)
                return res.json({"token":token})
            }
        }throw new ExpressError("invaild password", 404)
    }catch(err){
        return next(err)
    }
  
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async function(req,res,next){
    try{
        const username = await User.register(req.body)
        let token = jwt.sign({username},SECRET_KEY);
        User.updateLoginTimestamp(username)
        return res.json({token})
    }catch(err){
        return next(err)
    }

})

module.exports = router;