var should = require('should');

var antsy = require('../');

//
// General Tests
//
describe('General', function() {
  it('Creates new state', function() {
    var antsy1 = antsy();
    antsy1.results = [1,2,3,4,5];

    var antsy2 = antsy();
    antsy2.results = [5,4,3,2,1];

    antsy1.results.should.eql([1,2,3,4,5]);
    antsy2.results.should.eql([5,4,3,2,1]);
  });
});

//
// Now Tests
//
describe('.now()', function() {
  describe('Sanity Checks', function() {
    describe('Basic', function() {
      it('Must take an argument', function() {
        var task = antsy().now();
        should.exist(task);
        task.results.length.should.equal(0);
        task.error.should.equal("NOW ERR: No argument given");
      });

      it('Must have function as first argument', function() {
        var task = antsy().now(1, returnGiven);
        should.exist(task);
        task.results.length.should.equal(0);
        task.error.should.equal("NOW ERR: First argument not a function");
      });
    });

    describe('Limits arguments to function length', function() {
      it('Ignores task, returns self when unchained', function() {
        var task = antsy().now(returnGiven,1,2);
        should.exist(task);
        task.results.length.should.equal(0);
        task.error.should.equal("NOW ERR: Too many arguments for function");
      });
    });
  });

  describe('Basic Functionality', function() {
    it('Completes a now()', function() {
      var task = antsy().now(returnGiven, 5);
      task.results.length.should.equal(1);
      task.results[0].should.equal(5);
    });

    it('Chain now()\'s', function() {
      var task = antsy().now(returnGiven, 1).now(returnGiven, 2);
      task.results.length.should.equal(2);
      task.results[0].should.equal(1);
      task.results[1].should.equal(2);
    });

    it('Operate on multiple arguments', function() {
      var task = antsy().now(addTwo, 1, 2);
      task.results.length.should.equal(1);
      task.results[0].should.equal(3);
    });

    it('Take function with callback', function() {
      var task = antsy();
      task.now(function(a, b, cb) {
        if (a) return cb(b);
      }, true, 10, returnGiven);
      task.results.length.should.equal(1);
      task.results[0].should.equal(10);
    });

    it('Take function with callback chain', function() {
      var task = antsy();
      task.now(function(a, b, cb) {
        if (a) return (function(c, d, cb2) {
          if (c) return cb2(5, d);
        })(a, b, cb);
      }, true, 10, addTwo);
      task.results.length.should.equal(1);
      task.results[0].should.equal(15);
    });
  });
});

//
// Then Tests
//
describe('.then()', function() {
  describe('Sanity Checks', function() {
    it('Raises error on more arguments than results', function() {
      var err = antsy().now(returnGiven, 1).then(addTwo).finished();
      err.should.equal("THEN ERR: More arguments than results");
    });

    it('Raises error on no function', function() {
      var err = antsy().now(returnGiven, 1).then().finished();
      err.should.equal("THEN ERR: No function given");
    });

    it('Returns undefined on function with no return statement', function(done) {
      var task = antsy();
      task.now(returnGiven, 1)
          .now(returnGiven, 2)
          .then(function(a, b){
            // do something that doesn't return
          })
          .finished(function(err, results){
            should.not.exist(err);
            results.length.should.equal(1);
            results.should.eql([undefined]);
            done();
          });
    });
  });

  describe('Functionality', function() {
    it('Slices results array', function(done) {
      var task = antsy();
      task.now(returnGiven, 1)
          .now(returnGiven, 2)
          .now(returnGiven, 3)
          .then(addTwo)
          .finished(function(err, results) {
            should.not.exist(err);
            results.length.should.equal(2);
            results[0].should.equal(1);
            results[1].should.equal(5);
            done();
          });
    });

    it('Will empty, append results array', function(done) {
      var task = antsy();
      task.now(returnGiven, 1)
          .now(returnGiven, 3)
          .then(addTwo)
          .finished(function(err, results) {
            should.not.exist(err);
            results.length.should.equal(1);
            results[0].should.equal(4);
            done();
          });
    });

    it('Will slice results array at end', function(done) {
      var task = antsy();
      task.now(returnGiven, 1)
          .now(returnGiven, 2)
          .now(returnGiven, 3)
          .now(returnGiven, 4)
          .now(returnGiven, 5)
          .then(addTwo)
          .finished(function(err, results) {
            should.not.exist(err);
            results.length.should.equal(4);
            results.should.eql([1,2,3,9]);
            done();
          });
    });

    it('Will slice results array at beginning -- mixed with .now()\'s', function(done) {
      var task = antsy();
      task.now(returnGiven, 1)
          .now(returnGiven, 2)
          .then(addTwo)
          .now(returnGiven, 3)
          .now(returnGiven, 4)
          .now(returnGiven, 5)
          .finished(function(err, results) {
            should.not.exist(err);
            results.length.should.equal(4);
            results.should.eql([3,3,4,5]);
            done();
          });
    });

    it('.now().then().now().then() Pipelines', function(done) {
      var task = antsy()
      task.now(returnGiven, 1)
          .now(returnGiven, 2)
          .then(addTwo)
          .now(returnGiven, 3)
          .now(returnGiven, 4)
          .then(addTwo)
          .now(returnGiven, 5)
          .finished(function(err, results) {
            should.not.exist(err);
            results.length.should.equal(3);
            results.should.eql([3,7,5]);
            done();
          });
    });
  });
});


//
// Finished Tests
//
describe('.finished()', function() {
  describe('Sanity Checks', function() {
    describe('Allows empty arguments', function() {
      it('Returns length (no errors)', function() {
        antsy().now(returnGiven, 1)
             .now(returnGiven, 2)
             .now(returnGiven, 3)
             .finished()
             .should.equal(3);
      });

      it('Returns error (if errors)', function() {
        antsy().now()           // error
             .now(returnGiven, 1)
             .now(returnGiven, 2)
             .finished()
             .should.equal("NOW ERR: No argument given");
      });
    });
  });

  describe('Basic Functionality', function() {
    it('Passed error on error -- execution stops on error', function(done) {
      var task = antsy()
      task.now(returnGiven, 1)
          .now()
          .now(returnGiven, 3)
          .finished(function(err, results) {
            err.should.equal("NOW ERR: No argument given");
            results.length.should.equal(1);
            results.should.eql([1]);
            done();
          });
    });

    it('Passed results on success', function(done) {
      var task = antsy()
      task.now(returnGiven, 1)
          .now(returnGiven, 2)
          .now(returnGiven, 3)
          .finished(function(err, results) {
            should.not.exist(err);
            results.length.should.equal(3);
            results.should.eql([1,2,3]);
            done();
          });
    });
  });
});

function returnGiven(given) { return given };
function addTwo(a, b) { return a + b; };