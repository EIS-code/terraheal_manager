
import { Post, Get, PostDocument, SUCCESS_CODE, ERROR_CODE, EXCEPTION_CODE } from './networkconst.js';
import { getCountries, getCities, GET_RECEPTIONIST, UPDATE_RECEPTIONIST, GET_RECEPTIONIST_STATISTICS, RECEPTIONIST_ADD_DOCUMENT } from './networkconst.js';

var tabPersonal   = '#personal',
    tabDocuments  = '#documents',
    tabStatistics = '#statistics';

$(document).ready(function () {
    loadDatas(tabPersonal);

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
});

function loadDatas(tabName, clearCache)
{
    tabName = (tabName == "" || tabName == null) ? tabPersonal : tabName;

    $('#profile-save').addClass('d-none');

    getReceptionist(clearCache).then(
        function(response) {
            if (!response || !response.data || response.data.length <= 0) {
                // showError("No records found.");
            } else {
                let data = response.data;

                if (data.code == SUCCESS_CODE) {
                    let receptionistId = data.data.id;

                    if (tabName == tabPersonal) {
                        $('#receptionist-name').empty().html(data.data.name);

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
                                loadCities(data.data.country_id).then(
                                    function() {
                                        fillFormData(data.data);

                                        $('#profile-save').removeClass('d-none').fadeIn(200);
                                    }
                                );
                            }
                        );
                    } else if (tabName == tabDocuments) {
                        $('form#form-documents').find('input[name="receptionist_id"]').val(receptionistId);

                        $('form#form-document-upload').find('input[name="receptionist_id"]').val(receptionistId);

                        let element = $('#receptionist-documents');

                        element.empty();

                        if (!empty(data.data.documents) && Object.keys(data.data.documents).length > 0) {
                            $.each(data.data.documents, function(key, documents) {
                                let html = '<div class="grp-field">';

                                    html += '<div class="grp-lft d-flex">';
                                        html += '<label>';
                                            html += documents.document_name;
                                        html += '</label>';

                                        html += '<div class="grp-right">';
                                            html += '<ul>';
                                                html += '<li data-toggle="modal" data-target="#model">';
                                                    html += '<img src="' + documents.file_name + '" alt="' + documents.document_name + '">';
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
                                    html += '</div>';

                                html += '</div>';

                                element.append(html);
                            });
                        }
                    } else if (tabName == tabStatistics) {
                        $('form#form-statistics').find('input[name="receptionist_id"]').val(receptionistId);

                        setYearMonth(true);

                        getStatistics(receptionistId, getSelectedMonth().getTime());
                    }
                }
            }
        }
    );
}

function setYearMonth(isCurrent)
{
    if (isCurrent) {
        let currentMonthYear = moment().format('YYYY-MM');

        if (empty($('#statistics-month').val())) {
            $('#statistics-month').val(currentMonthYear);
        }
    }
}

function getSelectedMonth()
{
    return new Date($('#statistics-month').val());
}

function getStatistics(receptionistId, date)
{
    let postData = {
        "receptionist_id": receptionistId,
        "date": date
    }

    Post(GET_RECEPTIONIST_STATISTICS, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            loadStatistics(res.data.data);
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getBreakTimesMin(breaks)
{
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

function getTotalHours(item)
{
    let loginTime  = moment(item.login_time),
        logoutTime = moment(item.logout_time);

    return logoutTime.diff(loginTime, "hours");
}

function loadStatistics(data)
{
    if (!empty(data) && Object.keys(data).length > 0) {
        $('#total-working-days').empty().html(data.totalWorkingDays);
        $('#total-present-days').empty().html(data.presentDays);
        $('#total-absent-days').empty().html(data.absentDays);
        $('#total-hours').empty().html(data.totalHours);
        $('#break-time-hour').empty().html(data.totalBreakHours);
        $('#total-working-hours').empty().html(data.totalWorkingHours);

        let element = $('form#form-statistics').find('#tbody-statistics'),
            tbody   = '';

        if (!empty(data.receptionistData) && Object.keys(data.receptionistData).length > 0) {
            $.each(data.receptionistData, function(key, item) {
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

async function loadCities(countryId)
{
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

function fillFormData(data)
{
    let form = $('#form-personal');

    $.each(data, function(field, value) {
        if (field == 'dob') {
            let dob = new Date(value);

            value = dob.getFullYear() + '-' + padSingleZero(dob.getMonth() + 1) + '-' + padSingleZero(dob.getDate());
        } else if (field == 'id') {
            field = 'receptionist_id';
        }

        form.find('input[name="' + field + '"], select[name="' + field + '"], textarea[name="' + field + '"]').val(value);
    });
}

async function getReceptionist(clearCache)
{
    if (clearCache) {
        localStorage.setItem('shopReceptionist', {});
    } else {
        let cachedData = JSON.parse(localStorage.getItem('shopReceptionist'));

        if (cachedData != "" && cachedData != null && typeof cachedData == "object" && Object.keys(cachedData).length > 0) {
            return cachedData;
        }
    }

    let postData = {};

    return Post(GET_RECEPTIONIST, postData, function (res) {
        if (res.data.code == 200) {
            localStorage.setItem('shopReceptionist', JSON.stringify(res));

            return res;
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function savePersonal(form)
{
    let formInputs = form.serializeArray(),
        postData   = {};

    $.each(formInputs, function(key, input) {
        if (input.name == 'dob') {
            input.value = new Date(input.value).getTime();
        }

        postData[input.name] = input.value;
    });

    Post(UPDATE_RECEPTIONIST, postData, function (res) {
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

function saveDocument()
{
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

    Post(RECEPTIONIST_ADD_DOCUMENT, formData, function (res) {
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

function closeFileUploadModal()
{
    $(document).find('#documentsadd-modal').modal('hide');

    $(document).find('form#form-document-upload').get(0).reset();
}
