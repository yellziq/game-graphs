import { Logic } from './Logic.js'

const startButton = document.getElementById('startButton')
const welcomeScreen = document.getElementById('welcomeScreen')

startButton.addEventListener('click', () => {
    welcomeScreen.classList.add('hidden')
    setTimeout(() => {
        welcomeScreen.style.display = 'none'
        const logic = new Logic()
    }, 300)
})
