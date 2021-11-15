// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer } = require ('electron');

const {
    START_NOTIFICATION_SERVICE,
    NOTIFICATION_SERVICE_STARTED,
    NOTIFICATION_SERVICE_ERROR,
    NOTIFICATION_RECEIVED,
    TOKEN_UPDATED,
} = require ('electron-push-receiver/src/constants');

// Listen for service successfully started
ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
    let managerData = getLocalManagerStorage();

    $.ajax({
        url: localStorage.getItem('BASEURL_MANAGER') + "/fcm/token/save",
        type: "POST",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({ manager_id: managerData.id, shop_id: managerData.shop_id, fcm_token: token }),
        success: function (result) {
            // when call is sucessfull
        },
        error: function (err) {
            // check the err for error details
        }
    });
});

// Handle notification errors
ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => {
    console.log('notification error', error);
});

// Send FCM token to backend
ipcRenderer.on(TOKEN_UPDATED, (_, token) => {
    // console.log('token updated', token);
});

// Display notification
ipcRenderer.on(NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
    // check to see if payload contains a body string, if it doesn't consider it a silent push
    if (serverNotificationPayload.notification.body) {
        // payload has a body, so show it to the user
        let myNotification = new Notification(serverNotificationPayload.notification.title, {
            body: serverNotificationPayload.notification.body
        });
    
        myNotification.onclick = () => {
            ipcRenderer.send('showWindow');

            $('.modal').modal('hide');

            $('.modal-backdrop').remove();

            setTimeout(function() {
                $("#notify-model").modal("show");

                $(".notification").find(".counts").html(0);
            }, 500);
        }

        appendNotification(serverNotificationPayload);
    } else {
        // payload has no body, so consider it silent (and just consider the data portion)
        console.log('do something with the key/value pairs in the data', serverNotificationPayload.data);
    }
});

// Start service
// <-- replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
const senderId = localStorage.FCM_SENDER_ID;
if (localStorage.getItem("managerData") != "" && localStorage.getItem("managerData") != null && Object.keys(localStorage.getItem("managerData")).length) {
    console.log('starting service and registering a client');
    ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId);
}

function appendNotification(payloads) {
    let li = "";

    li += '<li>';
        li += '<figure><img src="images/placeholder.png" alt="notify"></figure>';

        li += '<p>' + payloads.notification.title + '<p>';

        li += '<span class="note-date">';
            li += getDate(payloads.data.date);
        li += '</span>';
    li += '</li>';

    let count = $(".notification").find(".counts").html();

    $(".notification").find(".counts").html(parseInt(count) + 1);

    $(document).find("#notification-list").append(li);
}
