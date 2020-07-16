# README #

### What is this repository for? ###

* This is the front end for www.d2checklist.com, it's written in Angular and Angular Material.

### How do I get set up? ###

* Install node and npm and the Angular CLI (cli.angular.io)
* Clone this repository
* Get yourself an API key and setup a keys.ts file to match keys.example.ts
* Setup a proper fake test domain (I like to use www.testd2checklist.com:8080 via NGINX and an entry in my hosts file)
* npm install
* run ./serve.bat (Windows) or ./serve.sh (Mac or *nix)

### Contribution guidelines ###

* If you want to contribute, let me know (or submit a pull request)
* This application uses FontAwesome Pro's private repo, so running your own development environment requires stubbing those out. This can be a pain. 

#### Notes

As of 04/06/2020: 

- Production build and deployments are done via GitHub Actions triggered on pushes to master
- NPM (not Yarn) is the expected package manager
- We're upgraded to Angular 9.1