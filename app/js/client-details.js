import { Post, Get, PostDocument, SUCCESS_CODE, ERROR_CODE, EXCEPTION_CODE } from './networkconst.js';
import { GET_CLIENT_DETAILS, GET_CLIENT_FUTURE_BOOKINGS, GET_CLIENT_PAST_BOOKINGS, GET_CLIENT_CANCELLED_BOOKINGS, CONFIRM_BOOKING, GET_ROOMS, ASSIGN_ROOMS, PRINT_BOOKING_DETAILS, updateQuestionnairs, DECLINE_CLIENT_DOCUMENT, ACCEPT_CLIENT_DOCUMENT, UPLOAD_CLIENT_DOCUMENT } from './networkconst.js';

const IN_MASSAGE_CENTER = '1';
const HOME_HOTEL_VISITS = '2';

const SERVICE_STATUS_DONE     = '2';
const SERVICE_STATUS_STARTED  = '1';
const SERVICE_STATUS_NOT_DONE = '0';

var intervalArray = {},
    currentType = IN_MASSAGE_CENTER,
    userId = 0;

window.addEventListener("load", function() {
    userId = getQueryStringValue('id');

    getRooms();

    getClientDetails(userId);

    // Default : In massage center.
    getFutureBookings(userId);

    $('ul.custom-nav').find('li').on("click", handleBookingTabs);

    $('a.book-now').attr('href', 'booking-now.html?href=client-details.html?id=' + userId);
});

function handleBookingTabs() {
    let self         = $(this),
        currentClick = self.find('a'),
        bookingType  = $('ul.booking-type').find('li').find('a.active'),
        currentUpc   = $('ul.booking-upc').find('li').find('a.active');

    if (currentClick.attr('href') == '#center' || currentClick.attr('href') == '#home') {
        bookingType = currentClick;
    } else {
        currentUpc = currentClick;
    }

    if (bookingType.attr('href') == '#center') {
        currentType = IN_MASSAGE_CENTER;
    } else if (bookingType.attr('href') == '#home') {
        currentType = HOME_HOTEL_VISITS;
    }

    if (currentUpc.attr('href') == '#upcoming') {
        getFutureBookings(userId);
    } else if (currentUpc.attr('href') == '#past') {
        getPastBookings(userId);
    } else if (currentUpc.attr('href') == '#cancelled') {
        getCancelledBookings(userId);
    }
}

function getClientDetails(userId) {
    Post(GET_CLIENT_DETAILS, {"user_id" : userId}, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            let client = data.data.client,
                massagePreferences = data.data.massage_preferences,
                questionnaries = data.data.questionnaries;

            $('#client-name').html(client.name + " " + client.surname);
            $('#client-age').html(client.age);
            $('#client-gender').html(client.gender.toUpperCase());

            if (client.is_verified) {
                $('#client-active').removeClass('disp-none');
            } else {
                $('#client-inactive').removeClass('disp-none');
            }

            $('#client-registered-date').html(getDate(client.registeredAt));
            $('#client-last-visited-date').html(getDate(client.lastVisited));

            let i = 1,
                ratingRemainder = (client.avg_rating > 0) ? ((client.avg_rating - parseInt(client.avg_rating)) * 100).toFixed(2) : 0;

            for (;i <= parseInt(client.avg_rating);) {
                $('#client-rating-star-' + i).addClass('active');
                i++;
            }

            if (ratingRemainder >= 50) {
                $('#client-rating-star-' + i).removeClass('fa-star').addClass('fa-star-half').addClass('active');
            }

            $('#total-appointments').html(client.totalAppointments);
            $('#no-show').html(client.noShow);
            $('#total-recipients').html(client.recipient);
            $('#total-addresses').html(client.addresses);
            $('#total-therapists').html(client.therapists);

            $('#client-id').html(client.id);
            $('.tel-number').html(client.tel_number_code + ' ' + client.tel_number);
            $('.client-email').html(client.email);
            $('#client-dob').html(getDate(client.dob));
            $('#client-nif').html(client.nif);
            if (!empty(client.city)) {
                $('#client-city').html(client.city.name);
            }
            if (!empty(client.country)) {
                $('#client-country').html(client.country.name);
            }
            $('#emergency-tel-number').html(client.emergency_tel_number);

            if (client.is_mobile_verified == '1') {
                $('.fa-tel-number').removeClass('fa-times-circle').addClass('fa-check-circle');
            }

            if (client.is_email_verified == '1') {
                $('.fa-email').removeClass('fa-times-circle').addClass('fa-check-circle');
            }

            if (!empty(client.id_passport_front)) {
                $('#img-passport-front').attr('src', client.id_passport_front);
            }

            if (!empty(client.id_passport_back)) {
                $('#img-passport-back').attr('src', client.id_passport_back);
            }

            $('.verificatn-bx').find('#btn-accepted, #btn-decline, #btn-accept, #btn-add-new-document, #btn-declined').fadeOut(200);
            if (client.is_document_verified == '1') {
                $('.verificatn-bx').find('#btn-accepted').fadeIn(200, function() {
                    $(this).attr('style', 'display: inline-block !important;');
                });
            } else if (client.is_document_verified == '2') {
                $('.verificatn-bx').find('#btn-declined').fadeIn(200, function() {
                    $(this).attr('style', 'display: inline-block !important; pointer-events: none;');
                });

                $('.verificatn-bx').find('#btn-add-new-document').fadeIn(200, function() {
                    $(this).attr('style', 'display: inline-block !important;');
                });
            } else if (!empty(client.id_passport_front) || !empty(client.id_passport_back)) {
                $('.verificatn-bx').find('#btn-decline').fadeIn(200, function() {
                    $(this).attr('style', 'display: inline-block !important;');
                });

                $('.verificatn-bx').find('#btn-accept').fadeIn(200, function() {
                    $(this).attr('style', 'display: inline-block !important;');
                });
            } else {
                $('.verificatn-bx').find('#btn-add-new-document').fadeIn(200, function() {
                    $(this).attr('style', 'display: inline-block !important;');
                });
            }

            $('.verificatn-bx').find('#btn-decline').unbind().on('click', function() {
                confirm("Are you sure want to decline this document ?", declineDocument, [userId], $(this));
            });

            $('.verificatn-bx').find('#btn-accept').unbind().on('click', function() {
                confirm("Are you sure want to accept this document ?", acceptDocument, [userId], $(this));
            });

            $('#submit-passport-documents').unbind().on('click', function() {
                uploadDocument(userId);
            });

            let mpLi      = "",
                mpAnswers = massagePreferences.answers,
                mpElement = $('#massage-preferences');
            $.each(massagePreferences.questions, function(key, question) {
                mpLi += "<li>";
                    mpLi += "<label>" + question.name;
                        mpLi += "<div class='value-ap'>";
                            mpLi += "<select>";
                                mpLi += "<option value=''>-";
                                mpLi += "</option>";

                                $.each(question.preference_options, function(key1, option) {
                                    let selected = "";
                                    $.each(mpAnswers, function(key2, answer) {
                                        if (option.id == answer.mp_option_id) {
                                            selected = "selected='true'";
                                            option.name = !empty(answer.answer) ? answer.answer : option.name;
                                        }
                                    });

                                    mpLi += "<option value='" + option.id + "' " + selected + ">" + option.name;
                                    mpLi += "</option>";
                                });
                            mpLi += "</select>";
                        mpLi += "</div>";
                    mpLi += "</label>";
                mpLi += "</li>";
            });
            mpElement.empty().html(mpLi);

            let qLi      = "",
                qElement = $('#questionnaires');
            $.each(questionnaries, function(key, question) {
                let questionnarieAns = question.questionnaire_answer;

                qLi += "<li>";
                    qLi += "<label>" + question.title;
                    qLi += "</label>";

                    qLi += "<input type='" + question.type + "' placeholder='" + question.placeholder + "' min='" + question.min + "' max='" + question.max + "' value='" + ((!empty(questionnarieAns) && Object.values(questionnarieAns).length > 0) ? questionnarieAns.value : "") + "' data-id='" + ((!empty(questionnarieAns) && Object.values(questionnarieAns).length > 0) ? questionnarieAns.id : "") + "' data-questionnaire-id='" + question.id + "' data-old-value='" + ((!empty(questionnarieAns) && Object.values(questionnarieAns).length > 0) ? questionnarieAns.value : "") + "' />";
                qLi += "</li>";
                qLi += "";
            });
            qElement.empty().html(qLi);

            let timeoutId;
            qElement.find('input').unbind().on('keyup', function() {
                let self            = $(this),
                    oldValue        = self.data('old-value'),
                    answerId        = self.data('id'),
                    newValue        = self.val(),
                    questionnaireId = self.data('questionnaire-id'),
                    postData        = {};

                if (newValue != oldValue) {
                    oldValue = newValue;

                    clearTimeout(timeoutId);

                    timeoutId = setTimeout(function() {
                        postData["answer_id"]        = answerId;
                        postData["value"]            = newValue;
                        postData["questionnaire_id"] = questionnaireId;
                        postData["user_id"]          = userId;

                        updateQuestionnairs(postData);
                    }, 1000);
                }
            });
        }
    }, function (error) {
        showError("AXIOS ERROR: " + error);
    });
}

function buildBookingHtml(myArray, isFuture) {
    let type = currentType;

    $("#client-appointments").empty();
    $('#details-modal-static').empty();

    $.each( myArray, function( i, item ) {
        var therapistName="";
        var therapistRoom="";

        let specialNotes = (item.notes != '' && item.notes != null) ? item.notes : false;

        if (item.therapistName == null || item.therapistName == '') {
            therapistName="<td class=\"text-center\"><span class=\"th-sp\"><span class=\"ed-icon\"><a href=\"therapist-all.html\"><img src=\"images/girl.png\" alt=\"\"/></a></span></span></td>" 
        } else {
            therapistName="<td class=\"text-center\"><span class=\"th-sp\">"+item.therapistName+"<span class=\"ed-icon\"></span></span></td>" 
        }

        let serviceName = item.service_name;

        var newListItem = "<tr>"+
            "<td>"+getDate(item.massage_date)+"</td>"+
            "<td><span class=\"user-icon\"><img src=\"images/double-user.png\" /></span>"+item.client_name+"</td>"+
            "<td>" + serviceName + " ("+item.massage_duration+")</td>"+
            "<td>"+getTime(item.massage_start_time)+" -"+getTime(item.massage_end_time)+"</td>"+
            therapistName+
            "<td class=\"text-center\"><span>" + (item.roomName ? item.roomName : (isFuture ? '<span class="as-room"><a href="#" class="open-model" data-target="#assign-rooms-modal" data-id="' + item.booking_massage_id + '" data-type="' + type + '">00</a></span>' : '00')) + "</span></td>"+
            "<td class=\"text-center\">"+item.book_platform+"</td>"+
            "<td><span class=\"pay-sp\">€ 661</span></td>"+
            "<td class=\"text-center orange\"><a href=\"#\" data-toggle=\"modal\" data-target=\"#notes-modal-" + item.booking_massage_id + "\"><i class=\"fas fa-sticky-note " + (specialNotes ? 'active' : '') + "\"></i></a></td>"+
            ((!isFuture) ? "<td class=\"text-center\">-</td>" : "<td class=\"text-center\"><i class=\"fas fa-edit\"></i></td>")+
            ((!isFuture) ? "<td class=\"text-center\">-</td>" : "<td class=\"text-center\"><a href=\"#\" class=\"open-model\" data-target=\"#delete-modal\" data-id=\"" + item.booking_id + "\" data-type=\"" + type + "\"><i class=\"far fa-trash-alt\"></i></a></td>")+
            "<td class=\"text-center\"><a href=\"#\" class=\"open-details-modal\" data-id=\"" + item.booking_massage_id + "\"><i class=\"fas fa-eye\"></i></a></td>"+
            "<td class=\"text-center\"><a href=\"#\" class=\"print-modal-click\" data-booking-id=\"" + item.booking_id + "\"><i class=\"fas fa-print\"></i></a></td>"+
            "<td><span class=\"confirm\"><input type=\"checkbox\" name=\"confirm_booking\" class=\"confirm_booking\" value=\"" + item.booking_massage_id + "\" data-type=\"" + type + "\" " + (item.is_confirm == '1' ? "checked" : "") + " " + (item.is_confirm == '1' ? "disabled" : "") + "/><label></label></span></td>"+
        "</tr>";
     
        $("#client-appointments").append(newListItem);

        $('.confirm_booking').unbind().change(function() {
            if (this.checked) {
                let bookingMassageId = $(this).val(),
                    type             = $(this).data('type');

                confirm("Are you sure want to confirm this booking ?", confirmBookingMassage, [bookingMassageId, type], $(this));
            }

            return false;
        });

        if (specialNotes) {
            var notesModel = '<div class="modal fade" id="notes-modal-' + item.booking_massage_id + '" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">';
                notesModel += '<div class="modal-dialog modal-dialog-centered modal-lg" role="document">';
                notesModel += '<div class="modal-content">';
                notesModel += '<div class="modal-header">Special Notes';
                notesModel += '<button type="button" class="close" data-dismiss="modal" aria-label="Close">';
                notesModel += '<span aria-hidden="true">&times;</span>';
                notesModel += '</button>';
                notesModel += '</div>';
                notesModel += '<div class="modal-body">' + item.notes + '</div>';
                notesModel += '</div></div></div></div>';

            $('#notes-modal-static').append(notesModel);
        }

        var detailsModel = '<div class="modal fade" id="details-modal-' + item.booking_massage_id + '" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">';
            detailsModel += '<div class="modal-dialog modal-dialog-centered" role="document">';
            detailsModel += '<div class="modal-content">';
            detailsModel += '<div class="modal-header">Booking ' + item.booking_id;
            detailsModel += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
            detailsModel += '</div>';
            detailsModel += '<div class="modal-body">';
                detailsModel += '<div class="details-inner">';
                detailsModel += '<div class="modal-details"><table width="100%" cellpadding="0" cellspacing="0">';
                detailsModel += '<tr>';
                    detailsModel += '<td>Pressure Preference</td>';
                    detailsModel += '<td>' + item.pressure_preference + '</td>';
                detailsModel += '</tr>';
                detailsModel += '<tr>';
                    detailsModel += '<td>Focus Areas</td>';
                    detailsModel += '<td>' + item.focus_area + '</td>';
                detailsModel += '</tr>';
                detailsModel += '<tr>';
                    detailsModel += '<td>Therapist preference</td>';
                    detailsModel += '<td>' + item.genderPreference + '</td>';
                detailsModel += '</tr>';
                detailsModel += '<tr>';
                    detailsModel += '<td>Any Injury or Physical Condition ?</td>';
                    detailsModel += '<td>' + item.injuries + '</td>';
                detailsModel += '</tr>';
                detailsModel += '<tr>';
                    detailsModel += '<td>Booking Date</td>';
                    detailsModel += '<td>' + getDate(item.massage_date) + '</td>';
                detailsModel += '</tr>';
                detailsModel += '<tr>';
                    detailsModel += '<td>Booking Time</td>';
                    detailsModel += '<td>' + getTime(item.massage_date) + '</td>';
                detailsModel += '</tr>';
            detailsModel += '</table>';
            detailsModel += '</div>';
            detailsModel += '<div class="float-right" style="margin-top: 15px;"><a href="#" class="cmn-btn">Edit</a></div>';
            detailsModel += '</div>';
            detailsModel += '</div></div></div></div>';

        $('#details-modal-static').append(detailsModel);
    });

    $(document).find(".open-model").on("click", function() {
        $($(this).data('target')).attr('data-id', $(this).data('id'));

        $($(this).data('target')).attr('data-type', $(this).data('type'));

        $($(this).data('target')).modal('show');
    });

    $(document).find('.open-details-modal').unbind().on("click", function() {
        let self             = $(this),
            bookingMassageId = self.data('id');

        $('div#details-modal-' + bookingMassageId).modal('show');
    });

    $(document).find('.print-modal-click').on("click", function() {
        let self      = $(this),
            bookingId = self.data('booking-id');

        getBookingPrintDetails(bookingId);
    });
}

function getFutureBookings(userId) {
    let type = currentType;

    let postData = {
        "type": type,
        "user_id": userId
    }

    Post(GET_CLIENT_FUTURE_BOOKINGS, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            var myArray = res.data.data;

            buildBookingHtml(myArray, true);
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getPastBookings(userId) {
    let type = currentType;

    let postData = {
        "type": type,
        "user_id": userId
    }

    Post(GET_CLIENT_PAST_BOOKINGS, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            var myArray = res.data.data;

            buildBookingHtml(myArray);
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getCancelledBookings(userId) {
    let type = currentType;

    let postData = {
        "type": type,
        "user_id": userId
    }

    Post(GET_CLIENT_CANCELLED_BOOKINGS, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            var myArray = res.data.data;

            buildBookingHtml(myArray);
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function confirmBookingMassage(bookingMassageId, type)
{
    let postData = {
        "booking_massage_id": bookingMassageId
    };

    Post(CONFIRM_BOOKING, postData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            $('ul.booking-type').find('li').find('a.active').parent().click();
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function bindHeaderFilterClickEvents()
{
    $(document).find('.room-center ul li').find('input:radio[name="assign_room"]').on("click", function() {
        let self  = $(this),
            modal = $('#assign-rooms-modal');

        modal.modal('hide');

        if (self.is(':checked')) {
            assignRoom(modal.data('id'), self.val(), modal.data('type'));
        }
    });
}

function getRooms()
{
    let postData = {};

    Post(GET_ROOMS, postData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            let liHtml            = "",
                liAssignRoomHtml  = "";

            $.each(data.data, function(key, item) {
                liAssignRoomHtml += '<li><input type="radio" name="assign_room" value="' + item.id + '"/><label>' + item.name + '</label></li>';
            });

            let roomAssignElement = $('.room-center ul');

            roomAssignElement.empty();
            roomAssignElement.html(liAssignRoomHtml);

            bindHeaderFilterClickEvents();
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function assignRoom(bookingMassageId, roomId, type)
{
    let postData = {
        "booking_massage_id": bookingMassageId,
        "room_id": roomId
    };

    Post(ASSIGN_ROOMS, postData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            $('ul.booking-type').find('li').find('a.active').parent().click();
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getBookingPrintDetails(bookingId) {
    let postData = {
        "booking_id": bookingId
    }

    Post(PRINT_BOOKING_DETAILS, postData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            let response = data.data;

            let printModal = '';

            printModal += '<div class="modal-dialog modal-dialog-centered modal-lg" role="document">';
                printModal += '<div class="modal-content">';
                    printModal += '<div class="modal-header cust-head">';
                        printModal += '<span class="code-id" data-toggle="modal" data-target="#codemodel"><img src="images/qr.png" alt=""></span>';
                        printModal += '<h5 class="modal-title">Booking ID: ' + response.booking_id + '</h5>';
                        printModal += '<a href="#" class="cmn-btn print">Print Ticket</a>';
                        printModal += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"> <span aria-hidden="true">×</span> </button>';
                    printModal += '</div>';
                    printModal += '<div class="modal-body">';
                        printModal += '<div class="model-inner no-pad">';
                            printModal += '<div class="booking-info">';
                                printModal += '<div class="book-grp half with-width">';
                                    printModal += '<div class="grp-field">';
                                        printModal += '<label>Center:</label>';
                                        printModal += '<div class="grp-right">';
                                            printModal += '<input type="text" name="center" placeholder="Terra Heal Massage Center" value="' + response.shop_name + '">';
                                        printModal += '</div>';
                                    printModal += '</div>';
                                printModal += '</div>';

                                printModal += '<div class="book-grp half with-width">';
                                    printModal += '<div class="grp-field">';
                                        printModal += '<label>Date &amp; Time:</label>';
                                        printModal += '<div class="grp-right">';
                                            printModal += '<input type="text" name="center" placeholder="28 Oct 2020, 3:30pm" value="' + response.date_time + '">';
                                        printModal += '</div>';
                                    printModal += '</div>';
                                printModal += '</div>';

                                printModal += '<div class="book-grp half with-width">';
                                    printModal += '<div class="grp-field">';
                                        printModal += '<label>Delivery Types:</label>';
                                        printModal += '<div class="grp-right">';
                                            printModal += '<input type="text" name="center" placeholder="In massage center" value="' + response.booking_type + '">';
                                        printModal += '</div>';
                                    printModal += '</div>';
                                printModal += '</div>';

                                printModal += '<div class="book-grp half with-width">';
                                    printModal += '<div class="grp-field">';
                                        printModal += '<label>Session Details:</label>';
                                        printModal += '<div class="grp-right">';
                                            printModal += '<input type="text" name="center" placeholder="Group" value="' + response.session_type + '">';
                                        printModal += '</div>';
                                    printModal += '</div>';
                                printModal += '</div>';

                                printModal += '<div class="book-grp half with-width">';
                                    printModal += '<div class="grp-field">';
                                        printModal += '<label>Delivery Address:</label>';
                                        printModal += '<div class="grp-right">';
                                            printModal += '<input type="text" name="center" placeholder="Delivery Address" value="' + response.shop_address + '">';
                                        printModal += '</div>';
                                    printModal += '</div>';
                                printModal += '</div>';

                                printModal += '<div class="book-grp half with-width">';
                                    printModal += '<div class="grp-field">';
                                        printModal += '<label>Booking Notes:</label>';
                                        printModal += '<div class="grp-right">';
                                            printModal += '<textarea placeholder="Booking Notes">' + response.notes + '</textarea>';
                                        printModal += '</div>';
                                    printModal += '</div>';
                                printModal += '</div>';

                                printModal += '<div class="book-grp half">';
                                    printModal += '<div class="grp-field table-cont">';
                                        printModal += '<label>Receptionists:</label>';

                                        printModal += '<div class="grp-right">';
                                            printModal += '<table class="table" width="100%" cellspacing="0" cellpadding="0" border="0">';
                                                printModal += '<thead>';
                                                    printModal += '<tr>';
                                                        printModal += '<th scope="col">';
                                                            printModal += 'Sr.No';
                                                        printModal += '</th>';

                                                        printModal += '<th scope="col">';
                                                            printModal += 'Name';
                                                        printModal += '</th>';

                                                        printModal += '<th scope="col">';
                                                            printModal += 'Services';
                                                        printModal += '</th>';

                                                        printModal += '<th scope="col">';
                                                            printModal += 'Duration';
                                                        printModal += '</th>';

                                                        printModal += '<th scope="col">';
                                                            printModal += 'Cost';
                                                        printModal += '</th>';
                                                    printModal += '</tr>';
                                                printModal += '</thead>';

                                                printModal += '<tbody>';
                                                    let totalCosts = 0;
                                                    $.each(response.booking_services, function(key, userInfo) {
                                                        printModal += '<tr>';
                                                            printModal += '<td>';
                                                                printModal += key;
                                                            printModal += '</td>';

                                                            printModal += '<td>';
                                                                printModal += userInfo.name;
                                                            printModal += '</td>';

                                                            printModal += '<td>';
                                                                printModal += userInfo.service_name;
                                                            printModal += '</td>';

                                                            printModal += '<td>';
                                                                printModal += userInfo.massage_duration;
                                                            printModal += '</td>';

                                                            printModal += '<td>';
                                                                printModal += userInfo.cost;
                                                            printModal += '</td>';
                                                        printModal += '</tr>';

                                                        totalCosts += userInfo.cost;
                                                    });
                                                printModal += '</tbody>';

                                                printModal += '<tfoot>';
                                                    printModal += '<tr>';
                                                        printModal += '<td colspan="3" class="no-border">&nbsp;</td>';
                                                        printModal += '<td>Total</td>';
                                                        printModal += '<td>&#8364; ' + totalCosts + '</td>';
                                                    printModal += '</tr>';
                                                printModal += '</tfoot>';
                                            printModal += '</table>';
                                        printModal += '</div>';
                                    printModal += '</div>';
                                printModal += '</div>';

                                printModal += '<div class="book-grp half">';
                                    printModal += '<div class="grp-field table-cont">';
                                        printModal += '<label>Payment Status:</label>';

                                        printModal += '<div class="grp-right">';
                                            printModal += '<div class="norm-cont"> <span class="paid">paid 50%</span><small>Paid by creditCard</small> </div>';
                                        printModal += '</div>';
                                    printModal += '</div>';
                                printModal += '</div>';

                                printModal += '<div class="book-grp half">';
                                    printModal += '<div class="grp-field table-cont">';
                                        printModal += '<label>Payment Status:</label>';

                                        printModal += '<div class="grp-right">';
                                            printModal += '<table class="table payment" width="100%" cellspacing="0" cellpadding="0" border="0">';
                                                printModal += '<tbody>';
                                                    printModal += '<tr>';
                                                        printModal += '<td>Paid</td>';
                                                        printModal += '<td>&#8364; 180</td>';
                                                    printModal += '</tr>';

                                                    printModal += '<tr>';
                                                        printModal += '<td>voucher</td>';
                                                        printModal += '<td>&#8364; 60</td>';
                                                    printModal += '</tr>';

                                                    printModal += '<tr>';
                                                        printModal += '<td>Pack</td>';
                                                        printModal += '<td>&#8364; 60</td>';
                                                    printModal += '</tr>';

                                                    printModal += '<tr>';
                                                        printModal += '<td>Pending</td>';
                                                        printModal += '<td>&#8364; 180</td>';
                                                    printModal += '</tr>';
                                                printModal += '</tbody>';
                                            printModal += '</table>';
                                        printModal += '</div>';
                                    printModal += '</div>';
                                printModal += '</div>';
                            printModal += '</div>';
                        printModal += '</div>';
                    printModal += '</div>';
                printModal += '</div>';
            printModal += '</div>';

            $(document).find('#print-modal').empty();
            $(document).find('#print-modal').html(printModal);
            $(document).find('#print-modal').modal('show');
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function declineDocument(userId) {
    return Post(DECLINE_CLIENT_DOCUMENT, {"user_id": userId}, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            showSuccess(data.msg);

            getClientDetails(userId);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function acceptDocument(userId) {
    return Post(ACCEPT_CLIENT_DOCUMENT, {"user_id": userId}, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            showSuccess(data.msg);

            getClientDetails(userId);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function uploadDocument(userId) {
    let formData      = new FormData(),
        passportFront = $('form#form-document').find('#document-passport-front')[0].files[0],
        passportBack  = $('form#form-document').find('#document-passport-back')[0].files[0];

    formData.append("user_id", userId);
    formData.append("id_passport_front", passportFront);
    formData.append("id_passport_back", passportBack);

    return Post(UPLOAD_CLIENT_DOCUMENT, formData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            $('#add-new-document-modal').modal('hide');

            showSuccess(data.msg);

            getClientDetails(userId);

            $('form#form-document').get(0).reset();
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}
