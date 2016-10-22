window.addEventListener("load", ready);

var counter = 1;
var s = counter.toString();
getVidData();

function ready(){

  $("#uploadmodal").leanModal();
  if(window.File && window.FileReader){
    document.getElementById('filebox').addEventListener('change', fileChosen);
    document.getElementById('uploadbutton').addEventListener('click', startUpLoad);
    document.getElementById('closebutton').addEventListener('click', closeModal);
  }
  else{
    document.getElementById('uploadarea').innerHTML = "Browser not supported";
  }
}

var selectedFile;

function fileChosen(event){
  selectedFile = event.target.files[0];
  document.getElementById('namebox').value = selectedFile.name;
}

var fReader;
var name;
var desc;
var socket = io();

function startUpLoad(){
  if(document.getElementById('filebox').value != ""){
    fReader = new FileReader();
    name = document.getElementById('namebox').value;
    desc = document.getElementById('descbox').value;
    var content = "<span id ='namearea'>Uploading "+name+"</span>";
        content += "<div id='progresscontainer'><div id='progressbar'></div></div><span id='percent'>0%</span>";
        content += "<span id='uploaded'>---<span id='MB'>0</span>/" + Math.round(selectedFile.size / 1048576)+"MB</span>";
        document.getElementById('uploadarea').innerHTML = content;
        fReader.onload = function(evnt){
          socket.emit('Upload', {'Name' : name, Data : evnt.target.result});
        }
          socket.emit('Start', {'Name' : name, 'Size' : selectedFile.size});
          videoDet(name, desc);
    }
    else{
      alert("please select a file");
    }
 }

 socket.on('MoreData', function(data){
   UpdateBar(data['Percent']);
   var place = data['Place'] * 524288;
   var NewFile;
   if(selectedFile.webkitSlice)
     NewFile = selectedFile.webkitSlice(place, place + Math.min(524288, (selectedFile.size - place)));
   else
     NewFile = selectedFile.slice(place, place + Math.min(524288, (selectedFile.size - place)));
     fReader.readAsBinaryString(NewFile);
 });

 function UpdateBar(percent){
   document.getElementById('progressbar').style.width = percent + '%';
   document.getElementById('percent').innerHTML = (Math.round(percent*100)/100) + '%';
   var mbDone = Math.round(((percent/100.0) * selectedFile.size) / 1048576);
   document.getElementById('MB').innerHTML = mbDone;
 }

 var path = "http://localhost:3000";
 socket.on('Done', function(data){
   var content = "<div class='success'><img id='thumb' src='success.png' alt='" + name + "'><br>";
   content += "<button  type='button' value='' id='close' class='waves-effect waves-light btn'>Close</button></div>";
   document.getElementById('uploadarea').innerHTML = content;
   document.getElementById('close').addEventListener('click', refresh);
 });

 function refresh(){
   location.reload(true);
 }

  function videoDet(name, desc){

    $.ajax({
      type: "POST",
      url: 'http://localhost:3000/vdetails',
      data: {name:name, desc:desc},
      success: function(data){
        console.log('post successful!');
        //getVidData(); //function to fetch saved videos details
      },
      error: function(){
        console.log('post error!');
      }
    });
  }

  function getVidData(){

    $.ajax({
            url:'http://localhost:3000/details',
            type: 'GET',
            success: function(data){
                data.forEach(function(details){
                  if(details.name != ""){
                    var vidName = details.name;
                    createImage(vidName);
                  }
                  else{
                    console.log("error fetch details");
                  }
                });
             },
            error: function(error) {
                  console.log("Error fetching getVidData!!");
            }
        });
      }


function createImage(vidName){
  var imgTag = "<div class = 'div_img col s4'><img id= 'id_"+s+"'  width='42' height='42' class='image' src='http://localhost:3000/vid/"+vidName+"' alt='"+ vidName+"'>"+"<p>"+vidName+"</p></div>";


//var imgTag = "<div class = 'div_img col s4'><img src='http://localhost:3000/vid/"+vidName+"' alt='"+ vidName+"'>"+"<p>"+vidName+"</p></div>";

  $('#posters').append(imgTag);
  s++;
  $(".image").on("click", function(){
    var alt = document.getElementById(this.id).getAttribute('alt');
    getVideo(alt);
  });
}

  function getVideo(vname){
    console.log("video name requested:"+vname);
    $.ajax({
            url:'http://localhost:3000/vid/'+vname,
            type: 'GET',
            success: function(data) {
                console.log('success get video');
                /*var vidCont = "<video class='video-js' controls autoplay preload='auto' width='640' height='264' poster='poster.jpeg' data-setup='{}'>";
                   vidCont += "<source id='srctag' src='http://localhost:3000/vid/"+vname+"' type='video/mp4'></source></video>";*/

var vidCont = "<image width='42' height='42'>";
                   vidCont += "<img src='http://localhost:3000/vid/"+vname+"'>";

                  

                   document.getElementById('video').innerHTML = vidCont;
                var src = document.getElementById('srctag').getAttribute("src");
                console.log("Source of vid:" +src);
            },
            error: function(error) {
                console.log("server down!!");
             }
        });
  }


  function closeModal(){
    $('.modal').closeModal();
  }
