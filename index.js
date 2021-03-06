var http = require('http');
var server = http.createServer(function(req,res){
  res.writeHead(200, {'Content-Type':'text/plain'});
  res.end("okay");
})
var io = require('socket.io')({transports:['websocket']});

io.attach(4567);

var connectedClients = {GM3oKGGQSqxL81ejAAAB:{name:"Computer", ready: true, finished: true,points: 120, time:"0:25:3", profile: "data"}};

if(process.env.NODE_ENV == "dev"){
  console.log("DEV MODE");
  connectedClients = {GM3oKGGQSqxL81ejAAAB:{name:"Computer", ready: true, finished: true,points: 120, time:"0:25:3", profile: "data"}};
} else {
  console.log("PROD MODE");
}

var submitted = 0;
var competitorsReady = 0;
var competitorsFinished = 0;
var profileImages = ["vader","spock","snoo","kylo","solo","kirk","yoda","luke","leia"]

io.on('connection', function(socket){
  console.log("client connected", socket.id);

  // var clientObj = {id: socket.id};
  // connectedClients.push(clientObj);
  connectedClients[socket.id] = {};
  console.log("connected clients length", Object.keys(connectedClients).length);
  socket.emit("connected");

  socket.on('name', function(data){
    console.log("RECEIVED NAME:", data.name);


    if(submitted >= profileImages.length){
      submitted = 0;
    } 

    var competitorObj = {
      name: data.name,
      ready: false,
      finished: false,
      points: 0,
      time: "DNF",
      profile: profileImages[submitted]
    }
    submitted++;
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

    
    io.emit('competitors',{"competitors":competitorArray});
    
    
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

    var ready = 0;

    for(var c in connectedClients){
      if(connectedClients[c].ready){
        ready++;
      }
    }

    if(ready == Object.keys(connectedClients).length && ready>1){
      io.emit("start-race");
    } 
  
  })

  socket.on('finish', function(data){
    connectedClients[socket.id].points = parseInt(data.points);
    connectedClients[socket.id].time = data.time;
    connectedClients[socket.id].finished = true;

    // var finished = 0;

    // for(var c in connectedClients){
    //   if(connectedClients[c].finished){
    //     finished++;
    //   }
    // }

    // emit to all clients when all competitors have finished the race
    // if(finished == Object.keys(connectedClients).length){
    //   io.emit("all-finished")
    // }
    socket.emit("all-finished");
  })

  var timer = null;

  socket.on('ping', function(){
    clearTimeout(timer)
    timer = null
    socket.emit("pong")
    disconnectClient()
  })

  function disconnectClient(){
    timer = setTimeout(function(){
      socket.disconnect()
    },20000)
  }

  socket.on('results', function(){

    // do this so you can return you to the person for name
    //connectedClients[socket.id].name = "You";

    var standing = []

    for(var id in connectedClients){
      if(connectedClients[id].finished){
        standing.push(connectedClients[id]);
      }
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

    io.emit("results", {"results":standingArray});
  })

  socket.on('disconnect', function(){
    // connectedClients = connectedClients.filter(function(obj){
    //   return obj.id != socket.id;
    // })
    delete connectedClients[socket.id];

    var competitorArray = []

    for(var id in connectedClients){
      var arr = []
      arr.push(connectedClients[id].name)
      arr.push(connectedClients[id].profile)
      competitorArray.push(arr)
    }

    io.emit('competitors',{"competitors":competitorArray});

    var ready = 0;

    for(var c in connectedClients){
      if(connectedClients[c].ready){
        ready++;
      }
    }

    if(ready == Object.keys(connectedClients).length && ready>1){
      io.emit("start-race");
    }
    
    console.log("connected clients length", Object.keys(connectedClients).length)
    console.log("client disconnected", socket.id);
  })
})

server.listen(8080, function(){
  console.log("Server listening");
})

