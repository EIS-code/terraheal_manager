// / /All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    // require('dotenv').config({path: __dirname + '/../.env'}); // For live for set custom .env path.
    // For local.
    /* Use {debug: true} like require('dotenv').config({debug: true}); for get include errors. */
    require('dotenv').config();

    try {
        localStorage.setItem('ENV_APP_ENV', process.env.APP_ENV);
    } catch(e) {
        console.log(e);
    }

    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);

        if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
});
