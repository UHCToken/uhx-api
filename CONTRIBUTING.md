# How to contribute
First of all, thank you for taking the time to contribute to this project. We've tried to make a stable project and try to fix bugs and add new features continuously. You can help us do more.

## Getting started

### Familiarize yourself with the architecture

The architecture of this project is documented in detail here. Note that all UHC calls are wrapped to ensure that proper error messages and authentication occurs on the UHC server, so it is recommended that you follow the pattern. Here are a few pointers:

1. Any service that interacts with clients should go in the /controllers folder and should be registered via the routes property.
2. Don't call the database directly from any code in the /controllers folder, you should only interact with the database using the code in the repositories module.
3. Try not to place business logic in the /controllers folder, the controllers are for controlling. Any business logic should be implemented separately.
4. Try to use the exception.Exception() class to report errors. You can simply throw this exception from your controller or function and it will be caught and handled appropriately.
5. Try to wrap what you return from the /controllers folder in a model class rather than exposing the database tables directly. This will allow
you to filter incoming data to only those properties which are known to be supported.

### Check out the roadmap

We have some functionalities in mind and we have issued them and there is a *milestone* label available on the issue. If there is a bug or a feature that is not listed in the **issues** page or there is no one assigned to the issue, feel free to fix/add it! Although it's better to discuss it in the issue or create a new issue for it so there is no confilcting code, and we maintain a cohesive architecture.

### Writing some code!

Contributing to a project on Github is pretty straight forward. If this is you're first time, these are the steps you should take.

- Fork this repo.

And that's it! Read the code available and change the part you don't like! You're change should not break the existing code and should pass the tests.

If you're adding a new functionality, start from the branch **develop**. It would be a better practice to create a new branch and work in there and then submit a PR from your branch into **develop**.

When you're done, submit a pull request and for one of the maintainers to check it out. We would let you know if there is any problem or any changes that should be considered.

### Tests

In order for your contribution to be accepted, we prefer that you provide either unit tests, test scripts, or a document describing how the expected functionality works. This ensures that the person merging your pull request has sufficient information to diagnose whether your code should be merged. 

We will also run our regression tests to ensure that there are no breaking changes to the API that you've made.

### Documentation

Every chunk of code that may be hard to understand has some comments above it. If you write some new code or change some part of the existing code in a way that it would not be functional without changing it's usages, it needs to be documented.

An example of how you might do this while attributing yourself is:

```
// Justin Fyfe - Fixed the order that these functions are called because they were causing a key violation
...
// End - Justin Fyfe
```

It is also imperative that you use proper JSDoc comments on all your methods. If you change an existing method signature, please update the method's JSDoc. This ensures we understand what the method and parameters are trying to do. For example, if we see code like this:

```
/**
 * @method
 * @summary Some function
 */
 async someFunc(parm1, parm2, parm3) {

 }
```

We probably won't accept your pull request, instead try to document in some form what the parameters do:

```
/**
 * @method
 * @summary Some function
 * @param {string} thing The name of the thing you want done
 * @param {number} times The number of times you want the thing done
 * @param {User} user The user you want the thing done to
 */
 async someFunc(thing, times, user) {

 }
```
