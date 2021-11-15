// / /All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    // require('dotenv').config({path: __dirname + '/../.env'}); // For live for set custom .env path.
    // For local.
    /* Use {debug: true} like require('dotenv').config({debug: true}); for get include errors. */
    require('dotenv').config();

    require('./renderer.js');

    try {
        let envPrefix = 'ENV.';

        localStorage.clear();

        $.each(process.env, function(key, value) {
            if (key.indexOf(envPrefix) != -1) {
                localStorage.setItem(key.split(envPrefix)[1], value);
            }
        });
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
