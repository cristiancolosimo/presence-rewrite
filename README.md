[![Docker Image CI](https://github.com/cristiancolosimo/presence-rewrite/actions/workflows/docker-image-arm.yml/badge.svg)](https://github.com/cristiancolosimo/presence-rewrite/actions/workflows/docker-image-arm.yml)
======


HLCS Presence, rewrited in TS
===============
The presence is a Home automation system for controlling doors electronically and logging accesses.

This is a fork rewrited totaly.
It's javascript free on front-end.
All the front-end is rendered on server side, so you can use it with javascript disabled.
All the logic is rewrited in typescript, so it's more easy to maintain and extend.
It's oriented to security, speed and minimalism.


The stack if formed by:
- [NodeJS](https://nodejs.org/en/) (Runtime)
- [KoaJS](http://koajs.com/) (Web Framework)
- [Prisma](https://www.prisma.io/)  (ORM)
- [Sqlite](https://www.sqlite.org/) (Database)
- [EJS](http://ejs.co/) (Templating Engine)
- [Docker](https://www.docker.com/) (Containerization)


How to use
==========
You can compile it with docker or use the precompiled image on github registry.
The envrioment variables to set are:
- PEPPER="ultra random thing"
- PORT=3000
- ROUNDS=10000
- EXTERNAL_DOOR_TIMEOUT=60 #seconds
- HOMEPAGE_RELOAD_TIME=10 #seconds
- ALLOWED_NETWORK_FOR_INTERNAL_DOOR="192.168.1.0/24" #% is wildcard

It's important to set volumes /sys:/sys for the gpio to work.
The database is located in /app/prisma/database.db , don't bind the entire folder becouse will break the app.
You can see the template of docker-compose.template.yml in the root of the project for a example.
