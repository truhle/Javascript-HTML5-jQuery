tasksController = function() {
  var taskPage;
  var initialized = false;

  function errorLogger(errorCode, errorMessage) {
    console.log(errorCode + ':' + errorMessage);
  }

  function taskCountChanged() {
    var count = $(taskPage).find('#tblTasks tbody tr').length;
    $('footer').find('#taskCount').text(count);
  }

  function clearTask() {
    $(taskPage).find('form').fromObject({});
  }

  function renderTable() {
    $.each($(taskPage).find('#tblTasks tbody tr'), function(idx, row) {
      var due = Date.parse($(row).find('[datetime]').text());
      if (due.compareTo(Date.today()) < 0) {
        $(row).addClass("overdue");
      } else if (due.compareTo((2).days().fromNow()) <= 0) {
        $(row).addClass("warning");
      }
    });
  }

  function loadFromCSV(event) {
    var reader = new FileReader();
    reader.onload = function(evt) {
      var contents = evt.target.result;
      var worker = new Worker('scripts/tasks-csvparser.js');
      worker.addEventListener('message', function(e) {
        var tasks = e.data;
        storageEngine.saveAll('task', tasks, function() {
          tasksController.loadTasks();
        }, errorLogger);
      }, false);
      worker.postMessage(contents);
    };
    reader.onerror = function(evt) {
      errorLogger('cannot_read_file', 'The file specified cannot be read');
    };
    reader.readAsText(event.target.files[0]);
  }

  return {
    init: function(page, callback) {
      if (initialized) {
        callback();
      } else {
        taskPage = page;
        storageEngine.init(function() {
          storageEngine.initObjectStore('task', function() {
            callback();
          }, errorLogger);
        }, errorLogger);
        $(taskPage).find('[required="required"]').prev('label').append(  '<span>*</span>').children('span').addClass('required');
        $(taskPage).find('tbody tr:even').addClass('even');

        $(taskPage).find('#btnAddTask').click(function(evt) {
          evt.preventDefault();
          $(taskPage).find('#taskCreation').removeClass('not');
        });

        $(taskPage).find('#clearTask').click(function(evt) {
          evt.preventDefault();
          clearTask();
        });

        $(taskPage).find('#tblTasks tbody').on('click', 'tr', function(evt) {
          $(evt.target).closest('td').siblings().andSelf().toggleClass('rowHighlight');
        });

        $(taskPage).find('#tblTasks tbody').on('click', '.completeRow', function(evt) {
          storageEngine.findById('task', $(evt.target).data().taskId, function(task) {
            task.complete = true;
            storageEngine.save('task', task, function() {
              tasksController.loadTasks();
            }, errorLogger);
          }, errorLogger);
        });

        $(taskPage).find('#tblTasks tbody').on('click', '.deleteRow', function(evt) {
          storageEngine.delete('task', $(evt.target).data().taskId, function() {
            $(evt.target).parents('tr').remove();
            taskCountChanged();
          }, errorLogger);
        });

        $(taskPage).find('#tblTasks tbody').on('click', '.editRow', function(evt) {
          $(taskPage).find('#taskCreation').removeClass('not');
          storageEngine.findById('task', $(evt.target).data().taskId, function( task) {
            $(taskPage).find('form').fromObject(task);
          }, errorLogger);
        });

        $(taskPage).find('#saveTask').click(function(evt) {
          evt.preventDefault();
          if ($(taskPage).find('form').valid()) {
            var task = $('form').toObject();
            storageEngine.save('task', task, function() {
              $(taskPage).find('#tblTasks tbody').empty();
              tasksController.loadTasks();
              clearTask();
              $(taskPage).find('#taskCreation').addClass('not');
            }, errorLogger);
          }
        });

        $('#importFile').change(loadFromCSV);

        initialized = true;
      }
    },
    loadTasks: function() {
      $(taskPage).find('#tblTasks tbody').empty();
      storageEngine.findAll('task', function(tasks) {
        tasks.sort(function(o1, o2) {
          return Date.parse(o1.requiredBy).compareTo(Date.parse(o2.requiredBy));
        });
        $.each(tasks, function(index, task) {
          if (!task.complete) {
            task.complete = false;
          }
          $('#taskRow').tmpl(task).appendTo($(taskPage).find('#tblTasks tbody'));
        });
        taskCountChanged();
        renderTable();
      }, errorLogger);
    },
    printProperty: function(obj, property) {
      console.log(obj[property]);
    }
  }
}();
