'use strict';

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
const cors = require('cors');
const expressLayouts =require('express-ejs-layouts');

// server setup 
const app = express();

// middlewares
require('dotenv').config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.use(expressLayouts);


// database setup
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });


// *****************************************

// Routes
app.get('/', homeRoute);
app.post('/favourites' , favAdd);
app.get('/favourites' , favRender);
app.get('/details/:id' ,detailRender);
app.put('/detalis/:id' ,detailUpdate);
app.delete('/details/:id',detailDelete);
app.get('/random' , generateRandom);



// Handlers
function homeRoute(req,res){

    let url ='https://official-joke-api.appspot.com/jokes/programming/ten';

    superagent(url)
    .then(result =>{
        let jokesArr = result.body.map(item => new Joke (item));
            // console.log(jokesArr);
        res.render('pages/index' , {jokes :jokesArr});
    })
}

function favAdd (req,res){
    let {id , type , setup , punchline} = req.body;
    // console.log(req.body);
    let SQL = `INSERT INTO jokes (joke_id , type , setup , punchline) VALUES ($1, $2, $3, $4) RETURNING *;`;
    let values = [id, type , setup , punchline ];

    client.query(SQL,values)
    .then(result => {
        res.redirect('/favourites');
    })
}

function favRender(req,res){
    let SQL =`SELECT * FROM jokes;`;
    client.query(SQL)
    .then(result =>{
        res.render('pages/favourites' , {jokes : result.rows});
    })
}

function detailRender(req,res){

    let SQL =`SELECT * FROM jokes WHERE id=${req.params.id};`;
    client.query(SQL)
    .then(result =>{
        res.render('pages/details' , {joke: result.rows[0]});
    });
}

function detailUpdate(req,res){
    let {setup , punchline} = req.body;
    let SQL = `UPDATE jokes SET setup=$1 , punchline=$2 WHERE id=$3;`;
    let values = [setup , punchline , req.params.id];

    client.query(SQL,values)
    .then(()=>{
        res.redirect(`/details/${req.params.id}`);
    })
}

function detailDelete(req,res){
    let SQL =`DELETE FROM jokes WHERE id=$1;`;
    let values =[req.params.id];

    client.query(SQL,values)
    .then(() =>{
        res.redirect('/favourites');
    })
}

function generateRandom (req,res){

    let url = 'https://official-joke-api.appspot.com/jokes/programming/random';

    superagent(url)
    .then(result =>{
        let joke = new Joke(result.body[0]);
        res.render('pages/random' , {joke: joke});
    })
}

// Constructors
function Joke(data){
    this.joke_id = data.id;
    this.type = data.type;
    this.setup = data.setup;
    this.punchline = data.punchline;

}



// ****************************************

// Listening 

const PORT = process.env.PORT || 3030;

client.connect()
.then(() => {
    app.listen(PORT , () =>{
        
        console.log(`http://localhost:${PORT}/`);
    })
})




