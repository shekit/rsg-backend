var http = require('http');
var server = http.createServer()
var io = require('socket.io')({transports:['websocket']});

io.attach(4567);

var DEVELOPMENT = true; // change this

var connectedClients = {};

if(DEVELOPMENT){
  connectedClients = {GM3oKGGQSqxL81ejAAAB:{name:"Enemy", ready: false, points: 4000}};
}

var competitorsReady = 0;
var competitorsFinished = 0;

io.on('connection', function(socket){
  console.log("client connected", socket.id);

  // var clientObj = {id: socket.id};
  // connectedClients.push(clientObj);
  connectedClients[socket.id] = {};
  console.log("connected clients length", Object.keys(connectedClients).length);

  socket.on('name', function(data){
    console.log("RECEIVED NAME:", data.name);
    var competitorObj = {
      name: data.name,
      ready: false,
      points: 0
    }
    connectedClients[socket.id] = competitorObj;
    console.log(connectedClients);
  })

  socket.on('competitors', function(){
    console.log("send competitors");
    if(Object.keys(connectedClients).length == 1){
      // make unity repeat the socket call
      socket.emit('no-competitors');
    } else {
      var competitorNames = [];

      for(var id in connectedClients){
        if(id != socket.id){
          competitorNames.push(connectedClients[id].name);
        }
      }

      io.emit('competitors', {"competitors":competitorNames});
    }

  })

  socket.on('ready', function(){
    connectedClients[socket.id].ready = true; 

    competitorsReady++;

    var readyLength = 0;

    if(DEVELOPMENT){
      readyLength = Object.keys(connectedClients).length-1;
    } else {
      readyLength = Object.keys(connectedClients).length;
    }

    if(competitorsReady == readyLength){
      io.emit("start-race");
    } 
    

  })

  socket.on('finish', function(points){
    connectedClients[socket.id].points = points;
    competitorsFinished++;

    if(DEVELOPMENT){
      readyLength = Object.keys(connectedClients).length-1;
    } else {
      readyLength = Object.keys(connectedClients).length;
    }

    // emit to all clients when all competitors have finished the race
    if(competitorsFinished == readyLength){
      io.emit("all-finished")
    }
  })

  socket.on('results', function(){

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

