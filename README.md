# Vianuvote

A simple portable electronic voting system I made for my school's student council (actively used as of may 2023)

This repo is mostly for internal deployment and was not made as a general solution (tho inspiration can be taken). If you're not from within the council this repo is probably useless to you

## Installation

`git clone https://github.com/KoNickss/csevote`

`cd csevote`

`npm i`

`node .`

Login details are securely stored as sha256sums in repo/credentials


## Docker

Build docker image / Pull docker image from hub

`docker build -t vianuvote .`  /  `docker pull konicks/vianuvote`

Run without db volume

`docker run -d -p 811:80 vianuvote`

Run with db volume

`docker run -d -p 811:80 -v foo-volume:/app/repo vianuvote`

ACESTA ESTE UN DEMO SUMAR


LIBRARII EXTERNE:
- NodeJS
- ExpressJS
- TailwindCSS
