/** User class for message.ly */

const db = require("../db");
const ExpressError = require("../expressError");
const {BCRYPT_WORK_FACTOR} = require("../config")
const bcrypt = require("bcrypt");
const now = new Date()

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(`INSERT INTO users (username,password,first_name,last_name,phone,join_at,last_login_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING username, password, first_name,last_name`,[username,hashedPassword,first_name,last_name,phone,now,now]);
    return result.rows[0]
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(`SELECT password FROM users WHERE username = $1`,[username]);
    const user = result.rows[0];
    if(user){
      return await bcrypt.compare(password, user.password)
    }else{
      return false
    }
   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await db.query(`UPDATE users SET last_login_at = $1 WHERE username = $2 RETURNING username`,[now, username])
    if(!result.rows[0]){
      throw new ExpressError(`${username} not found`, 404)
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`SELECT username, first_name, last_name, phone FROM users`)
    return results.rows
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await db.query(`SELECT username,first_name,last_name,phone,join_at,last_login_at FROM users WHERE username = $1`,[username])
    return result.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
      let arr =[]
      const result = await db.query(`SELECT m.id, m.to_username, m.body, m.sent_at, m.read_at,u.username,u.first_name,u.last_name,u.phone FROM messages AS m 
      INNER JOIN users AS u
      ON m.to_username = u.username 
      WHERE m.from_username =$1`,[username]);
      for(let res of result.rows){
        let obj = {};
        let userObj = {};
        userObj.username = res.username;
        userObj.first_name = res.first_name;
        userObj.last_name= res.last_name;
        userObj.phone=res.phone
        obj.id = res.id
        obj.to_user = userObj
        obj.body = res.body
        obj.sent_at = res.sent_at
        obj.read_at = res.read_at
        arr.push(obj)
      }
      return arr
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    let arr =[]
    const result = await db.query(`SELECT m.id, m.from_username, m.body, m.sent_at, m.read_at,u.username,u.first_name,u.last_name,u.phone FROM messages AS m 
      INNER JOIN users AS u
      ON m.from_username = u.username 
      WHERE m.to_username =$1`,[username]);
      for(let res of result.rows){
        let obj = {};
        let userObj = {};
        userObj.username = res.username;
        userObj.first_name = res.first_name;
        userObj.last_name= res.last_name;
        userObj.phone = res.phone
        obj.id = res.id
        obj.from_user = userObj
        obj.body = res.body
        obj.sent_at = res.sent_at
        obj.read_at = res.read_at
        arr.push(obj)
      }
      return arr
   }
}


module.exports = User;