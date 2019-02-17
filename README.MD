# Polytech booker

## Description

This script will try to book a place for a Polytech event by making request at an interval before the event opening and for a certain amount of time after
It needs you to fill out your credentials to make request in your name, the event you want to book and the time of the event opening.

The program needs to be run BEFORE the event opening and kept alive until it stops itself.

OPTIONAL : The time between request and the time before and after the event opening can be changed

## Installation / Running

Clone repository and install packages
```
git clone https://github.com/Rifhice/polytech-booker.git
cd polytech-booker
npm install
```
Grab the booking url for the event on the official website
 - Inspect the bus button to grab the event ID (usually a number)
 - Open the div with the ID modalXX, where XX is the event ID
 - The url can be found in the modal-footer div (usually with the format https://bde.polytechmontpellier.fr/Event/bookEvent/XX)
![](url_tuto.gif)

Fill out the env variables
```
cp model.env .env
nano .env
```
Start with
```
node index.js
```