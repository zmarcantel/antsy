(function() {
  if (typeof module === "undefined") self.antsy = antsy;
  else module.exports = function(){ return new antsy };
  antsy.version = "0.0.1";

  var slice = [].slice;

  function antsy() {
    this.queue        = [],
    this.started      = 0,
    this.active       = 0,
    this.remaining    = 0,
    this.error        = null;

    this.results      = [];
    this.finished_cb  = null;


    //
    // pop tasks off the stack
    // declared as a var so it's visible, but bound to `this` queue
    //
    var pop = (function() {
      while (this.started < this.queue.length)
      {
        var starting_index    = this.started++,
            next_task         = this.queue[starting_index],
            apply_task        = slice.call(next_task, 1);

        // get the fuction the task was added with
        apply_task.push(handler(starting_index));
        ++this.active;
        // apply the function to the given arguments
        // push to results array
        this.results.push(next_task[0].apply(null, apply_task));

        this.remaining--;
      }
    }).bind(this);

    //
    // callback for when a task has completed
    //
    var handler = (function(i) {
      return function(err, result) {
        --this.active;
        if (err != null) {
          this.error = err;
          end();
        } else {
          this.tasks[i] = result;
          if (--this.remaining) pop();
          else end();
        }
      }
    }).bind(this);

    //
    // do something now
    //
    this.now = function() {
      // make sure there wasn't any error earlier in the chain
      if (this.error != null) {
        // TODO: if callback exists, skip to callback
        return this;
      }

      // check that an argument was given
      if (arguments.length == 0) {
        this.error = "NOW ERR: No argument given";
        if (this.finished_cb) this.finished_cb(this.error, this.results);
        else return this;
      }

      // make sure we were given a function as the first arg
      if (typeof arguments[0] != "function") {
        this.error = "NOW ERR: First argument not a function";
        if (this.finished_cb) this.finished_cb(this.error, this.results);
        else return this;
      }

      // and that we weren't given too many arguments
      if ((arguments.length - 1) > arguments[0].length) {
        this.error = "NOW ERR: Too many arguments for function";
        if (this.finished_cb) this.finished_cb(this.error, this.results);
        else return this;
      }

      // add the function and arguments to the queue
      this.queue.push(arguments);
      ++this.remaining;
      pop();

      return this;
    }

    //
    // finished with this queue
    //
    this.then = function(func) {
      // check that the function is defined
      if (func == undefined || func == null) {
        this.error = "THEN ERR: No function given";
        if (this.finished_cb) return this.finished_cb(this.error, this.results);
        else return this;
      }

      // check that the results array has enough arguments
      if (func.length > this.results.length) {
        this.error = "THEN ERR: More arguments than results";
        if (this.finished_cb) return this.finished_cb(this.error, this.results);
        else return this;
      }

      // where should we start/end in the array slice?
      var arg_start = this.results.length - func.length;
      var arg_end = arg_start + func.length - 1;

      // build separate args array
      var index = 0;
      var arg_array = [];
      for (var i = arg_start; i <= arg_end; i++) {
        arg_array[index++] = this.results[i];
      }

      // add the function to the queue
      this.queue.push([(function(f, args, start, end) {
        var res = f.apply(null, args);
        this.results.splice(start, f.length);
        return res;
      }).bind(this), func, arg_array, arg_start, arg_end]);

      ++this.remaining;
      pop();

      return this;
    }

    //
    // finished with this queue
    //
    this.finished = function(cb) {
      var bare_cb = (function(err, res) { 
        return err ? err : this.results.length; 
      }).bind(this);

      // if no callback defined, wrap a bare one
      this.finished_cb = cb ? cb : bare_cb;

      if (this.remaining == 0)
        return this.finished_cb(this.error, this.results);

      return this;    // safety, shouldn't be chained though....
    }
  }

  return new antsy;
})();