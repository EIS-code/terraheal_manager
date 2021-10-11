import { Post, Get, SUCCESS_CODE } from './networkconst.js';
import { THERAPIST_ADD_NEW, THERAPISTS } from './networkconst.js';

const NOT_ACTIVE_APP = '0';
const ACTIVE_APP = '1';

var filterToday   = "0",
    filterAll     = "1",
    currentFilter = filterToday;

window.addEventListener("load", function() {
    getTherapists(filterToday);

    $(document).find("ul#th-tabs").find('li').find('a').on("click", function() {
        $('#text-search').val("");

        let tabName = $(this).attr('href'),
            filter = filterToday;

            currentFilter = filter;

        if (tabName.toLowerCase() == '#all-tab') {
            filter = filterAll;

            currentFilter = filter;
        }

        getTherapists(filter);
    });

    $('#therapist-add-new').on('show.bs.modal', function (e) {
        $('#therp-modal').modal('hide');
    });

    $('#add-therapist').on('click', addNewTherapist);

    $('#btn-search').on('click', function() {
        let searchValue = $('#text-search').val();

        getTherapists(currentFilter, searchValue);
    });

    let successMsg = getQueryStringValue('suc-msg');
    if (!empty(successMsg)) {
        showSuccess(successMsg);
    }
});

function getTherapists(filter, searchValue)
{
    let postData = {
        "filter": filter,
        "search_val": searchValue
    };

    Post(THERAPISTS, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            let html = '';

            if (!empty(res.data.data) && Object.keys(res.data.data).length > 0) {
                $.each(res.data.data, function(i, item) {
                    html += "<li class='therapy-col' onclick=\"location.href='therapist-profile.html?id=" + item.therapist_id + "';\">";
                        html += "<div class='therapy-img'>";
                            html += "<img src='" + item.therapist_photo + "' alt='' />";
                        html += "</div>";

                        let inc             = 1,
                            ratingRemainder = (item.average > 0) ? ((item.average - parseInt(item.average)) * 100).toFixed(2) : 0,
                            ratingHtml      = $('.static-ratings').clone();

                        for (;inc <= parseInt(item.average);) {
                            ratingHtml.find('#client-rating-star-' + inc).addClass('active');
                            inc++;
                        }

                        if (ratingRemainder >= 50) {
                            ratingHtml.find('#client-rating-star-' + inc).removeClass('fa-star').addClass('fa-star-half').addClass('active');
                        }

                        html += "<div class='ratings'>";
                            html += ratingHtml.html();
                        html += "</div>";

                        html += "<div class='therapy-name'>" + item.therapist_name;
                        html += "</div>";

                        html += "<div class='country'>" + (!empty(item.city) ? item.city.name : "") + (!empty(item.country) ? ", " + item.country.name : "");
                        html += "</div>";

                        html += "<div class='center-bottom'>";
                            html += "<a href='#'><i class='fas fa-eye'></i></a> <a href='#'><i class='far fa-envelope'></i></a>";
                        html += "</div>";
                    html += "</li>";
                });
            }

            $(document).find('#list-therapists').empty().html(html);
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function addNewTherapist() {
    let form = $('#new-therapist').serializeArray(),
        name,
        surname,
        email,
        password,
        confirmPassword,
        activeApp = NOT_ACTIVE_APP;

    $.each(form, function(index, formData) {
        if (formData.name == 'therapist-first-name') {
            name = formData.value;
        } else if (formData.name == 'therapist-surname') {
            surname = formData.value;
        } else if (formData.name == 'therapist-email') {
            email = formData.value;
        } else if (formData.name == 'therapist-password') {
            password = formData.value;
        } else if (formData.name == 'therapist-confirm-password') {
            confirmPassword = formData.value;
        } else if (formData.name == 'therapist-active-app' && formData.value == 'on') {
            activeApp = ACTIVE_APP;
        }
    });

    if (empty(password)) {
        showError("Password should not be blank.")
    } else if (password != confirmPassword) {
        showError("Password and Confirm Password must be same.")
    }

    return Post(THERAPIST_ADD_NEW, {"name" : name, "surname" : surname, "email" : email, "password" : password, "active_app" : activeApp}, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            $('#therapist-add-new').modal('hide');

            $('#new-therapist')[0].reset();

            showSuccess(res.data.msg);

            getTherapists(currentFilter);
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}
