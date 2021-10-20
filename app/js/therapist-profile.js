import { Post, Get, EXCEPTION_CODE, SUCCESS_CODE, getCountries, getCities } from './networkconst.js';
import { GET_THERAPIST_INFO, UPDATE_THERAPIST, SERVICES, ADD_THERAPIST_SERVICE, REMOVE_THERAPIST_SERVICE, GET_THERAPIST_AVAILABILITY, GET_THERAPIST_RATING } from './networkconst.js';

var tabPersonal     = '#personal',
    tabDocuments    = '#documents',
    tabStatistics   = '#statistics',
    tabPortfolio    = '#portfolio',
    tabAvailability = '#availability',
    tabRatings      = '#ratings',
    therapistId     = getQueryStringValue('id');

const TYPE_MASSAGE = '0';
const TYPE_THERAPY = '1';

const TODAY = '0';
const YESTERDAY = '1';
const THIS_WEEK = '2';
const CURRENT_MONTH = '3';
const LAST_7_DAYS = '4';
const LAST_14_DAYS = '5';
const LAST_30_DAYS = '6';
const CUSTOM = '7';

window.addEventListener("load", function() {
    loadDatas(tabPersonal, true);

    $(document).find('#statistics-month').on("change", function() {
        loadDatas(tabStatistics);
    });

    $(document).find("ul#th-tabs").find('li').find('a').on("click", function() {
        let tabName = $(this).attr('href');

        loadDatas(tabName, true);
    });

    $(document).find('#expire-date').on("click", function() {
        let isChecked = $(this).is(':checked');

        if (isChecked) {
            $('form#form-document-upload').find('#div-expire-date').removeClass('d-none').fadeIn(200);
        } else {
            $('form#form-document-upload').find('#div-expire-date').addClass('d-none');
        }
    });

    $(document).find('#save-document').on("click", function() {
        saveDocument();
    });

    $(document).find('#countries').on("change", function() {
        let countryId = $(this).val();

        if (countryId != "" && countryId != null) {
            loadCities(countryId);
        } else {
            $('#cities').empty().html('<option value="">Select City</option>');
        }
    });

    $(document).find('#profile-save').on("click", function() {
        let activeTab   = $($("ul#th-tabs li a.active").attr('href')),
            currentForm = activeTab.find('form');

        if (currentForm.attr('id') == 'form-personal') {
            savePersonal(currentForm);
        }
    });

    $('#range-availability').dateRangePicker({
        singleMonth: true
    });

    setAvailabilityDate();

    $('#availability-date').on('change', function() {
        let self = $(this);

        getAvailabilities();
    });

    $('#custom-date').on('change', function() {
        let date = convertDateInputToUTCTimestamps($(this).val());

        if ((!empty(date) && date >= 0) || empty($(this).val())) {
            getRatings(CUSTOM, date);
        }
    });

    $('select#rating-filters').on('change', function() {
        if ($(this).val() == CUSTOM) {
            $('#custom-date').fadeIn(200);
        } else {
            $('#custom-date').fadeOut(200);

            $('#custom-date').val("");

            getRatings($(this).val());
        }
    });
});

function setAvailabilityDate() {
    let currentDate = moment();

    $('#availability-date').val(currentDate.format("yyyy-MM-DD"));
}

function loadDatas(tabName, clearCache) {
    tabName = (tabName == "" || tabName == null) ? tabPersonal : tabName;

    $('#profile-save').addClass('d-none');

    getTherapist(clearCache).then(
        function(response) {
            if (!response || !response.data || response.data.length <= 0) {
                // showError("No records found.");
            } else {
                let data = response.data;

                if (data.code == SUCCESS_CODE) {
                    let therapistData = data.data[0];

                    if (tabName == tabPersonal) {
                        $('#therapist-name').empty().html(therapistData.name);
                        $('#profile_photo').attr('src', therapistData.profile_photo);

                        getCountries().then(
                            function(response) {
                                if (!response || !response.data || response.data.length <= 0) {
                                    // showError("No records found.");
                                } else {
                                    let data = response.data;

                                    if (data.code == SUCCESS_CODE) {
                                        let element = $('#countries'),
                                            option  = '<option value="">Select Country';
                                            option += '</option>';

                                        $.each(data.data, function(key, item) {
                                            option += '<option value="' + item.id + '">';
                                                option += item.name;
                                            option += '</option>';
                                        });

                                        element.empty().html(option);
                                    }
                                }
                            }
                        ).then(
                            function() {
                                if (therapistData.country_id) {
                                    loadCities(therapistData.country_id).then(
                                        function() {
                                            fillFormData(therapistData);

                                            $('#profile-save').removeClass('d-none').fadeIn(200);
                                        }
                                    );
                                } else {
                                    fillFormData(therapistData);

                                    $('#profile-save').removeClass('d-none').fadeIn(200);
                                }
                            }
                        );
                    } else if (tabName == tabDocuments) {
                        $('form#form-documents').find('input[name="id"]').val(therapistId);

                        $('form#form-document-upload').find('input[name="id"]').val(therapistId);

                        let element = $('#therapist-documents');

                        element.empty();

                        if (!empty(therapistData.documents) && Object.keys(therapistData.documents).length > 0) {
                            $.each(therapistData.documents, function(key, documents) {
                                let html = '<div class="grp-field">';

                                    html += '<div class="grp-lft d-flex">';
                                        html += '<label>';
                                            html += documents.doc_name;
                                        html += '</label>';

                                        html += '<div class="grp-right">';
                                            html += '<ul>';
                                                html += '<li data-toggle="modal" data-target="#model">';
                                                    html += '<img src="' + documents.file_name + '" alt="' + documents.doc_name + '">';
                                                html += '</li>';

                                                if (documents.expire_date > 0) {
                                                    html += '<li>';
                                                        html += '<label>';
                                                            html += 'Expire in:';
                                                        html += '</label>';

                                                        html += '<div class="date-expired">';
                                                            html += getDate(documents.expire_date);
                                                        html += '</div>';
                                                    html += '</li>';
                                                }
                                            html += '</ul>';
                                        html += '</div>';
                                    html += '</div>';

                                    html += '<div class="grp-rht d-flex">';
                                        html += '<div class="updated">';
                                            html += 'Admin';
                                        html += '</div>';

                                        html += '<div class="dated">';
                                            html += getDate(documents.created_at);
                                        html += '</div>';

                                        html += '<div>';
                                            html += '<a href="javascript:void(0);"><i class="fa fa-trash"></i></a>';
                                        html += '</div>';
                                    html += '</div>';

                                html += '</div>';

                                element.append(html);
                            });
                        }
                    } else if (tabName == tabAvailability) {
                        getAvailabilities();
                    } else if (tabName == tabRatings) {
                        $('select#rating-filters').val(TODAY);

                        getRatings();
                    } else if (tabName == tabStatistics) {
                        $('form#form-statistics').find('input[name="id"]').val(therapistId);

                        setYearMonth(true);

                        getStatistics(getSelectedMonth().getTime());
                    } else if (tabName == tabPortfolio) {
                        getServices(TYPE_MASSAGE, therapistData.selected_services);
                        getServices(TYPE_THERAPY, therapistData.selected_services);
                    }
                }
            }
        }
    );
}

function setYearMonth(isCurrent) {
    if (isCurrent) {
        let currentMonthYear = moment().format('YYYY-MM');

        if (empty($('#statistics-month').val())) {
            $('#statistics-month').val(currentMonthYear);
        }
    }
}

function getSelectedMonth() {
    return new Date($('#statistics-month').val());
}

function getStatistics(date) {
    let postData = {
        "therapist_id": therapistId,
        "date": date
    }

    Post(GET_THERAPIST_STATISTICS, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            loadStatistics(res.data.data);
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getBreakTimesMin(breaks) {
    let diffMins = 0;

    if (!empty(breaks) && typeof breaks == 'object' && Object.keys(breaks).length > 0) {
        $.each(breaks, function(index, breakTime) {
            let startTime = moment(breakTime.start_time),
                endTime   = moment(breakTime.end_time);

            diffMins += endTime.diff(startTime, "minutes");
        })
    }

    return diffMins;
}

function getTotalHours(item) {
    let loginTime  = moment(item.login_time),
        logoutTime = moment(item.logout_time);

    return logoutTime.diff(loginTime, "hours");
}

function loadStatistics(data) {
    if (!empty(data) && Object.keys(data).length > 0) {
        $('#total-working-days').empty().html(data.totalWorkingDays);
        $('#total-present-days').empty().html(data.presentDays);
        $('#total-absent-days').empty().html(data.absentDays);
        $('#total-hours').empty().html(data.totalHours);
        $('#break-time-hour').empty().html(data.totalBreakHours);
        $('#total-working-hours').empty().html(data.totalWorkingHours);

        let element = $('form#form-statistics').find('#tbody-statistics'),
            tbody   = '';

        if (!empty(data.therapistData) && Object.keys(data.therapistData).length > 0) {
            $.each(data.therapistData, function(key, item) {
                let breakMinutes = getBreakTimesMin(item.breaks);

                tbody += '<tr>';
                    tbody += '<td>';
                        tbody += getDate(item.login_date);
                    tbody += '</td>';

                    tbody += '<td>';
                        tbody += getTime(item.login_time);
                    tbody += '</td>';

                    tbody += '<td>';
                        tbody += getTime(item.logout_time);
                    tbody += '</td>';

                    tbody += '<td>';
                        tbody += breakMinutes;
                    tbody += '</td>';

                    tbody += '<td>';
                        tbody += (getTotalHours(item) - (breakMinutes / 60));
                    tbody += '</td>';
                tbody += '</tr>';
            });

            element.empty().html(tbody);
        } else {
            element.empty().html('<tr class="text-center"><td colspan="6"><mark>No records found!</mark></tr>')
        }
    }
}

async function loadCities(countryId) {
    return getCities(countryId).then(
        function(response) {
            if (!response || !response.data || response.data.length <= 0) {
                // showError("No records found.");
            } else {
                let data = response.data;

                if (data.code == SUCCESS_CODE) {
                    let element = $('#cities'),
                        option  = '<option value="">Select City';
                        option += '</option>';

                    $.each(data.data.data, function(key, item) {
                        option += '<option value="' + item.id + '">';
                            option += item.name;
                        option += '</option>';
                    });

                    element.empty().html(option);
                }
            }
        }
    );
}

function fillFormData(data) {
    let form = $('#form-personal');

    $.each(data, function(field, value) {
        if (field == 'dob') {
            if (!empty(value)) {
                let dob = new Date(value);

                value = dob.getFullYear() + '-' + padSingleZero(dob.getMonth() + 1) + '-' + padSingleZero(dob.getDate());
            }
        }

        form.find('input[name="' + field + '"], select[name="' + field + '"], textarea[name="' + field + '"]').val(value);
    });
}

async function getTherapist(clearCache) {
    if (clearCache) {
        localStorage.setItem('managerTherapist', {});
    } else {
        let cachedData = JSON.parse(localStorage.getItem('managerTherapist'));

        if (cachedData != "" && cachedData != null && typeof cachedData == "object" && Object.keys(cachedData).length > 0) {
            return cachedData;
        }
    }

    let postData = {
        "id" : therapistId,
        "is_pass_shop_id" : false
    };

    return Post(GET_THERAPIST_INFO, postData, function (res) {
        if (res.data.code == 200) {
            localStorage.setItem('managerTherapist', JSON.stringify(res));

            return res;
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function savePersonal(form) {
    let formInputs = form.serializeArray(),
        postData   = {};

    $.each(formInputs, function(key, input) {
        if (input.name == 'dob') {
            input.value = new Date(input.value).getTime();
        }

        postData[input.name] = input.value;
    });

    Post(UPDATE_THERAPIST, postData, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            showSuccess(data.msg);

            loadDatas(tabPersonal, true);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function saveDocument() {
    let form       = $('form#form-document-upload'),
        formInputs = form.serializeArray(),
        formData   = new FormData(),
        fileName   = document.querySelector('#file_name');

    if (!empty(fileName)) {
        formData.append("file_name", fileName.files[0]);
    }

    $.each(formInputs, function(key, input) {
        if (input.name == 'expire_date') {
            input.value = new Date(input.value).getTime();
        }

        formData.append(input.name, input.value);
    });

    Post(THERAPIST_ADD_DOCUMENT, formData, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            closeFileUploadModal();

            showSuccess(data.msg);

            loadDatas(tabDocuments, true);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function closeFileUploadModal() {
    $(document).find('#documentsadd-modal').modal('hide');

    $(document).find('form#form-document-upload').get(0).reset();
}

function getServices(type, therapistServices)
{
    let postData = {
        "type": type
    };

    Post(SERVICES, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {

            let myArray = res.data.data,
                li      = '';

            $.each(myArray, function(i, item) {
                let checked = null;

                if (type == TYPE_MASSAGE) {
                    $.each(therapistServices.massages, function(key, massage) {
                        if (massage.service_id == item.id) {
                            checked = true;

                            return true;
                        }
                    });
                } else if (type == TYPE_THERAPY) {
                    $.each(therapistServices.therapies, function(key, therapy) {
                        if (therapy.service_id == item.id) {
                            checked = true;

                            return true;
                        }
                    });
                }

                li += '<li>';
                    li += '<input class="select-input_service" type="checkbox" name="services[]" value="' + item.id + '" data-type="' + TYPE_MASSAGE + '" ' + (checked ? "checked='true'" : "") + ' />';


                    li += '<figure><img src="' + item.image + '" alt="' + item.name + '">';
                    li += '</figure>';
                    li += '<p>';
                        li += item.name;
                    li += '</p>';
                li += '</li>';
            });

            if (type == TYPE_MASSAGE) {
                var gridServices  = $("#massages .pack-list"),
                    inputServices = gridServices.find('.select-input_service');
            } else {
                var gridServices  = $("#therapies .pack-list"),
                    inputServices = gridServices.find('.select-input_service');
            }

            gridServices.empty().append(li);

            if (type == TYPE_MASSAGE) {
                var inputServices = gridServices.find('.select-input_service');
            } else {
                var inputServices = gridServices.find('.select-input_service');
            }

            inputServices.unbind().click(function(e) {
                if (this.value != null) {
                    if (this.checked) {
                        confirm("Are you sure want to add this service ?", addService, [this.value], $(this));
                    } else {
                        confirm("Are you sure want to remove this service ?", removeService, [this.value], $(this));
                    }
                }
            });
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function addService(serviceId) {
    let formData = {};

    formData['services'] = {};

    formData['services'][0] = serviceId;

    formData['therapist_id'] = therapistId;

    Post(ADD_THERAPIST_SERVICE, formData, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            showSuccess(data.msg);

            loadDatas(tabPortfolio, true);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function removeService(serviceId) {
    let formData = {};

    formData['services'] = {};

    formData['services'][0] = serviceId;

    formData['therapist_id'] = therapistId;

    Post(REMOVE_THERAPIST_SERVICE, formData, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            showSuccess(data.msg);

            loadDatas(tabPortfolio, true);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getAvailabilities() {
    let formData = {};

    formData['date'] = convertDateInputToUTCTimestamps($('#availability-date').val());

    formData['therapist_id'] = therapistId;

    Post(GET_THERAPIST_AVAILABILITY, formData, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            let element1 = $('#availabilities-1'),
                element2 = $('#availabilities-2');

            if (!empty(data.data.Schedule) && Object.keys(data.data.Schedule).length > 0) {
                let tr1 = "",
                    tr2 = "",
                    totalRows = data.data.Schedule.length,
                    halfRowCount = parseInt(totalRows / 2);

                $.each(data.data.Schedule, function(index, schedule) {
                    let isWorking = (schedule.is_working.toLowerCase() == 'not working');

                    if ((index + 1) > halfRowCount) {
                        tr2 += "<tr class='" + (isWorking ? 'na' : '') + "'>";
                            tr2 += "<td>" + getDate(schedule.date) + "</td>";
                            tr2 += "<td>" + schedule.is_working + "</td>";
                            tr2 += "<td>" + getTime(schedule.shifts.from) + " - " + getTime(schedule.shifts.to) + "</td>";
                        tr2 += "</tr>";
                    } else {
                        tr1 += "<tr class='" + (isWorking ? 'na' : '') + "'>";
                            tr1 += "<td>" + getDate(schedule.date) + "</td>";
                            tr1 += "<td>" + schedule.is_working + "</td>";
                            tr1 += "<td>" + getTime(schedule.shifts.from) + " - " + getTime(schedule.shifts.to) + "</td>";
                        tr1 += "</tr>";
                    }

                    element1.empty().html(tr1);
                    element2.empty().html(tr2);
                });
            } else {
                element1.empty();
                element2.empty();
            }
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getRatings(filter, date) {
    filter = filter || TODAY;

    Post(GET_THERAPIST_RATING, {'therapist_id': therapistId, "filter" : filter, "date" : date}, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            let element = $('ul#rating-list'),
                li      = "";

            element.empty();

            $.each(data.data, function(key, rating) {
                li += "<li>";
                    li += rating.question;

                    li += "<div>";
                        li += '<span class="fa fa-star" id="client-rating-star-' + key + '-1"></span>';
                        li += '<span class="fa fa-star" id="client-rating-star-' + key + '-2"></span>';
                        li += '<span class="fa fa-star" id="client-rating-star-' + key + '-3"></span>';
                        li += '<span class="fa fa-star" id="client-rating-star-' + key + '-4"></span>';
                        li += '<span class="fa fa-star" id="client-rating-star-' + key + '-5"></span>';
                    li += "</div>";
                li += "</li>";

                element.append(li);

                let i = 1,
                    ratingRemainder = (rating.rate > 0) ? ((rating.rate - parseInt(rating.rate)) * 100).toFixed(2) : 0;

                for (;i <= parseInt(rating.rate);) {
                    $('#client-rating-star-' + key + '-' + i).addClass('active');
                    i++;
                }

                if (ratingRemainder >= 50) {
                    $('#client-rating-star-' + key + '-' + i).removeClass('fa-star').addClass('fa-star-half').addClass('active');
                }

                li = '';
            });
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}
