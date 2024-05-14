const mongo=require("mongoose");
require("dotenv").config();
const db= process.env.DATABASE;


mongo.connect(db)
.then(()=>{
    console.log("mongo db is connectd");
}).catch((e)=>console.log(`Error occured ${e}`));

const schema=new mongo.Schema({
    googleId:String,
    name:{
        type: String,
        required: true
    },
    email:{
        type:String,
       
    },
    password:{
        type:String
    },
    image:String
})

const model=mongo.model("UserDetails",schema);
module.exports=model;