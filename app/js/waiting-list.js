import { ONGOING, WAITING, CONFIRM_BOOKING, GET_ALL_THERAPISTS, GET_ROOMS, ASSIGN_ROOMS, DOWNGRADE_BOOKING, CANCEL_BOOKING, END_SERVICE_TIME, START_SERVICE_TIME, PRINT_BOOKING_DETAILS, ASSIGN_THERAPIST } from './networkconst.js';
import { Post, Get, redirect, SUCCESS_CODE, ERROR_CODE, EXCEPTION_CODE, THERAPIST_TIMETABLE, ADD_SERVICE_TIME } from './networkconst.js';

var backFile      = getUrl(window.location.href, 'backfile'),
    intervalArray = {};

const SERVICE_STATUS_DONE     = '2';
const SERVICE_STATUS_STARTED  = '1';
const SERVICE_STATUS_NOT_DONE = '0';

window.addEventListener("load", function() {
    // In massage center.
    GetOnGoing(1);
    GetWaiting(1);

    // Home / Hotel visit.
    GetOnGoing(2);
    GetWaiting(2);

    // Get therapists.
    getTherapists();

    // Get rooms.
    getRooms();

    // Bind header filter click events.
    bindHeaderFilterClickEvents();

    setYearMonth(true);

    $(document).find('#current-month').on("change", buildHeader);

    // Bind cancel booking events.
    $(document).find('.cancel-booking').on("click", function() {
        let modal        = $('#delete-modal'),
            bookingId    = modal.data('id'),
            cancelType   = $('input:radio[name="cancel_type"]:checked'),
            cancelValue  = cancelType.val().toString(),
            cancelReason = $('#cancel_reason'),
            type         = modal.data('type');

        cancelBooking(bookingId, cancelValue, cancelReason.val(), type);

        $('#delete-modal').data('id', 0).data('type', null).modal('hide');

        cancelType.prop('checked', false);

        $('input:radio[name="cancel_type"][value="0"]').prop('checked', true);

        cancelReason.val('');

        $('.reason-box').fadeOut('fast');
    });

    $('#notes-modal-static').empty();
});

function bindHeaderFilterClickEvents()
{
    $(document).find('.header_filter').change(function() {
        if ($(this).is(':checked')) {
            GetWaiting(1, {"service": $(this).val()});

            $('#service li.has-children.act a').click();

            $('#therapist li.has-children.act a').click();

            $('#room li.has-children.act a').click();

            $('#payment li.has-children.act a').click();
        }
    });

    $(document).find('.all-rooms ul li').find('input:radio[name="assign_room"]').unbind().on("click", function() {
        let self  = $(this),
            modal = $('#assign-rooms-modal');

        modal.modal('hide');

        if (self.is(':checked')) {
            assignRoom(modal.data('id'), self.val(), modal.data('type'));
        }
    });

    $(document).find('.all-therapist ul li').find('input:radio[name="assign_therapist"]').unbind().on("click", function() {
        let self  = $(this),
            modal = $('#assign-therapist-modal');

        modal.modal('hide');

        if (self.is(':checked')) {
            assignTherapist(modal.data('id'), self.val(), modal.data('type'));
        }
    });
}

function showNote(id)
{
    $("#notes-modal-" + id).modal('show');
}

function getRemainingTimeFromNow(dateTime)
{
    if (!moment(dateTime).isValid()) {
        return false;
    }

    let duration       = moment.duration(moment().diff(dateTime)),
        remainingTime  = (duration.minutes() < 0) ? padSingleZero(Math.abs(duration.minutes())) + ':' + padSingleZero(Math.abs(duration.seconds())) : false;

    return remainingTime;
}

function checkToStopInterval(item)
{
    let remainingTime = getRemainingTimeFromNow(item.actual_end_time),
        currentTime   = getCurrentUTCTimestamps();

    if (!remainingTime) {
        clearInterval(intervalArray[item.booking_massage_id]);

        endService(item.booking_massage_id, currentTime, type);
    }
}

function runTimer(data, type)
{
    // Milliseconds
    let interval = 1000;

    if (!empty(data) && Object.keys(data).length > 0) {
        $.each(data, function(i, item) {
            let remainingTime = getRemainingTimeFromNow(item.actual_end_time);

            if (remainingTime) {
                intervalArray[item.booking_massage_id] = setInterval(function(){
                    showServiceRemainingTime(item);

                    checkToStopInterval(item, type);
                }, interval);
            }
        });
    }
}

function showServiceRemainingTime(item)
{
    let remainingTime = getRemainingTimeFromNow(item.actual_end_time);

    if (remainingTime) {
        let element = $(document).find('#service-remaining-time-' + item.booking_massage_id);

        element.empty().html(remainingTime);
    }
}

function checkStarted(data)
{
    if (!empty(data) && Object.keys(data).length > 0) {
        $.each(data, function(i, item) {
            let element = $(document).find('#service-start-stop-' + item.booking_massage_id);

            if (!element) {
                return false;
            }

            if (intervalArray[item.booking_massage_id]) {
                clearInterval(intervalArray[item.booking_massage_id]);
            }

            if (item.service_status == SERVICE_STATUS_STARTED) {
                showServiceRemainingTime(item);

                element.addClass('fa-stop-circle').removeClass('fa-play-circle').removeClass('fa-check-circle');
            } else if (item.service_status == SERVICE_STATUS_NOT_DONE) {
                element.addClass('fa-play-circle').removeClass('fa-stop-circle').removeClass('fa-check-circle');
            } else {
                let elementRemeiningTime = $(document).find('#service-remaining-time-' + item.booking_massage_id),
                    getTotalTime         = getDiffInMinutes(item.actual_start_time, item.actual_end_time) + ':' + getDiffInSeconds(item.actual_start_time, item.actual_end_time);

                elementRemeiningTime.empty().html(getTotalTime);

                element.addClass('fa-check-circle').removeClass('fa-stop-circle').removeClass('fa-play-circle');
            }
        });
    }

    return true;
}

function GetOnGoing(type)
{
    let postData = {
        "type": type
    }

    Post(ONGOING, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            var myArray = res.data.data;

            $( ".ongoing-" + type ).empty();
            $('#details-modal-static').empty();

            $.each( myArray, function( i, item ) {
                let serviceName  = item.service_name,
                    specialNotes = (item.notes != '' && item.notes != null) ? item.notes : false;

                var newListItem = "<tr>"+
                    "<td><span class=\"user-icon\"><img src=\"images/single-user.png\" />"+
                    "</span>"+item.client_name+
                    "</td>"+
                    "<td>" + serviceName + " ("+item.massage_duration+")</td>"+
                    "<td>"+getTime(item.massage_start_time)+" -"+getTime(item.massage_end_time)+"</td>"+
                    "<td class=\"text-center\"><span class=\"th-sp orange\">" + item.therapistName + "</span></td>"+
                    "<td class=\"text-center\">"+item.roomName+"</td>"+
                    "<td class=\"text-center\">" + item.book_platform + "</td>"+
                    "<td><span class=\"pay-sp\">&#8364; 661</span>" + 
                    "<i class=\"fas fa-stop-circle\" id=\"service-start-stop-" + item.booking_massage_id + "\" data-id=\"" + item.booking_massage_id + "\" data-start-time=\"" + item.actual_start_time + "\" data-end-time=\"" + item.actual_end_time + "\"></i>" + 
                    "<i class=\"fas fa-arrow-alt-circle-down downgrade-booking\" data-id=\"" + item.booking_massage_id + "\" data-type=\"" + type + "\"></i></td>"+
                    "<td class=\"text-center\"><a href=\"#\" data-toggle=\"modal\" data-target=\"#notes-modal-" + item.booking_massage_id + "\"><i class=\"fas fa-sticky-note " + (specialNotes ? 'active' : '') + "\"></i></a></td>"+
                    "<td class=\"text-center\"><a href=\"#\" class=\"open-details-modal\" data-id=\"" + item.booking_massage_id + "\"><i class=\"fas fa-eye\"></i></a></td>"+
                    "<td class=\"text-center\" id=\"service-remaining-time-" + item.booking_massage_id + "\">00:00</td>"+
                "</tr>";

                $(".ongoing-" + type).append(newListItem);

                if (specialNotes) {
                    var notesModel = '<div class="modal fade" id="notes-modal-' + item.booking_massage_id + '" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">';
                        notesModel += '<div class="modal-dialog modal-dialog-centered modal-lg" role="document">';
                        notesModel += '<div class="modal-content">';
                        notesModel += '<div class="modal-header">Special Notes';
                        notesModel += '<button type="button" class="close" data-dismiss="modal" aria-label="Close">';
                        notesModel += '<span aria-hidden="true">&times;</span>';
                        notesModel += '</button>';
                        notesModel += '</div>';
                        notesModel += '<div class="modal-body">' + specialNotes + '</div>';
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
                        if (item.service_status == SERVICE_STATUS_NOT_DONE) {
                            detailsModel += '<div class="d-flex justify-content-between"><a href="#" class="cmn-btn start-service" data-id="' + item.booking_massage_id + '">Start</a><a href="#" class="cmn-btn end-service" data-id="' + item.booking_massage_id + '">Finished</a></div>';
                        } else if (item.service_status == SERVICE_STATUS_STARTED) {
                            detailsModel += '<div class="d-flex justify-content-between"><a href="#">&nbsp;</a><a href="#" class="cmn-btn end-service" data-id="' + item.booking_massage_id + '">Finished</a></div>';
                        }
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
                    detailsModel += '</div></div></div></div></div>';

                $('#details-modal-static').append(detailsModel);
            });

            checkStarted(myArray);

            runTimer(myArray);

            $(document).find('.downgrade-booking').on("click", function() {
                let self = $(this);

                confirm("Are you sure want to downgrade this booking ?", downgradeBooking, [self.data('id'), self.data('type')], $(this));
            });

            $(document).find('.fa-check-circle').on("click", function() {
                showSuccess("This booking massage already completed!");
            });

            $(document).find('.open-details-modal').on("click", function() {
                let self             = $(this),
                    bookingMassageId = self.data('id');

                $('div#details-modal-' + bookingMassageId).modal('show');
            });

            $(document).find('.fa-play-circle').on("click", function() {
                let self             = $(this),
                    bookingMassageId = self.data('id'),
                    currentTime      = getCurrentUTCTimestamps();

                confirm("Are you sure want to start this booking ?", startService, [bookingMassageId, currentTime, type], $(this));
            });

            $(document).find('.fa-stop-circle').on("click", function() {
                let self             = $(this),
                    bookingMassageId = self.data('id'),
                    currentTime      = getCurrentUTCTimestamps();

                confirm("Are you sure want to stop this booking ?", endService, [bookingMassageId, currentTime, type], $(this));
            });

            $(document).find('.start-service').on("click", function() {
                let self             = $(this),
                    bookingMassageId = self.data('id'),
                    currentTime      = getCurrentUTCTimestamps();

                confirm("Are you sure want to start this booking ?", startService, [bookingMassageId, currentTime, type, true], $(this));
            });

            $(document).find('.end-service').on("click", function() {
                let self             = $(this),
                    bookingMassageId = self.data('id'),
                    currentTime      = getCurrentUTCTimestamps();

                confirm("Are you sure want to stop this booking ?", endService, [bookingMassageId, currentTime, type, true], $(this));
            });

        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function GetWaiting(type, filter)
{
    let postData = {
        "type": type
    }

    if (typeof filter == 'object') {
        Object.entries(filter).forEach(([key,value]) => { postData[key] = value })
    }

    Post(WAITING, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {

            var myArray = res.data.data;

            $( ".waiting-" + type ).empty();
            // $('#details-modal-static').empty();

            $.each(myArray, function( i, item) {

                var therapistName="";
                var therapistRoom="";

                let specialNotes = (item.notes != '' && item.notes != null) ? item.notes : false;

                if (item.therapistName == null || item.therapistName == '') {
                    therapistName="<td class=\"text-center\"><span class=\"th-sp\"><span class=\"ed-icon\"><a href=\"#\" class=\"open-model\" data-target=\"#assign-therapist-modal\" data-id=" + item.booking_massage_id + " data-type=" + type + "><img src=\"images/girl.png\" alt=\"\"/></a></span></span></td>" 
                } else {
                    therapistName="<td class=\"text-center\"><span class=\"th-sp\">"+item.therapistName+"<span class=\"ed-icon\"></span></span></td>" 
                }

                let serviceName = item.service_name;
 
                var newListItem = "<tr>"+
                    "<td><span class=\"user-icon\"><img src=\"images/double-user.png\" /></span>"+item.client_name+"</td>"+
                    "<td><div class='main-time'><span class='time-new'><i class='far fa-clock'></i></span><div class='hidden-timer'><label>Enter Start Time</label><div class='input-group' data-id='" + item.booking_massage_id + "' id='clockpicker-" + item.booking_massage_id + "'><span class='input-group-addon'><i class='far fa-clock'></i></span><input type='text' class='form-control' value='" + getTime(item.massage_start_time) + "'></div></div></div>" + serviceName + " ("+item.massage_duration+")</td>"+
                    "<td>"+getTime(item.massage_start_time)+" -"+getTime(item.massage_end_time)+"</td>"+
                    therapistName+
                    "<td class=\"text-center\"><span>" + (item.roomName ? item.roomName : '<span class="as-room"><a href="#" class="open-model" data-target="#assign-rooms-modal" data-id="' + item.booking_massage_id + '" data-type="' + type + '">00</a></span>') + "</span></td>"+
                    "<td class=\"text-center\">"+item.book_platform+"</td>"+
                    "<td><span class=\"pay-sp\">€ 661</span><i class=\"fas fa-play-circle\"></i></td>"+
                    "<td class=\"text-center orange\"><a href=\"#\" data-toggle=\"modal\" data-target=\"#notes-modal-" + item.booking_massage_id + "\"><i class=\"fas fa-sticky-note " + (specialNotes ? 'active' : '') + "\"></i></a></td>"+
                    "<td class=\"text-center\"><i class=\"fas fa-edit\"></i></td>"+
                    "<td class=\"text-center\"><a href=\"#\" class=\"open-model\" data-target=\"#delete-modal\" data-id=\"" + item.booking_id + "\" data-type=\"" + type + "\"><i class=\"far fa-trash-alt\"></i></a></td>"+
                    "<td class=\"text-center\"><a href=\"#\" class=\"open-details-modal\" data-id=\"" + item.booking_massage_id + "\"><i class=\"fas fa-eye\"></i></a></td>"+
                    "<td class=\"text-center\"><a href=\"#\" id=\"print-modal-click\" data-booking-id=\"" + item.booking_id + "\"><i class=\"fas fa-print\"></i></a></td>"+
                    "<td><span class=\"confirm\"><input type=\"checkbox\" name=\"confirm_booking\" class=\"confirm_booking\" value=\"" + item.booking_massage_id + "\" data-type=\"" + type + "\"/><label></label></span></td>"+
                "</tr>";
             
                $(".waiting-" + type).append(newListItem);

                $('#clockpicker-' + item.booking_massage_id).clockpicker({
                    donetext: 'Done',
                    afterDone: function() {
                        let clockPickerElement = $('#clockpicker-' + item.booking_massage_id);

                        addServiceTime(clockPickerElement, type);
                    }
                });

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

            $(".time-new").unbind().on("click", function() {
                $(".main-time").find(".hidden-timer").fadeOut();

                if (!$(this).parent(".main-time").find(".hidden-timer").is(":visible")) {
                    $(this).parent(".main-time").find(".hidden-timer").slideToggle("slow");
                }
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

            $(document).find('#print-modal-click').on("click", function() {
                let self      = $(this),
                    bookingId = self.data('booking-id');

                getBookingPrintDetails(bookingId);
            });

        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function addServiceTime(clockPickerElement, type) {
    let bookingMassageId = clockPickerElement.data("id"),
        elementValue     = clockPickerElement.find("input").get(0).value;

    return confirm("Are you sure want to update service time ?", apiServiceTime, [bookingMassageId, elementValue, type], clockPickerElement);
}

function apiServiceTime(bookingMassageId, serviceTime, type)
{
    $(".main-time").find(".hidden-timer").fadeOut();

    serviceTime = convertTimeInputToUTCTimestamps(serviceTime);

    let postData = {
        "booking_massage_id": bookingMassageId,
        "service_start_time": serviceTime
    };

    Post(ADD_SERVICE_TIME, postData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            GetOnGoing(type);
            GetWaiting(type);
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
            // window.location = "waiting-booking.html";

            GetOnGoing(type);
            GetWaiting(type);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getTherapists()
{
    let postData = {};

    Post(GET_ALL_THERAPISTS, postData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            let liHtml       = "",
                liAssignHtml = "";

            $.each(data.data, function(key, item) {
                liHtml += '<li><input type="radio" name="filter_therapist" class="header_filter" value="' + key + '"/><label>' + item + '</label></li>';

                liAssignHtml += '<li><input type="radio" name="assign_therapist" value="' + key + '"/>&nbsp;<label>' + item + '</label></li>';
            });

            let dropdownElement        = $('#therapist li ul'),
                therapistAssignElement = $('.all-therapist ul');

            dropdownElement.empty();
            dropdownElement.html(liHtml);

            therapistAssignElement.empty();
            therapistAssignElement.html(liAssignHtml);

            bindHeaderFilterClickEvents();
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
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
                liHtml += '<li><input type="radio" name="filter_room" class="header_filter" value="' + item.id + '"/><label>' + item.name + '</label></li>';

                liAssignRoomHtml += '<li><input type="radio" name="assign_room" value="' + item.id + '"/><label>' + item.name + '</label></li>';
            });

            let dropdownElement   = $('#room li ul'),
                roomAssignElement = $('.all-rooms ul');

            dropdownElement.empty();
            dropdownElement.html(liHtml);

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
            // showSuccess(data.msg);

            GetOnGoing(type);
            GetWaiting(type);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function assignTherapist(bookingInfoId, therapistId, type)
{
    let postData = {
        "booking_massage_id": bookingInfoId,
        "therapist_id": therapistId
    };

    Post(ASSIGN_THERAPIST, postData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            // showSuccess(data.msg);

            GetOnGoing(type);
            GetWaiting(type);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function downgradeBooking(bookingMassageId, type)
{
    let postData = {
        "booking_massage_id": bookingMassageId
    };

    Post(DOWNGRADE_BOOKING, postData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            // showSuccess(data.msg);

            GetOnGoing(type);
            GetWaiting(type);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function cancelBooking(bookingId, cancelType, cancelReason, type)
{
    let postData = {
        "booking_id": bookingId,
        "cancel_type": cancelType,
        "cancelled_reason": cancelReason
    }

    Post(CANCEL_BOOKING, postData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            // showSuccess(data.msg);

            GetOnGoing(type);
            GetWaiting(type);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function endService(bookingMassageId, endTime, type, hideModal)
{
    let postData = {
        "booking_massage_id": bookingMassageId,
        "end_time": endTime
    }

    Post(END_SERVICE_TIME, postData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            showSuccess(data.msg);

            GetOnGoing(type);
            GetWaiting(type);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });

    if (hideModal) {
        $(document).find('#details-modal-' + bookingMassageId).modal('hide');
    }
}

function startService(bookingMassageId, startTime, type, hideModal)
{
    let postData = {
        "booking_massage_id": bookingMassageId,
        "start_time": startTime
    }

    Post(START_SERVICE_TIME, postData, function (res) {
        let data = res.data;

        if (data.code == ERROR_CODE) {
            showError(data.msg);
        } else {
            // showSuccess(data.msg);

            GetOnGoing(type);
            GetWaiting(type);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });

    if (hideModal) {
        $(document).find('#details-modal-' + bookingMassageId).modal('hide');
    }
}

function getBookingPrintDetails(bookingId)
{
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

function getSelectedMonth() {
    return new Date($('#current-month').val());
};

function setYearMonth(isCurrent)
{
    if (isCurrent) {
        let currentMonthYear = moment().format('YYYY-MM');

        $('#current-month').val(currentMonthYear);
    }

    buildHeader();
}

function getTotalDays()
{
    let currentMonth = moment(getSelectedMonth().getTime()),
        daysInMonth  = currentMonth.daysInMonth(),
        monthDate    = currentMonth.startOf('month'),
        returnDays   = [];

    for (let i = 0; i < daysInMonth; i++) {
        let newDay = monthDate.clone().add(i,'days');

        returnDays.push(newDay);
    }

    return returnDays;
}

function buildHeader()
{
    let totalDays = getTotalDays(),
        table     = $('#current-table'),
        thead     = "<tr>";

    $.each(totalDays, function(key, day) {
        thead += '<th>';
            thead += day.format('ddd DD/MM');
        thead += '</th>';
    });

    thead += "</tr>";

    table.find('thead').empty().html(thead);

    buildTherapistData();
}

function buildTherapistData()
{
    let selectedMonth = getSelectedMonth(),
        postData      = {
            "date": selectedMonth.getTime()
        };

    Post(THERAPIST_TIMETABLE, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            let data      = res.data.data,
                totalDays = getTotalDays(),
                tbody     = "",
                tableBody = $('#current-body');

            $.each(data, function(index, row) {
                tbody += '<tr>';

                let rowDay    = moment(row.date).format('YYYY-MM-DD'),
                    startTime = !empty(row.therapist_working_schedule_time) ? new Date(row.therapist_working_schedule_time.start_time).getUTCHours() : "",
                    endTime   = !empty(row.therapist_working_schedule_time) ? new Date(row.therapist_working_schedule_time.end_time).getUTCHours() : "",
                    therapist = row.therapist;

                $.each(totalDays, function(key, day) {
                    tbody += '<td>';

                    let thisDay = day.format('YYYY-MM-DD');

                    if (thisDay == rowDay) {
                        tbody += '<div class="cont">';
                            tbody += startTime + '-' + endTime;

                            tbody += '<span class="c-name">';
                                 tbody += ' ' + therapist.name;
                            tbody += '</span>';
                        tbody += '</div>';
                    } else {
                        tbody += '<mark> - </mark>';
                    }

                    tbody += '</td>';
                });

                tbody += '</tr>';
            });

            if (tbody != "") {
                tableBody.empty().html(tbody);
            } else {
                tableBody.empty().html('<tr><td colspan="31"><mark>No records found!</mark></mark></td></tr>');
            }
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        console.log("AXIOS ERROR: ", err);
    });
}