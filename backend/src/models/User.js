const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        
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
    totalFormsDone: {
        type: Number,
        default: 0,
        min: 0,
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
    },
    softwareUsed: {
        type: Boolean,
        default: false,
    },
  notInSequence: {
  type: Boolean,
  default: false,
},

showNotInSequenceTable: {
  type: Boolean,
  default: false,
},
isDeleted: {
  type: Boolean,
  default: false,
  index: true,
},

deletedAt: {
  type: Date,
  default: null,
},

deletedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Admin",
  default: null,
},

})

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

userSchema.index({ status: 1 });
userSchema.index({ admin: 1, status: 1 });
userSchema.index({ status: 1, isDraft: 1, expiry: 1 });
userSchema.index({ admin: 1, isDraft: 1, expiry: 1 });
userSchema.index({ admin: 1, isDraft: 1, status: 1 });
userSchema.index({ reportDeclared: 1, status: 1 });

module.exports = mongoose.model("User",userSchema);
