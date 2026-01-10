require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/AdminRoutes');
const userRoutes = require('./routes/UserRoutes');

connectDB();
const App = express();
App.use(cors());
App.use(express.json());

const PORT = process.env.PORT;
App.use('/api/admin',adminRoutes);
App.use('/api/user',userRoutes);

App.listen(PORT,()=>{
    console.log(`Server Started on Port ${PORT}`)
})