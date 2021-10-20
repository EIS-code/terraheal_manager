import { Post, Get, SUCCESS_CODE } from './networkconst.js';
import { THERAPISTS_EXISTING, THERAPIST_ADD_NEW_EXISTING } from './networkconst.js';

var managerData = getLocalManagerStorage();

$(document).ready(function () {
    getTherapists("");

    $('#btn-search').on('click', function() {
        let searchValue = $('#text-search').val();

        getTherapists(searchValue);
    });
});

function getTherapists(searchValue)
{    let postData = {
        "search_val": searchValue,
        "is_pass_manager_id" : false,
        "is_pass_shop_id" : false
    };

    Post(THERAPISTS_EXISTING, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            let html = '';

            if (!empty(res.data.data) && Object.keys(res.data.data).length > 0) {
                $.each(res.data.data, function(i, item) {
                    let alreadyAdded = false;

                    $.each(item.shops, function(key, shop) {
                        if (shop.shop_id == managerData.shop_id) {
                            alreadyAdded = true;
                        }
                    });

                    html += "<li class='therapy-col' data-id='" + item.id + "' data-is-added='" + alreadyAdded + "'>";
                        html += "<div class='therapy-img'>";
                            html += "<img src='" + item.profile_photo + "' alt='' />";
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

                        html += "<div class='therapy-name'>" + item.name + (!empty(item.surname) ? " " + item.surname : "");
                        html += "</div>";

                        html += "<div class='country'>" + (!empty(item.city) ? item.city.name : "") + (!empty(item.country) ? ", " + item.country.name : "");
                        html += "</div>";

                        html += "<div class='center-bottom'>";
                            html += "<a href='#'><i class='fas fa-eye'></i></a> <a href='#'><i class='far fa-envelope'></i></a>";
                        html += "</div>";
                    html += "</li>";
                });
            }

            $(document).find('ul#list-therapists').empty().html(html);

            $('ul#list-therapists').find('.therapy-col').unbind().on("click", function() {
                let self        = $(this),
                    isAdded     = self.data('is-added'),
                    therapistId = self.data('id');

                if (isAdded) {
                    showError("This therapist already added.");
                } else {
                    confirm("Are you sure want to add this therapist ?", addNewTherapist, [therapistId], $(this));
                }
            });
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function addNewTherapist(therapistId) {
    return Post(THERAPIST_ADD_NEW_EXISTING, {"therapist_id" : therapistId, "is_pass_manager_id" : false}, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            window.location.href = 'therapists.html?suc-msg=' + res.data.msg;
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}
