const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messages = document.querySelector('#messages')
const $location = document.querySelector('#location')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Hieght of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

    console.log(newMessageMargin)
}

socket.on('locationMessage', (locationMessage) => {
    //console.log(locationMessage)
    const html = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        location: locationMessage.url,
        createdAt: moment(locationButton.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

const input = document.querySelector('#input')
const submitButton = document.querySelector('#send')
const locationButton = document.querySelector('#send-location')

submitButton.addEventListener('click', (e) => {
    const message = input.value
    e.preventDefault()
    submitButton.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', message, (error) => {
        submitButton.removeAttribute('disabled')
        input.value = ''
        input.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered')
    })
})

document.querySelector('#send-location').addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }

        socket.emit('sendLocation', coords, () => {
            console.log('Location shared!')
        })
        locationButton.removeAttribute('disabled')
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})