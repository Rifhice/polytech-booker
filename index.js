const Axios = require('axios')
const querystring = require('querystring');
const Parser = require('node-html-parser')
const schedule = require('node-schedule');
const moment = require('moment')
require('dotenv').config()
const credentials = require("./credentials.json")

const eventOpeningTime = process.env.EVENT_OPENING_TIME
const eventUrl = process.env.EVENT_URL
const minutesBeforeAndAfter = process.env.MINUTES_BEFORE_AND_AFTER || 1 //Minutes
const intervalBetweenRequests = process.env.INTERVAL_BETWEEN_REQUEST || 500 //Milliseconds

if (!eventUrl || !eventOpeningTime) {
    console.log("Fill out the variables")
    process.exit()
}

const momentOpeningTime = moment(eventOpeningTime)
const startCronTime = moment(momentOpeningTime).subtract(minutesBeforeAndAfter, 'minutes')
const endCronTime = moment(momentOpeningTime).add(minutesBeforeAndAfter, 'minutes')

const cronTime = `${startCronTime.minutes()} ${startCronTime.hours()} ${startCronTime.date()} ${startCronTime.month() + 1} *`

const buildBusURL = (resa, event, bus) => `https://bde.polytechmontpellier.fr/Event/busEdit/${resa}/0/${event}/${bus}`

const book = async (email, password, bus, intervalBetweenRequests, eventUrl, endCronTime) => {
    console.log("Trying to login...")
    const login = await Axios.post("https://bde.polytechmontpellier.fr/Home/verifLogin",
        querystring.stringify({
            email,
            password
        })
    )
    if (!login.headers['set-cookie']) return console.log("Login failed, check the password for", email)
    console.log("Login success", email)
    const cookie = login.headers['set-cookie'].map(part => part.split(';')[0]).join('; ')
    const interval = setInterval(async (Cookie, eventUrl, endCronTime) => {
        if (moment().isAfter(endCronTime)) return console.log("Place should be booked, exiting") || clearInterval(interval)
        const data = await Axios.request({
            url: eventUrl,
            method: "get",
            headers: {
                Cookie
            }
        })
        if (!data.data) { //Place booked!
            const rawResaUrl = data.headers.refresh
            const parsedResaUrl = rawResaUrl.split("=").pop()
            const busReservatioURL = buildBusURL(parsedResaUrl.split("/").pop(), eventUrl.split("/").pop(), bus)
            console.log(busReservatioURL)
            const busReservationResult = await Axios.request({
                url: busReservatioURL,
                method: "get",
                headers: {
                    Cookie
                }
            })
            console.log(busReservationResult)
            console.log(busReservationResult.data)
            return
        }
        if (data.data.includes("Tu as déjà réservé une place !")) {
            clearInterval(interval)
            console.log("Place should be booked for", email)
            return
        }
        console.log(data.data, email)
    }, intervalBetweenRequests, cookie, eventUrl, endCronTime)
}
console.log("Scheduling...")
schedule.scheduleJob(cronTime, () =>
    credentials.map(credential => book(credential.email, credential.password, credential.bus || 1, intervalBetweenRequests, eventUrl, endCronTime))
);
console.log("Awaiting the appropriate time")