import { Post, Get, SUCCESS_CODE, ERROR_CODE, EXCEPTION_CODE } from './networkconst.js';
import { GET_STAFF_LIST, ADD_STAFF, getCountries, getCities, UPDATE_STAFF, UPDATE_STAFF_STATUS } from './networkconst.js';

var staffData = {};

window.addEventListener("load", function() {
    getStaffs({});

    $('#search-staff').on('click', function() {
        let self = $('#search-text');

        getStaffs({"search_val" : self.val()});
    });

    $('#staff-form').find('input[type="checkbox"][name^="schedule"]').on('click', function() {
        let self = $(this);

        if (!self.prop('checked')) {
            self.parents('tr').find('input[type="time"]').val("");
        }

        self.parents('tr').find('input[type="time"]').attr('readonly', !self.prop('checked'));
    });

    $('#staff-form').find('input[type="checkbox"][name^="schedule"]').each(function() {
        let self    = $(this),
            isClick = false;

        self.parents('tr').find('input[type="time"]').each(function() {
            if (!empty($(this).val())) {
                isClick = true;

                return false;
            }
        });

        if (isClick) {
            self.click();
        }

        return true;
    });

    $('#staff-form').find('#pay_scale_0').on('click', function() {
        $('#amount_0').attr('disabled', false);
        $('#amount_1').attr('disabled', true);
        $('#amount_1').val('');
    });

    $('#staff-form').find('#pay_scale_1').on('click', function() {
        $('#amount_1').attr('disabled', false);
        $('#amount_0').attr('disabled', true);
        $('#amount_0').val('');
    });

    /* let payScale0 = $('#staff-form').find('#amount_0').val(),
        payScale1 = $('#staff-form').find('#amount_1').val();

    if (!empty(payScale0)) {
        $('#staff-form').find('#pay_scale_0').click();
    }

    if (!empty(payScale1)) {
        $('#staff-form').find('#pay_scale_1').click();
    } */

    $('#staff-save').on('click', saveStaff);

    $('#updatestaff-modal').on("hidden.bs.modal", function () {
        $('#staff-form').get(0).reset();
    });

    $('#add-staff').on('click', function() {
        let form = $('#staff-form');

        form.find('#staff-save').data('is-update', false);

        $('#updatestaff-modal').modal('show');
    });

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
    );

    $('#countries').on('change', function() {
        if (!empty($(this).val())) {
            loadCities($(this).val());
        } else {
            $('#cities').empty().html('<option value="">Select City</option>');
        }
    });
});

function getStaffs(postData) {
    return Post(GET_STAFF_LIST, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            let staffs  = res.data.data,
                element = $('#tbody-staff');

            element.empty();

            if (!empty(staffs) && Object.keys(staffs).length > 0) {
                $.each(staffs, function(index, staff) {
                    staffData[staff.id] = staff;

                    let tableTr = "";

                    tableTr += '<tr>';
                        tableTr += '<td>';
                            tableTr += staff.full_name || '-';
                        tableTr += '</td>';

                        tableTr += '<td>';
                            tableTr += staff.mobile_number || '-';
                        tableTr += '</td>';

                        tableTr += '<td>';
                            tableTr += staff.email || '-';
                        tableTr += '</td>';

                        tableTr += '<td>';
                            tableTr += staff.login_access || '-';
                        tableTr += '</td>';

                        tableTr += '<td>';
                            tableTr += '<div class="ph-radio small">';
                                tableTr += '<ul>';
                                    tableTr += '<li>';
                                        tableTr += '<input type="checkbox" ' + (staff.status == 'Active' ? 'checked=""' : '') + ' class="update-status" data-id="' + staff.id + '" />';
                                        tableTr += '<label>' + (staff.status || '-') + '</label>';
                                    tableTr += '</li>';
                                tableTr += '</ul>';
                            tableTr += '</div>';
                        tableTr += '</td>';

                        tableTr += '<td>';
                            tableTr += '<a href="#" class="update-staff" data-id="' + staff.id + '">';
                                tableTr += '<i class="fa fa-edit"></i>';
                            tableTr += '</a>';
                        tableTr += '</td>';
                    tableTr += '</tr>';

                    element.append(tableTr).hide().fadeIn(200);
                });

                $('.update-staff').unbind().on('click', function() {
                    let self    = $(this),
                        form    = $('#staff-form'),
                        staffId = self.data('id');

                    if (!empty(staffData[staffId]) && Object.keys(staffData[staffId]).length > 0) {
                        let appendFormValues = function() {
                            $.each(staffData[staffId], function(name, value) {
                                if (name == 'gender') {
                                    value = (value == 'Male') ? 'm' : (value == 'Female' ? 'f' : '');

                                    form.find('select[name="' + name + '"]').val(value);
                                } else if (name == 'dob') {
                                    value = getDate(value, 'YYYY-MM-DD');

                                    form.find('input[name="' + name + '"]').val(value);
                                } else if (name == 'role') {
                                    value = (value == 'Receptionist') ? '0' : '1';

                                    form.find('select[name="' + name + '"]').val(value);
                                } else if (name == 'country_id') {
                                    form.find('select[name="' + name + '"]').val(value);
                                } else if (name == 'city_id') {
                                    form.find('select[name="' + name + '"]').val(value);
                                } else if (name == 'pay_scale') {
                                    if (value == 'Fixed monthly') {
                                        form.find('#pay_scale_0').click();
                                    } else if (value == 'Fixed hourly') {
                                        form.find('#pay_scale_1').click();
                                    }
                                } else if (name == 'schedule') {
                                    if (!empty(value) && Object.keys(value).length > 0) {
                                        $.each(value, function(index, schedule) {
                                            let day = getAllDays().indexOf(schedule.day_name);

                                            form.find('.schedule').find('input[name="schedule[' + day + '][day_name]"]').click();
                                            form.find('.schedule').find('input[name="schedule[' + day + '][start_time]"]').val(getDate(schedule.start_time, 'HH:mm'));
                                            form.find('.schedule').find('input[name="schedule[' + day + '][end_time]"]').val(getDate(schedule.end_time, 'HH:mm'));
                                        });
                                    }
                                } else if (name != 'amount') {
                                    form.find('input[name="' + name + '"]').val(value);
                                }
                            });
                        };

                        if (!empty(staffData[staffId].amount)) {
                            form.find('input[name="amount"]').val(staffData[staffId].amount);
                        }

                        if (!empty(staffData[staffId].country_id)) {
                            loadCities(staffData[staffId].country_id).then(function() {
                                appendFormValues();
                            });
                        } else {
                            appendFormValues();
                        }

                        form.find('#staff-save').data('is-update', true);
                        form.find('#staff-save').data('id', staffId);

                        $('#updatestaff-modal').modal('show');
                    }
                });

                $('.update-status').unbind().on('click', function() {
                    let self    = $(this),
                        staffId = self.data('id'),
                        status  = self.prop('checked') ? '1' : '0';

                    confirm("Are you sure ?", updateStatus, [staffId, status], $(this));
                });
            } else {
                element.append('<tr><td colspan="6">No record found!</td></tr>').hide().fadeIn(200);
            }
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function saveStaff() {
    let form       = $('#staff-form'),
        formInputs = form.serializeObject(),
        postData   = {},
        isUpdate   = form.find('#staff-save').data('is-update'),
        apiName    = isUpdate ? UPDATE_STAFF : ADD_STAFF;

    $.each(formInputs, function(name, value) {
        if (name == 'dob') {
            value = convertDateInputToUTCTimestamps(value);
        }

        if (!empty(value) && name == 'schedule' && Object.keys(value).length > 0) {
            postData[name] = [];

            $.each(value, function(key, input) {
                if (!empty(input.start_time) && !empty(input.end_time)) {
                    postData[name].push({"day_name": key, "start_time": convertTimeInputToUTCTimestamps(input.start_time), "end_time": convertTimeInputToUTCTimestamps(input.end_time)});
                }
            });
        } else {
            postData[name] = value;
        }
    });

    if (isUpdate) {
        postData['staff_id'] = form.find('#staff-save').data('id');
    }

    return Post(apiName, postData, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            showSuccess(data.msg);

            form.get(0).reset();

            $('#updatestaff-modal').modal('hide');

            getStaffs({});
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
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

function updateStatus(staffId, status) {
    return Post(UPDATE_STAFF_STATUS, {"id" : staffId, "status" : status}, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            showSuccess(data.msg);

            getStaffs({});
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}
