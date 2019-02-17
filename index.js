const Axios = require('axios')
const querystring = require('querystring');
const Parser = require('node-html-parser')
const schedule = require('node-schedule');
const moment = require('moment')
require('dotenv').config()

const eventOpeningTime = process.env.EVENT_OPENING_TIME
const email = process.env.EMAIL
const password = process.env.PASSWORD
const eventUrl = process.env.EVENT_URL
const minutesBeforeAndAfter = process.env.MINUTES_BEFORE_AND_AFTER || 1 //Minutes
const intervalBetweenRequests = process.env.INTERVAL_BETWEEN_REQUEST || 500 //Milliseconds

if (!email || !password || !eventUrl || !eventOpeningTime) {
    console.log("Fill out the variables")
    process.exit()
}

const momentOpeningTime = moment(eventOpeningTime)
const startCronTime = moment(momentOpeningTime).subtract(minutesBeforeAndAfter, 'minutes')
const endCronTime = moment(momentOpeningTime).add(minutesBeforeAndAfter, 'minutes')

const cronTime = `${startCronTime.minutes()} ${startCronTime.hours()} ${startCronTime.date()} ${startCronTime.month() + 1} *`

const book = async (email, password, intervalBetweenRequests, eventUrl, endCronTime) => {
    console.log("Trying to login...")
    const login = await Axios.post("https://bde.polytechmontpellier.fr/Home/verifLogin",
        querystring.stringify({
            email,
            password
        })
    )
    if (login.headers['set-cookie']) {
        console.log("Login success")
        const cookie = login.headers['set-cookie'].map(part => part.split(';')[0]).join('; ')
        const interval = setInterval(async (Cookie, eventUrl, endCronTime) => {
            if (!moment().isAfter(endCronTime)) {
                const data = await Axios.request({
                    url: eventUrl,
                    method: "get",
                    headers: {
                        Cookie
                    }
                })
                const root = Parser.parse(data.data);
                //console.log(root.querySelector('.collection-item'));
                console.log(data.status)
            }
            else {
                clearInterval(interval)
                console.log("Place should be booked, exiting")
                process.exit()
            }
        }, intervalBetweenRequests, cookie, eventUrl, endCronTime)
    }
    else {
        console.log("Login failed, check the password, quitting")
        process.exit()
    }
}
console.log("Scheduling...")
schedule.scheduleJob(cronTime, () => book(email, password, intervalBetweenRequests, eventUrl, endCronTime));
console.log("Awaiting the appropriate time")
