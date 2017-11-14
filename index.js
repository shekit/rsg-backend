var http = require('http');
var server = http.createServer(function(req,res){
  res.writeHead(200, {'Content-Type':'text/plain'});
  res.end("okay");
})
var io = require('socket.io')({transports:['websocket']});

io.attach(4567);

var connectedClients = {};

if(process.env.NODE_ENV == "dev"){
  console.log("DEV MODE");
  connectedClients = {GM3oKGGQSqxL81ejAAAB:{name:"Enemy", ready: true, finished: true,points: 4000, time:"3:04", profile: "vader"}};
} else {
  console.log("PROD MODE");
}

var competitorsReady = 0;
var competitorsFinished = 0;
var profileImages = ["vader","spock","snoo","kylo","solo","kirk","yoda","luke","leia"]

io.on('connection', function(socket){
  console.log("client connected", socket.id);

  // var clientObj = {id: socket.id};
  // connectedClients.push(clientObj);
  connectedClients[socket.id] = {};
  console.log("connected clients length", Object.keys(connectedClients).length);

  socket.on('name', function(data){
    console.log("RECEIVED NAME:", data.name);

    var imageIndex = 0;

    if(Object.keys(connectedClients).length > profileImages.length){
      imageIndex = 0;
    } else {
      imageIndex = Object.keys(connectedClients).length-1
    }

    var competitorObj = {
      name: data.name,
      ready: false,
      finished: false,
      points: 0,
      profile: profileImages[imageIndex]
    }
    connectedClients[socket.id] = competitorObj;
    console.log(connectedClients);
  })

  socket.on('competitors', function(){
    console.log("send competitors");

    //connectedClients[socket.id].name = "You";

    var competitorArray = []

    for(var id in connectedClients){
      var arr = []
      arr.push(connectedClients[id].name)
      arr.push(connectedClients[id].profile)
      competitorArray.push(arr)
    }

    if(competitorArray.length > 1){
      io.emit('competitors',{"competitors":competitorArray});
    }
    
    // var competitorNames = [];

    // for(var id in connectedClients){
    //   if(id != socket.id){
    //     competitorNames.push(connectedClients[id].name);
    //   }
    // }

    // if(competitorNames.length > 0){
    //   io.emit('competitors', {"competitors":competitorNames});
    // }

  })

  socket.on('ready', function(){
    connectedClients[socket.id].ready = true; 

    //competitorsReady++;

    var ready = 0;

    for(var c in connectedClients){
      if(connectedClients[c].ready){
        ready++;
      }
    }

    // var readyLength = 0;

    // if(DEVELOPMENT){
    //   readyLength = Object.keys(connectedClients).length-1;
    //   console.log("READDYY")
    // } else {
    //   readyLength = Object.keys(connectedClients).length;
    // }

    if(ready == Object.keys(connectedClients).length){
      io.emit("start-race");
    } 
    

  })

  socket.on('finish', function(data){
    connectedClients[socket.id].points = parseInt(data.points);
    connectedClients[socket.id].time = data.time;
    connectedClients[socket.id].finished = true;

    var finished = 0;

    for(var c in connectedClients){
      if(connectedClients[c].finished){
        finished++;
      }
    }

    // emit to all clients when all competitors have finished the race
    if(finished == Object.keys(connectedClients).length){
      io.emit("all-finished")
    }
  })

  socket.on('results', function(){

    // do this so you can return you to the person for name
    //connectedClients[socket.id].name = "You";

    var standing = []

    for(var id in connectedClients){
      standing.push(connectedClients[id]);
    }

    //sort in descending
    standing.sort(function(a,b){
      return b.points - a.points
    })

    var standingArray = []

    // convert into 2D array so c# can handle
    for(var i in standing){
      var arr = [];
      arr.push(standing[i].name)
      arr.push(standing[i].points)
      arr.push(standing[i].time)
      arr.push(standing[i].profile)
      standingArray.push(arr);
    }

    socket.emit("results", {"results":standingArray});
  })

  socket.on('disconnect', function(){
    // connectedClients = connectedClients.filter(function(obj){
    //   return obj.id != socket.id;
    // })
    delete connectedClients[socket.id];
    console.log("connected clients length", Object.keys(connectedClients).length)
    console.log("client disconnected", socket.id);
  })
})

server.listen(8080, function(){
  console.log("Server listening");
})

