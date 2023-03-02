const http = require('http');
const express = require('express');
const fs = require('fs');
const url = require('url');
const crypto = require('crypto');
const session = require('express-session');
const { query } = require('express');
const FileStore = require('session-file-store')(session)

const app = express();

if(!fs.existsSync('repo')) fs.mkdirSync('repo');

var secret;

var logString = "";

var credString;
var credentials;

var activity = "none";

var voteText = "Sunteti de acord cu initiativa X?";

var yesVotes = 0;
var noVotes = 0;

var prezentaKey = 0;

if(!fs.existsSync('repo/secret')){
    secret = crypto.randomBytes(35).toString('hex');
    fs.writeFileSync('repo/secret', secret);
}else{
    secret = fs.readFileSync('repo/secret');
}

if(fs.existsSync('repo/credentials')){
    credString = fs.readFileSync('repo/credentials')
    credentials = JSON.parse(credString);
}

app.use(session({
    secret: secret.toString(),
    saveUninitialized:false,
    resave:false,
   	//cookie: {maxAge: none}
    store:new FileStore()
}));

function report(str){
    console.log(str);
    logString = logString.concat('\n', str);
}

function randomIntForPrezenta() {
    return Math.floor(Math.random() * (999 - 100 + 1) + 100);
}



report("sha256 of secret string, check for persistance: 0x" + crypto.createHash('sha256').update(secret).digest('hex'));

Object.keys(credentials).forEach(function(key) {
    credentials[key].votingRights = 0;
    credentials[key].loggedIn = 0;
    credentials[key].present = 0;
});

function giveVotingRights(){
    Object.keys(credentials).forEach(function(key) {
        credentials[key].votingRights = 1;
    });
}

function takeVotingRights(){
    Object.keys(credentials).forEach(function(key) {
        credentials[key].votingRights = 0;
    });
}

function nullPrezenta(){
    Object.keys(credentials).forEach(function(key) {
        credentials[key].present = 0;
    });
}

function nullLogStatus(){
    Object.keys(credentials).forEach(function(key) {
        credentials[key].loggedIn = 0;
    });
}


app.get('/', (request, response) => {
    
    if(!request.session.user){
        response.redirect('/login');
        response.end();
        
    }else{
        response.redirect('/home');
        response.end();
        
    }

    return;
});

app.get('/logout', (request, response) => {
    
    if(request.session.user){
        report('LOGGED OUT: ' + request.session.user);
        credentials[request.session.user].loggedIn = 0;
        request.session.user = '';
        response.redirect('/');
        response.end();
        return;
    }
});

app.get('/login', (request, response) => {
    fs.readFile('./webFiles/login.html', function(error, content){
        if(error) report(error);

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(content);
    });

    return;
});

app.get('/loginact', (request, response) => {
    

    if(request.query.user && request.query.pass){

        var quser = request.query.user.toLowerCase();

        if(activity === 'pass'){
            credentials[quser].pass = crypto.createHash('sha256').update(quser).digest('hex');
            report(quser + " RESET THEIR PASSWORD");
            response.writeHead(200);
            response.end('PASSWORS SET SUCCESFULLY!');
            return;
        }
        
        if(credentials[quser].pass === crypto.createHash('sha256').update(request.query.pass).digest('hex')){

            request.session.user = quser;
            credentials[quser].loggedIn = 1;
            report("LOG IN: " + quser);
        }

    }

    response.redirect('/home');
    response.end();

    return;
});

app.get('/home', (request, response) => {
    
    if(request.session.user === 'admin'){
        response.redirect('/admin');
        response.end();
        return;
    }

    if(request.session.user){
        if(activity === "none"){
            fs.readFile('./webFiles/noactivity.html', function(error, content){
                if(error) report(error);
        
                contentx = content.toString().replace("$USER$" , request.session.user);
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(contentx);
            });
        }

        if(activity === "prezenta"){
            if(credentials[request.session.user].present === 0){
                fs.readFile('./webFiles/prezent.html', function(error, content){
                    if(error) report(error);
            
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    response.end(content);
                });
            }else{
                fs.readFile('./webFiles/noactivity.html', function(error, content){
                    if(error) report(error);
            
                    contentx = content.toString().replace("$USER$" , request.session.user);
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    response.end(contentx);
                });
            }
        }

        if(activity === "vote" && credentials[request.session.user].votingRights === 1){
            fs.readFile('./webFiles/vote.html', function(error, content){
                if(error) report(error);
        
                contentx = content.toString().replace("$VOTETEXT$" , voteText);
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(contentx);
            });
        }

        if(activity === "vote" && credentials[request.session.user].votingRights === 0){
            fs.readFile('./webFiles/alrvote.html', function(error, content){
                if(error) report(error);
        
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(content);
            });
        }

        if(activity === "show"){
            fs.readFile('./webFiles/show.html', function(error, content){
                if(error) report(error);
        
                contentx = content.toString().replace("$VOTETEXT$" , voteText);
                contentx = contentx.toString().replace("$YESVOTES$", yesVotes);
                contentx = contentx.toString().replace("$NOVOTES$", noVotes);

                if(yesVotes >= noVotes)
                    contentx = contentx.toString().replace("$RESULT$", "Motiunea a trecut");
                
                else
                contentx = contentx.toString().replace("$RESULT$", "Motiunea a picat");

                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(contentx);
            });
        }


    }else{
        response.redirect("/");
        response.end();
    }
    return;
});

app.get('/dashboard', (request, response) => {
    
    if(activity === "show"){
        fs.readFile('./webFiles/show.html', function(error, content){
            if(error) report(error);
    
            contentx = content.toString().replace("$VOTETEXT$" , voteText);
            contentx = contentx.toString().replace("$YESVOTES$", yesVotes);
            contentx = contentx.toString().replace("$NOVOTES$", noVotes);

            if(yesVotes >= noVotes)
                contentx = contentx.toString().replace("$RESULT$", "Motiunea a trecut");
            
            else
            contentx = contentx.toString().replace("$RESULT$", "Motiunea a picat");
        response.writeHead(200, {'Content-Type': 'text/html'});
            response.end(contentx);
        });
    }else{
        fs.readFile('./webFiles/nodash.html', function(error, content){
            if(error) report(error);
    
            contentx = content.toString().replace("$USER$" , request.session.user);
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.end(contentx);
        });
    }
    
    return;
});

app.get('/vote/yes', (request, response) => {
    
    if(request.session.user){
        if(credentials[request.session.user].votingRights === 1 && credentials[request.session.user].present === 1){
            credentials[request.session.user].votingRights = 0;
            yesVotes++;
            report(request.session.user + " - YES");
        }else{
            response.writeHead(200);
            response.end("AI VOTAT DEJA / NU ESTI PREZENT");
            return;
        }
    }

    response.redirect('/home');
    response.end();
    return;
});

app.get('/vote/no', (request, response) => {

    if(request.session.user){
        if(credentials[request.session.user].votingRights === 1 && credentials[request.session.user].present === 1){
            credentials[request.session.user].votingRights = 0;
            noVotes++;
            report(request.session.user + " - NO");
        }else{
            response.writeHead(200);
            response.end("AI VOTAT DEJA / NU ESTI PREZENT");
            return;
        }
    }

    response.redirect('/home');
    response.end();
    return;
});

app.get('/prezenta', (request, response) => {

    if(request.session.user && activity === 'prezenta'){
        if(request.query.key === prezentaKey.toString()){
            credentials[request.session.user].present = 1;
        }else{
            response.writeHead(200);
            response.end('BAD CODE');
            return;
        }
    }

    response.redirect('/home');
    response.end();
    return;
});

app.get('/admin', (request, response) => {
    
    if(request.session.user === 'admin'){
        fs.readFile('./webFiles/adminpanel.html', function(error, content){
            if(error) report(error);
    
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.end(content);
            return;
        });
    }else{
        response.redirect('/');
        response.end();
        return;
    }
});

app.get('/admindo', (request, response) => {
    
    if(request.session.user === 'admin'){
        if(request.query.do === 'start-vot'){
            activity = "vote";
            voteText = request.query.text;
            giveVotingRights();
            report("------------VOT: " + voteText + " ------------");
        }

        if(request.query.do === 'clear'){
            takeVotingRights();
            activity = "none";
            yesVotes = 0;
            noVotes = 0;
            report("------------CLEAR------------");
        }

        if(request.query.do === 'show'){
            takeVotingRights();
            activity = "show";
            report("------------");
            report("DA - " + yesVotes.toString() + " | NU - " + noVotes.toString());
            report("------------STOP VOT------------");
        }

        if(request.query.do === 'pass'){
            report("------------SETTING PASSWORDS------------");
            activity = "pass";
        }

        if(request.query.do === 'writerepo'){
            report("------------STOP PASSWORD SETTING------------");
            activity = "none";
            fs.writeFileSync('repo/credentials', JSON.stringify(credentials));
        }

        if(request.query.do === 'getaudit'){
            response.writeHead(200);
            response.end(logString);
            return;
        }

        if(request.query.do === 'prezenta'){
            report("------------START PREZENTA------------");
            activity = 'prezenta';
            prezentaKey = randomIntForPrezenta();
            report("KEY: " + prezentaKey);
        }

        if(request.query.do === 'stopprezenta'){
            activity = 'none';
            report("------------PREZENTA------------");
            var prezenti = 0;
            Object.keys(credentials).forEach(function(key) {
                report(key.toString() + " - " + (credentials[key].present && credentials[key].loggedIn));
                if(credentials[key].present && credentials[key].loggedIn) prezenti++;
            });
            report("++ PREZENTI: " + prezenti.toString() + " ++");
            report("------------PREZENTA------------");
        }
        if(request.query.do === 'reset'){

            takeVotingRights();
            nullLogStatus();
            nullPrezenta();

            activity = 'null';

            logString = '';

            response.redirect('/logout');
            response.end();
            return;
        }
    }

    response.redirect('/admin');
    response.end();
    return;
});

app.get('/css/dist.css', (request, response) => {
    
    fs.readFile('./css/dist.css', function(error, content){
        if(error) report(error);

        response.writeHead(200, {'Content-Type': 'text/css'});
        response.end(content);
    });

    return;
});

app.get('/css/manrope.ttf', (request, response) => {
    
    fs.readFile('./css/manrope.ttf', function(error, content){
        if(error) report(error);

        response.writeHead(200, {'Content-Type': 'font/ttf'});
        response.end(content);
    });

    return;
});


const server = http.createServer(app);
server.listen(8881);
