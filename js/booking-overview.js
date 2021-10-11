
import { Post, Get, SUCCESS_CODE, ERROR_CODE, EXCEPTION_CODE } from './networkconst.js';
import { getTherapists, BOOKING_OVERVIEW } from './networkconst.js';

window.addEventListener("load", function() {
    setDate();
});

function setDate()
{
    let currentDate = moment();

    $('#booking-date').val(currentDate.format("yyyy-MM-DD"));

    $('#booking-type').on('change', buildheader);

    $('#booking-staff').on('change', buildheader);

    $('#booking-date').on('change', buildheader);

    buildheader(true);
}

function buildheader(isFirstTime)
{
    getTherapists().then(
        function(response) {
            if (!response || !response.data || response.data.length <= 0) {
                // showError("No records found.");
            } else {
                let data = response.data;

                if (data.code == SUCCESS_CODE) {
                    buildHeaderHtml(data.data, isFirstTime);
                } else {
                    showError(data.msg);
                }
            }
        },
        function(error) {
            showError("AXIOS ERROR: " + err);
        }
    );
}

function buildHeaderHtml(data, isFirstTime)
{
    if (Object.keys(data).length > 0) {
        let element   = $('#current-thead'),
            thead     = "<tr>";

        if (isFirstTime === true) {
            var selectEle = $('#booking-staff'),
                option    = '<option value="">Select Therapist</option>';
        }

        thead += '<th scope="col">&nbsp;</th>';

        $.each(data, function(id, therapistName) {
            thead += '<th scope="col" data-id="' + id + '" id="thead-' + id + '">';
                thead += therapistName;
            thead += '</th>';

            if (isFirstTime === true) {
                option += '<option value="' + id + '">';
                    option += therapistName;
                option += '</option>';
            }
        });

        element.empty().html(thead);

        if (isFirstTime === true) {
            selectEle.empty().html(option);
        }

        buildTableBody();
    }
}

function getTimeSlots()
{
    let startFrom = moment('03-11-1992 08:50:00'),
        timeSlots = {};

    for (let i = 0; i < 12; i++) {
        let newTime = startFrom.add('10', 'minutes').format('HH:mm:ss');

        timeSlots[newTime] = [];

        for (let j = 0; j < 5; j++) {
            timeSlots[newTime].push(startFrom.add('10', 'minutes').format('HH:mm:ss'));
        }
    }

    return timeSlots;
}

function setAsId(string)
{
    return string.replace(':', '-').replace(':', '-');
}

function buildBodyHtml(time, slots, therapistData)
{
    let td = "";

    if (typeof therapistData !== typeof undefined && Object.keys(therapistData).length > 0) {
        $.each(therapistData, function(therapistId, therapistName) {
            td += '<th class="overview-body">';
                td += '<table class="text-center">';
                    $.each(slots, function(key, slot) {
                        if (key == 0) {
                            td += '<tr>';
                                td += '<td id="tbody-'+ therapistId + "-" + setAsId(time) + '">&nbsp;';
                                td += '</td>';
                            td += '</tr>';
                        }

                        td += '<tr>';
                            td += '<td id="tbody-' + therapistId + "-" + setAsId(slot) + '">&nbsp;';
                            td += '</td>';
                        td += '</tr>';
                    });
                td += '</table>';
            td += '</th>';
        });
    }

    return td;
}

function buildLeftSideTimeHtml(time, slots)
{
    let th = "";

    th += '<th>';
        th += '<table>';
            $.each(slots, function(key, slot) {
                if (key == 0) {
                    th += '<tr class="text-center">';
                        th += '<td>';
                            th += time;
                        th += '</td>';
                    th += '</tr>';
                }

                th += '<tr class="text-right">';
                    th += '<td>';
                        th += slot;
                    th += '</td>';
                th += '</tr>';
            });
        th += '</table>';
    th += '</th>';

    return th;
}

async function buildLeftSideTime()
{
    let tbody         = "",
        timeSlots     = getTimeSlots();

    getTherapists().then(
        function(response) {
            if (!response || !response.data || response.data.length <= 0) {
                // showError("No records found.");
            } else {
                $.each(timeSlots, function(time, slots) {
                    tbody += '<tr>';
                        tbody += buildLeftSideTimeHtml(time, slots);

                        tbody += buildBodyHtml(time, slots, response.data.data);
                    tbody += '</tr>';
                });

                $('#current-tbody').empty().html(tbody);
            }

            return true;
        }
    )
}

function findCells(therapistId, hour, minutes)
{
    let cell = false;

    if (therapistId > 0 && hour > 0 && minutes > 0) {
        let findTd = $('#current-tbody').find('td[id^="tbody-' + therapistId + '-' + hour + '-"]');

        if (findTd.length > 0) {
            if (minutes < 10) {
                // 00
                cell = $('#current-tbody').find('td[id^="tbody-' + therapistId + '-' + hour + '-00"]');
            } else if (minutes > 10 && minutes < 20) {
                // 10
                cell = $('#current-tbody').find('td[id^="tbody-' + therapistId + '-' + hour + '-10"]');
            } else if (minutes > 20 && minutes < 30) {
                // 20
                cell = $('#current-tbody').find('td[id^="tbody-' + therapistId + '-' + hour + '-20"]');
            } else if (minutes > 30 && minutes < 40) {
                // 30
                cell = $('#current-tbody').find('td[id^="tbody-' + therapistId + '-' + hour + '-30"]');
            } else if (minutes > 40 && minutes < 50) {
                // 40
                cell = $('#current-tbody').find('td[id^="tbody-' + therapistId + '-' + hour + '-40"]');
            } else {
                // 50
                cell = $('#current-tbody').find('td[id^="tbody-' + therapistId + '-' + hour + '-50"]');
            }
        }
    }

    return cell;
}

function buildMainBody(data)
{
    $.each(data, function(key, row) {
        let therapistId = row.therapist_id;

        if (row.services && Object.keys(row.services).length > 0) {
            $.each(row.services, function(index, service) {
                let time            = new Date(service.massage_start_time),
                    cell            = findCells(therapistId, padSingleZero(time.getUTCHours()), padSingleZero(time.getUTCMinutes())),
                    serviceName     = (service.massage_name != "" && service.massage_name != null) ? service.massage_name : service.therapy_name,
                    serviceDuration = (service.massage_duration != "" && service.massage_duration != null) ? service.massage_duration : service.therapy_duration;

                if (cell && cell.length > 0) {
                    cell.empty().html('<a href="#" data-toggle="modal" data-target="#booking-details">' + serviceName + '(' + serviceDuration + ')' + '</a>').fadeIn();
                }
            });
        }
    });
}

function buildTableBody()
{
    getBookingOverviews().then(
        function(response) {
            if (!response || !response.data || response.data.length <= 0) {
                // showError("No records found.");
            } else {
                let data = response.data;

                if (data.code == SUCCESS_CODE) {
                    buildLeftSideTime().then(function() {
                        buildMainBody(data.data);
                    });
                } else {
                    showError(data.msg);
                }
            }
        }
    );
}

function getFilterType()
{
    return $('#booking-type').val();
}

function getFilterDate()
{
    return new Date($('#booking-date').val()).getTime();
}

function getFilterTherapist()
{
    return $('#booking-staff').val();
}

function filterData()
{
    return {
        type: getFilterType(),
        date: getFilterDate(),
        therapist_id: getFilterTherapist()
    }
}

async function getBookingOverviews()
{
    let postData  = filterData();

    return Post(BOOKING_OVERVIEW, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            return res;
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}
