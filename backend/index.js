require('dotenv').config();
const express = require('express');
const cors = require('cors');

const App = express();
App.use(cors());

const PORT = process.env.PORT;
App.get('/',(req,res)=>{
    res.send('API is Working!');
});

App.get('/user',(req,res)=>{
    res.send('User Found');
})


App.listen(PORT,()=>{
    console.log(`Server Started on Port ${PORT}`)
})