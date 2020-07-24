# README #

### What is this repository for? ###

* This is the front end for www.d2checklist.com, it's written in Angular and Angular Material.

### How do I get set up? ###

#### Register a new app with Bungie #### 

In order to run the server, you will need to create an application using the [Bungie Application Portal](https://www.bungie.net/en/Application). When creating the application, do the following:

* Application Name can be whatever you want
* Website can be left blank
* Application Status can be Private
* OAuth Client type should be `Confidential`
* Redirect URL should be `https://localhost:4200/auth` (for running in Development mode).
* Check all the boxes for scope except "Administrate groups and clans..." (that's not needed, checking it won't hurt though)

#### Setup the Angular app ####

* Install node and npm and the Angular CLI (cli.angular.io)
* Clone this repository
* Setup a keys.ts file to match keys.example.ts (Visit https://www.bungie.net/en/Application and setup a )

* npm install
* run ./serve.bat (Windows) or ./serve.sh (Mac or *nix)
* Visit https://localhost:4200 (ignore the cert error)

### Contribution guidelines ###

* If you want to contribute, let me know (or submit a pull request)
* This application uses FontAwesome Pro's private repo, so running your own development environment requires stubbing those out. This can be a pain. 

#### Notes ####

As of 07/24/2020: 

- Local development can be done on https://localhost:4200 using included pre-gen certs (no web server or hacked domain required)
- Production build and deployments are done via GitHub Actions triggered on pushes to master
- NPM (not Yarn) is the expected package manager
- We're upgraded to Angular 9.1