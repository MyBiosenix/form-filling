const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true,
        unique:true
    },
    admin:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Admin',
        required: true
    },
    packages:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Packagee',
        required:true
    },
    price:{
        type: Number,
        required: true
    },
    paymentoptions:{
        type:String,
        enum:["cash","cheque","online","gpay","phonepe"],
        required:true
    },
    expiry:{
        type:Date,
        required:true
    },
    status:{
        type:Boolean,
        default:true
    },
    lastLoginSession: { type: String, default: null },
    isDraft: {
        type: Boolean,
        default: false,
        index: true,
    },
    reportDeclared:{
        type: Boolean,
        default: false,
        index: true
    },
    isComplete: {
        type: Boolean,
        default: true,
        index: true,
    }
})

module.exports = mongoose.model("User",userSchema);