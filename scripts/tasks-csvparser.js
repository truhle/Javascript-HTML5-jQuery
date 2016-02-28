self.addEventListener('message', function(msg) {
  var data = msg.data;
  var lines = data.split("\n");
  var tasks = [];
  for (var i = 0; i < lines.length; i++) {
    var val = lines[i]
    if(i >=1 && val) {
      var task = loadTask(val);
      if (task) {
        tasks.push(task);
      }
    }
  };
  self.postMessage(tasks);
}, false);

function loadTask(csvTask) {
  console.log(csvTask);
  var tokens = csvTask.split(',');
  if (tokens.length == 3) {
    var task = {};
    task.task = tokens[0];
    task.requiredBy = tokens[1];
    task.category = tokens[2];
    return task;
  }
  return null;
}
