var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
var ss = require('socket.io-stream');
var mongoose = require("mongoose");
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var util = require('util');
var thumbler = require('video-thumb');


    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    app.use(express.static(__dirname));

    app.get('/', function(req, res) {
       res.sendFile("/index.html");
    });

    mongoose.connect('mongodb://localhost/wetube', function(err,ok){
      console.log("Connected to Mongo");
    });

    var VideoSchema = mongoose.Schema({
       "name": String,
       "desc": String
    });

    var Model = mongoose.model("Model", VideoSchema);

       var files = {};
       io.on('connection', function(socket){

               socket.on('Start', function(data){
                 var name = data['Name'];
                 files[name] = {
                   FileSize : data['Size'],
                   Data : "",
                   Downloaded : 0
                 }

                 var place = 0;

                 try{
                   var stat = fs.statSync('Temp/'+name);
                   if(stat.isFile()){
                     console.log('Its a file');
                     files[name]['Downloaded'] = stat.size;
                     place = stat.size / 524288;
                   }
                 }
                 catch(er){
                   console.log('Its a new file:' +er);
                 }

                 fs.open("Temp/"+name, "a", 0755, function(err, fd){
                   if(err){
                     console.log(err);
                   }
                   else{
                     files[name]['Handler'] = fd;
                     socket.emit('MoreData', {'Place' : place, Percent : 0});
                   }
                 });

               });

            socket.on('Upload', function(data){

                 var name = data['Name'];
                 var narep = name.replace('.mp4','');
                 files[name]['Downloaded'] += data['Data'].length;
                 files[name]['Data'] += data['Data'];

                 if(files[name]['Downloaded'] == files[name]['FileSize']){
                   fs.write(files[name]['Handler'], files[name]['Data'], null, 'Binary', function(err, Writen){
                      var inp = fs.createReadStream("Temp/"+name);
                      var out = fs.createWriteStream("Video/"+name);
                      util.pump(inp, out, function(){
                        fs.unlink("Temp/"+name, function(){
                         });
                      });
                      exec("ffmpeg -i Video/" + name  + " -ss 01:30 -r 1 -an -vframes 1 -f mjpeg Video/" + narep  + ".jpg", function(err){
                        socket.emit('Done', {'Image' : 'Video/' + narep + '.jpg'});
                      });
                   });
                 }
                 else if(files[name]['Data'].length > 10485760){
                   fs.write(files[name]['Handler'], files[name]['Data'], null, 'Binary', function(err, Writen){
                     files[name]['Data'] = "";
                     var place = files[name]['Downloaded'] / 524288;
                     var percent = (files[name]['Downloaded'] / files[name]['FileSize']) * 100;
                     socket.emit('MoreData', {'Place' : place, 'Percent' : percent});
                   });
                 }
                 else{
                   var place = files[name]['Downloaded'] / 524288;
                   var percent = (files[name]['Downloaded'] / files[name]['FileSize']) * 100;
                   socket.emit('MoreData', {'Place' : place, 'Percent' : percent});
                 }
               });
       });

       app.get("/vid/:vname", function(req,res){
         var reqName = req.params.vname;
         console.log(reqName);
         res.sendFile(__dirname+"/Video/"+reqName);
       });

       app.post("/vdetails", function(req,res){
         var newVid = new Model({"name":req.body.name, "desc":req.body.desc});
         newVid.save(function(err, result){
           if(err !== null){
             console.log(err);
             res.send("ERROR");
           }else{
             Model.find({},function(err, result){
               if(err !== null){
                 res.send("ERROR");
               }else{
                 res.json(result);
               }
             });
           }
         });
       });

       app.get("/details", function(req,res){
         Model.find({}, function(err,details){
           if(err!== null){
             console.log("Error getting details:" +err);
             return;
           }else{
             res.send(details);
           }
         });
       });


       http.listen(3000, function(){
         console.log('Listening on 3000');
       });
