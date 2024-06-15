import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import util from "util";
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv";
import connectPgSimple from "connect-pg-simple";
import GoogleStrategy from 'passport-google-oauth2';
import fetch from "node-fetch";
import pg from 'pg';
import favicon from 'serve-favicon';
import cors from 'cors';
import { join } from 'path';

env.config();
const { Pool } = pg;
const app = express();
app.use(cors());
const hashPassword = util.promisify(bcrypt.hash); 
const port = process.env.PORT;
const salt = parseInt(process.env.SALT);
const __dirname = new URL('.', import.meta.url).pathname;
app.use(favicon(join(__dirname, 'public', 'favicon.ico')));

const db = new Pool({
  connectionString: process.env.POSTGRES_URL,
})
db.connect((err)=>{
  if(err) console.log(err);
  else console.log('database connected successfully');
})
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const pgSession = connectPgSimple(session);
app.use(
  session({
    store: new pgSession({
      pool: db,
      tableName: 'user_sessions',
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get('/',async (req,res)=>{
  if(req.isAuthenticated()){
    res.redirect("chat");
  }
  else res.redirect("/home");
})

app.get('/chat',async(req,res)=>{
  if (req.isAuthenticated()) {
    try {
      const email = req.user.email;
      let sectionId = req.query.section_id;

      if (!sectionId) {
        const defaultSection = await db.query("SELECT * FROM sections WHERE user_email = $1 ORDER BY created_at DESC LIMIT 1", [email]);
        if (defaultSection.rows.length == 0) {
          const newSection = await db.query("INSERT INTO sections(user_email, name) VALUES($1, $2) RETURNING *", [email, "New Section"]);
          sectionId = newSection.rows[0].id;
        } else {
          sectionId = defaultSection.rows[0].id;
        }
      }
      const sections = await db.query("SELECT * FROM sections WHERE user_email = $1 ORDER BY created_at DESC", [email]);
      const messages = await db.query("SELECT * FROM chats WHERE section_id = $1", [sectionId]);
      const username = await db.query("SELECT username FROM users WHERE email = $1", [email]);
      res.render('chat', {
        messages: messages.rows,
        length: messages.rows.length,
        user: username.rows[0],
        sections: sections.rows,
        current_section: { id: sectionId }
      });
    } catch (err) {
      res.redirect('/home');
    }
  } else res.redirect('/home');
})

app.get('/home',(req,res)=>{
    res.render('home');
})

app.get('/login',(req,res)=>{
  res.render('login');
})

app.get('/signup',(req,res)=>{
  res.render('signup');
})

app.get('/logout',(req,res)=>{
  req.logout(err=>{});
  res.redirect('/home');
})

app.get('/privacy',(req,res)=>{
  res.render('privacy');
})

app.get('/terms',(req,res)=>{
  res.render('terms');
})

app.post('/message', async(req,res)=>{
  try {
    if (req.body.message!='') {
        const imgUrl = await query({ "inputs": req.body.message });
        await db.query("INSERT INTO chats(section_id, message, img_url) VALUES($1, $2, $3)", [req.body.section_id, req.body.message, imgUrl]);
        res.redirect(`/chat?section_id=${req.body.section_id}`);
    }
    else res.redirect('/chat');
  } 
  catch (err) {
    res.redirect('/chat');
  }
});

app.post('/rename_section', async(req,res)=>{
  const id = req.body.section_id;
  const newName = req.body.newname;
  const email = req.user.email;

  try{
    const result = await db.query('UPDATE sections set name = $1 where id=$2 AND user_email=$3',[newName,id,email]);
    res.redirect('/chat');
  }
  catch(err){
    res.redirect('/chat');
  }
})

app.post('/delete_section',async (req,res)=>{
  const id = req.body.section_id;
  const email = req.user.email;
  try{
    const result = await db.query('DELETE FROM sections where id=$1 and user_email=$2',[id,email]);
    res.redirect('/chat');
  }
  catch(err){
    res.redirect('/chat');
  }
})

app.post('/new_section', async(req,res)=>{
  try{  
      const new_section = await db.query('INSERT INTO sections(user_email,name) values($1,$2) RETURNING *',[req.user.email,"New Section"]);
      const id = new_section.rows[0].id;
      res.redirect(`/chat?section_id=${id}`);
  }
  catch(err){
    res.redirect('/chat');
  }
})

app.get('/auth/google',passport.authenticate("google",{
  scope: ["profile","email"],
}))

app.get('/auth/google/chat',passport.authenticate("google",{
  successRedirect: '/chat',
  failureRedirect: '/login'
}))

app.post('/user_login',passport.authenticate('local',{
  session: true,
  successRedirect: "/",
  failureRedirect: "/login",
}))

app.post('/user_signup',async (req,res)=>{
  const name = req.body.username;
  const email = req.body.email_id;
  const password = req.body.password;

  try{
    const checkResult = await db.query("SELECT * from Users where email = $1",[email]);
    if(checkResult.rows.length>0){
      res.send(`<script>
        alert('User Already Exists. Redirecting to Login Page');
        window.location.href='/login';
        </script>`)
    }
    else{
      const hash = await hashPassword(password,salt);
      const result= await db.query("INSERT INTO Users(email,password,username) values($1,$2,$3) RETURNING *",[email,hash,name]);
      const user = result.rows[0];
      req.login(user,()=>{
        res.redirect('/');
      });
    }
  }
  catch(err){ 
    res.send(`<script>
        alert('Error Signing Up! Please Try Again. Redirecting to SignUp Page');
        window.location.href='/signup';
        </script>`);
  };
})

passport.use('local', new Strategy( async function verify(username , password , cb){
  try{
    const result = await db.query('SELECT * FROM Users WHERE email = $1',[username]);
    if(result.rows.length>0){
      const user = result.rows[0];
      const stored_pass = user.password;

      bcrypt.compare(password,stored_pass,(err,result)=>{
        if(err) return cb(err);
        if(result) return cb(null,user);
        else return cb(null, false);
      })
    }
    else{
      return cb("User Not Found");
    }
  } 
  catch(err){
    return cb(err);
  }
}));

passport.use('google',new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/chat",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
}, async(accessToken, refreshToken , profile ,cb)=>{
    try{
      const result = await db.query('SELECT * from Users where email=$1',[profile.email]);
      if(result.rows.length==0){
        const newUser = await db.query('INSERT INTO Users(email,password,username) values($1,$2,$3)',[profile.email,"google",profile.given_name+" "+profile.family_name]);
        cb(null,newUser.rows[0]);
      }
      else{
        cb(null,result.rows[0]);
      }
    }
    catch(err){
      cb(err);
    }
}));

passport.serializeUser((user,cb)=>{
  cb(null,user);
})

passport.deserializeUser(async (user,cb)=>{
  cb(null,user);
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

async function query(data) {
  try {
      const response = await fetch(
          "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
          {
              headers: { Authorization: `Bearer ${process.env.TOKEN}` },
              method: "POST",
              body: JSON.stringify(data),
          }
      );

      if (!response.ok) {
          const errorMessage = `HTTP error! Status: ${response.status}`;
          const errorBody = await response.text();
          console.error(errorMessage);
          console.error('Error response body:', errorBody);
          throw new Error(errorMessage);
      }

      const buffer = await response.buffer();
      const base64Image = buffer.toString('base64');
      const mimeType = response.headers.get('content-type');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;
      return dataUrl; 
  } 
  catch (error) {
      console.error('Error fetching image:', error);
      throw error;
  }
}
