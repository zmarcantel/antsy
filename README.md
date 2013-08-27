antsy
=====

Documentation coming.

## Now

Provides the basic 'do' functionality without caring about what happened before or after the call is made.

#### Usage

````js
antsy().now(function, arg1, arg2, arg3);
````

* First argument must be a function
* Subsequent arguments are the arguments to the target frunction
	* Must not give target function more arguments than it takes

````js
var task = antsy().now(function(a){
	return a;
}, 10);
````

The above code sample would return with `task` equalling:

````js
task = {
	results: [10],
	error: null
}
````

The returned `antsy` object contains more properties, but these are the basic and most used of them.


## Then

This function acts like `.now()`, but takes its arguments from the results of previous `antsy` functions (`.now()` and `.then()`).

#### Usage

* Only takes one argument -- function
	* Given function must not take more arguments than in result array

````js
antsy().now(returnGiven, 1)
			 .now(returnGiven, 2)
			 .then(addTwoNumbers)
			 .now(returnGiven, 3)
			 .now(returnGiven, 4)
			 .then(addTwoNumbers)
			 .then(addTwoNumbers)
			 .results == [10];
````

The above example should be self explanatory and the equality check on the last line would return true.


## Finished

This function indicates we are done adding tasks. It takes a function as an argument and is passed the error if it exists as well as the results array.

If there is no function given to `.finished()` it will return the first error that occured, otherwise it will return the results array.

#### Usage

````js
antsy().now(returnGiven, 1)
			 .now(returnGiven, 2)
			 .then(addTwoNumbers)
			 .now(returnGiven, 3)
			 .now(returnGiven, 4)
			 .then(addTwoNumbers)
			 .then(addTwoNumbers)
			 .finished(function(err, results) {
			 		if (err == null && results == [10])
			 			console.log('success');
			 		else if (err != null) {
			 			console.log(err);
			 		} else {
			 			console.log('no idea...');
			 		}
			 });
````