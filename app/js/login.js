import { SIGNIN } from './networkconst.js';
import { Post, redirect, SUCCESS_CODE } from './networkconst.js';

$(document).ready(function () {
    clearLocalStorage('managerData');

    $(".login").click(function () {
        let userName = $("#user_name").val(),
            password = $("#password").val();

        if (userName == "") {
            showError(languages.ENTER_EMAIL_ADDRESS);
        } else if (password == "") {
            showError(languages.ENTER_PASSWORD);
        } else {
            let postData = {
                "email": userName,
                "password": password
            }

            Post(SIGNIN, postData, function(res){
                if (res.data.code == SUCCESS_CODE) {
                    localStorage.setItem('managerData', JSON.stringify(res.data.data));

                    redirect("dashboard.html");
                } else {
                    showError(res.data.msg);
                }
            },function(err){
                console.log("AXIOS ERROR: ", err);
            });
        }
    });

    setTimeout(function() {
        $('#user_name').focus();
    }, 500);
});