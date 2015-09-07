
angular.module('coderace.race', ['ui.codemirror'])

.controller('raceController', function ($scope, Race, socket){
  // codemirror options
  $scope.editorOptions = {
      lineWrapping : true,
      lineNumbers: true,
      theme: 'cobalt',
      mode: 'javascript',
      keymap: 'sublime',
      autofocus: true
  };

  var textArea = document.getElementById('opponentEditor');
  autosize(textArea);  
  // var myCodeMirror = CodeMirror.fromTextArea(textArea);
  // codemirror opponent editor
  // var editor = new CodeMirror(CodeMirror.replace("#opponentEditor"), {
  //   parserfile: ["http://codemirror.net/1/js/tokenizejavascript.js", 
  //   "http://codemirror.net/1/js/parsejavascript.js"],
  //   path: "../codemirror/",
  //   stylesheet: "../../css/jscolors.css",
  //   content: document.getElementById("opponentEditor").value
  // });

  Race.getData();
  function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }//generate a random number

  var random = getRandomArbitrary(0, Race.question.length);//random is between 0 and the number of questions
  
  $scope.code = Race.start[random]; //set a temp value to put in the text area. This needs to be abstracted.

  $scope.question = Race.question[random];

  //sets a global variable called expect that utilizes the Chai library.
  expect = chai.expect;

  $scope.evaluate = function(code) {

    //these will be pulled from the Race factory.
    var challengeInputs = {
      // inputs: Race.input[random],
      // output: Race.output[random],
      // functionName: Race.name[random],
      //inputs: Race.input[0],
      inputs: [1,2,3], 
      //answer: Race.answer[0],
      answers: 6,
      functionName: "sum",
    };//the challenge is randomly generated

    //the worker will not be able to access the factory directly.
    //data must be passed to the worker.
    if (window.Worker) { //verify that the browser has worker capability.
      var evalWorker = new Worker("client/evalWorker.js");
      evalWorker.postMessage(challengeInputs);
      
      var workerComplete = false;
      evalWorker.onmessage = function(e) { //when the worker sends back its response, update the scope.
        $scope.inputs = e.data.inputs;
        $scope.response = e.data.response;
        $scope.answers = e.data.answer;
        $scope.$apply(); //apply the new scope var to the view.
        workerComplete = true; //don't execute the timeout function.
      }
      
      //check for worker timeout.
      setTimeout(function() {
        if (workerComplete === false){ //the worker has not completed after 5 seconds.
          console.log("taking longer than 5 seconds");
          evalWorker.terminate(); //terminate the worker.
        }
      }, 5000);
    }
  }

  var userId;
  socket.on('userId', function(data){
    userId = data.userId
  });

  $scope.typing = function(code){
    socket.emit('typing', {
      code: code,
      userId: userId
    });
  };

  socket.on('typing', function(data) {
    // if (data.userId !== userId) { //if the typing event emitted from the server does not have the same userId as the userId on this client
      $scope.competitorCode = data.code; //populate the competitor text area with the other users code.
    // }
  });

});