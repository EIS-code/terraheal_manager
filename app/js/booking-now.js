
import { Post, Get, searchClients, SUCCESS_CODE, ERROR_CODE, EXCEPTION_CODE } from './networkconst.js';
import { THERAPISTS, SERVICES, PREFERENCES, SESSIONS, ADD_CLIENT, ADD_NEW_BOOKING_SHOP, SEARCH_CLIENT } from './networkconst.js';

var selectedServices  = [],
    clientIds         = [],
    createBookingData = {
        'booking_type': 1,
        'special_notes': null,
        'session_id': null,
        'booking_date_time': null,
        'users': [],
        'book_platform': 1
    },
    userData          = [];

const PRESSURE_PREFERENCE = 1;
const GENDER_PREFERENCE = 2;
const AREA_PREFERENCE = 3;
const MUSCLES_PREFERENCE = 4;
const PAST_SURGERIES_PREFERENCE = 5;
const SKIN_PREFERENCE = 6;
const HEALTH_PREFERENCE = 7;
const FOCUS_AREA_PREFERENCE = 8;

$(document).ready(function () {
    getTherapists();
    getSessionTypes();
    getPreferences();

    var owlServices = initOwlServices();

    getServices(owlServices);

    $(".addGuest").on("click", function() {
        addClient();
    });

    $(".checkout").on("click", function() {
        addBooking();
    });

    $("input:radio[name='physical_condition']").change(
        function() {
            let isTrue = ($(this).val() == '1');

            $("#notes_of_injuries").prop("disabled", !(isTrue));

            if (!isTrue) {
                $("#notes_of_injuries").val("");
            }
        }
    );

    $("input:radio[name='booking_notes']").change(
        function() {
            let isTrue = ($(this).val() == '1');

            $("#special_notes").prop("disabled", !(isTrue));

            if (!isTrue) {
                $("#special_notes").val("");
            }
        }
    );

    $("#autocomplete").on("keyup", function() {
        getClients($(this).val());
    });
});

function initOwlServices() {
    let sliderElement = $('#msg-slider');

    sliderElement.trigger('destroy.owl.carousel');

    sliderElement.empty();

    return sliderElement
        .owlCarousel({
            loop:true,
            margin:0,
            nav:false,
            dots:true,
            responsive:{
                0: {
                    items: 1
                },
                600: {
                    items:1
                },
                1000: {
                    items:1
                }
            }
    });
}

function getServices(owlServices)
{
    let postData = {
        "type": 0
    }

    Post(SERVICES, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {

            var myArray = res.data.data;

            window.localStorage.removeItem('massages');
            window.localStorage.setItem('massages', JSON.stringify(myArray));

            $.each( myArray, function( i, item ) {
                
                var newListItem = "<li>" + "<input class=\"select-input_service\" type=\"checkbox\" name=\"massages[]\" value="+item.id+" data-type='0'>"+
                "<div class=\"sl-cont\">"+
                "<div class=\"th-image msg-img\">"+
                "<img src="+item.image+" alt=\"test\"/>"+
                "</div>"+
                "<span class=\"msg-name\">"+item.name+"</span>"+
                "</div>"+ "</li>";
             
                $( "#massages .grid_service" ).append( newListItem );
                
            });

            $('#massages .grid_service .select-input_service').click(function(e) { 
                if (this.value != null) {
                    if (this.checked) {
                        setSelectService(this.value, 0, owlServices);
                    } else {
                        removeSelectService(this.value, 0, owlServices);
                    }
                }
            });

        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });

    postData = {
        "type": 1
    }

    Post(SERVICES, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            var myArray = res.data.data;

            window.localStorage.removeItem('therapies');
            window.localStorage.setItem('therapies', JSON.stringify(myArray));

            $.each( myArray, function( i, item ) {
                
                var newListItem = "<li>" + "<input class=\"select-input_service\" type=\"checkbox\" name=\"therapies[" + item.id + "]\" value="+item.id+" data-type='1'>"+
                "<div class=\"sl-cont\">"+
                "<div class=\"th-image msg-img\">"+
                "<img src="+item.image+" alt=\"test\"/>"+
                "</div>"+
                "<span class=\"msg-name\">"+item.name+"</span>"+
                "</div>"+ "</li>";
             
                $( "#therapies .grid_service" ).append( newListItem );
                
            });

            $('#therapies .grid_service .select-input_service').click(function(e) {
                if (this.value != null) {
                    if (this.checked) {
                        setSelectService(this.value, 1, owlServices);
                    } else {
                        removeSelectService(this.value, 1, owlServices);
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

function getCurrentTherapist()
{
    return $(".therapist-names").find("li.active").data("id");
}

function setTherapistPriceAndName()
{
    let therapistNames = $(".therapist-names").find('li');

    $.each(therapistNames, function() {
        let self            = $(this),
            selfTherapistId = self.data('id'),
            baseElement     = self.find('.base'),
            totalPrice      = 0,
            serviceName     = "";

        $.each(selectedServices, function(therapistId, serviceInfos) {
            $.each(serviceInfos, function(key, serviceInfo) {
                if (typeof serviceInfo === typeof undefined) {
                    return false;
                }

                if (therapistId == selfTherapistId) {
                    totalPrice += serviceInfo.service_price;
                    serviceName = serviceInfo.service_name;
                }
            });
        });

        baseElement.empty();
        baseElement.html(' - ' + serviceName + ' €' + totalPrice);
    });
}

function setSelectService(service, type, owlServices)
{
    let selectedData = [],
        liHtml       = "",
        serviceId    = service;

    var therapies = JSON.parse(window.localStorage.getItem('therapies')),
        massages  = JSON.parse(window.localStorage.getItem('massages')),
        data      = type == 1 ? therapies : massages;

    $.each(data, function(key, item) {
        if (item.id == service) {
            selectedData = item;
        }
    });

    $.each(selectedData.pricing, function(i, itemPricing) {
        var price    = itemPricing.price,
            duration = 0;

        $.each(selectedData.timing, function(k, itemTiming) {
            if (itemPricing.service_timing_id == itemTiming.id) {
                duration = itemTiming.time;
            }
        });

        liHtml += "<li><input type='checkbox' name='service_prising_id[]' value='" + itemPricing.service_timing_id + "' data-service-id='" + itemPricing.service_id + "' data-price='" + price + "' class='select-input' data-type='" + type + "' /><input type='hidden' name='service_id[" + itemPricing.service_timing_id + "]' value='" + itemPricing.service_id + "' /><span class=\"durtn\">" + duration + " min</span><span class=\"line-hr\"></span><span class=\"price\"><small>&#8364;</small>" + price + "</span><label></label></li>";
    });

    var newListItem = "<div class=\"item item-" + service + "-" + type + "\">" +
                        "<div class=\"msg-right\">"+
                            "<figure>"+
                                "<img src=\"" + selectedData.image + "\" alt=\"\"/>"+
                            "</figure>"+
                            "<div class=\"ms-content\">"+
                                "<h3>" + selectedData.name + "</h3>"+
                                "<div class=\"d-flex justify-content-between\">"+
                                "<span>Duration</span>"+
                                "<span>Price</span>"+
                                "</div>"+
                                "<ul>"+
                                    liHtml
                                "</ul>"+
                            "</div>"+
                        "</div>"+
                    "</div>";

    owlServices.trigger('add.owl.carousel', [newListItem]);

    owlServices.trigger('refresh.owl.carousel');

    let index = getOwlCarouselIndex(service, type, owlServices);

    owlServices.trigger('to.owl.carousel', index);

    // Set subtotal.
    let subtotal = 0,
        serviceTimingId = 0;

    let getPrice = function(therapies, massages) {
        let checkedServices = $('.service_info').find(':input[type="checkbox"]:checked');

        subtotal = 0;

        $.each(checkedServices, function(k, service) {
            let input = $(service);

            if (input.data('type') == 1) {
                $.each(therapies, function(key, item) {
                    $.each(item.pricing, function(key, itemPricing) {
                        if (itemPricing.service_timing_id == input.val()) {
                            subtotal += itemPricing.price;

                            // serviceTimingId = itemPricing.service_timing_id;
                        }
                    });
                });
            } else {
                $.each(massages, function(key, item) {
                    $.each(item.pricing, function(key, itemPricing) {
                        if (itemPricing.service_timing_id == input.val()) {
                            subtotal += itemPricing.price;

                            // serviceTimingId = itemPricing.service_timing_id;
                        }
                    });
                });
            }
        });
    };

    let selectedServicesInfo = $('.service_info').find(':input[type="checkbox"]');
    selectedServicesInfo.unbind().on('click', function() {
        let self             = $(this),
            currentTherapist = getCurrentTherapist(),
            serviceTimingId  = self.val(),
            servicePrice     = self.data('price');

        getPrice(therapies, massages);

        if (this.checked) {
            $(".therapist-names").find("li.active").data('service-id', serviceId);
            $(".therapist-names").find("li.active").data('service-timing-id', serviceTimingId);

            if (typeof selectedServices[currentTherapist] !== typeof undefined && selectedServices[currentTherapist].length > 0) {
                showError("You can not select more than one services.");

                return false;
            }

            selectedServices[currentTherapist].push({'service_id': serviceId, 'service_timing_id': serviceTimingId, 'service_price': servicePrice, 'service_name': selectedData.name});

            self.parent('li').addClass('selected');
        } else {
            $(".therapist-names").find("li.active").data('service-id', null);
            $(".therapist-names").find("li.active").data('service-timing-id', null);

            if (typeof selectedServices[currentTherapist] !== typeof undefined) {
                $.each(selectedServices[currentTherapist], function(index, serviceInfo) {
                    if (typeof serviceInfo === typeof undefined) {
                        return false;
                    }

                    if (serviceTimingId == serviceInfo.service_timing_id && serviceId == serviceInfo.service_id) {
                        selectedServices[currentTherapist].splice(index, 1);
                    }
                });
            }

            self.parent('li').removeClass('selected');
        }

        $('.subtotal').html('');
        $('.subtotal').html(subtotal);
        $('.subtotal-value').val(subtotal);

        setTherapistPriceAndName();
    });
}

function getOwlCarouselIndex(service, type, owlServices)
{
    let slider          = owlServices.find('.owl-stage'),
        current         = slider.filter(".item-" + service + "-" + type),
        carouselIndex   = slider.index(current);

    return carouselIndex;
}

function removeSelectService(service, type, owlServices)
{
    owlServices = initOwlServices();

    $('#massages .grid_service .select-input_service').each(function(e) { 
        if (this.value != null) {
            if (this.checked) {
                setSelectService(this.value, 0, owlServices);
            }
        }
    });

    $('#therapies .grid_service .select-input_service').each(function(e) { 
        if (this.value != null) {
            if (this.checked) {
                setSelectService(this.value, 1, owlServices);
            }
        }
    });

    owlServices.trigger('to.owl.carousel', 0);
}

function activeServices()
{
    let selectedServicesInfo = $('.service_info').find(':input[type="checkbox"]'),
        currentTherapist     = getCurrentTherapist();

    $.each(selectedServicesInfo, function() {
        let self          = $(this),
            selfTimingId  = self.val(),
            selfServiceId = self.data('service-id');

        self.parent('li').removeClass('selected');
        // self.prop('checked', false);

        $.each(selectedServices, function(therapistId, serviceInfos) {
            $.each(serviceInfos, function(key, serviceInfo) {
                if (therapistId == currentTherapist && selfTimingId == serviceInfo.service_timing_id && selfServiceId == serviceInfo.service_id) {
                    // self.prop('checked', true);
                    self.parent('li').addClass('selected');
                }
            });
        });
    });
}

function getTherapists() {
    let postData = {"filter": "1"};

    Post(THERAPISTS, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {

            var myArray = res.data.data;

            $.each( myArray, function( i, item ) {
                var newListItem = "<li>" + "<input class=\"select-input\" type=\"checkbox\" name=\"therapist[]\" value=\"" + item.therapist_id + "\" data-name=\"" + item.therapist_name + "\" />"+
                "<div class=\"sl-cont\">"+
                "<span class=\"name\">"+item.therapist_name+"</span>"+
                "<div class=\"th-image\">"+
                "<img src="+item.therapist_photo+" alt=\"\"/>"+
                "</div>"+
                "<div class=\"avail\">" + getAvailableTime(item.available) + "</div>"+
                "</div>"+ "</li>";

                $( ".grid" ).append( newListItem );
            });

            $(".therapist-names").empty();

            $("input:checkbox[name='therapist[]']").on("click", function() {
                let self = $(this);

                if (self.prop('checked')) {
                    $(".therapist-names").append('<li id="name-' + (self.val()) + '" data-id="' + (self.val()) + '"><a href="#">' + (self.data('name')) + ' <span class="base"></span></a></li>');

                    if (typeof selectedServices[self.val()] === typeof undefined) {
                        selectedServices[self.val()] = [];
                    }
                } else {
                    $(".therapist-names").find('li#name-' + self.val()).remove();

                    if (typeof selectedServices[self.val()] !== typeof undefined) {
                        selectedServices.splice(self.val(), 1);
                    }
                }

                $(".therapist-names").find("li:first").addClass("active").siblings().removeClass("active");

                $(".therapist-names").find('li').unbind().on("click", function(event) {
                    event.preventDefault();

                    let therapistId = $(this).data('id');

                    $(".therapist-names").find('li').removeClass("active");

                    $(".therapist-names").find('li#name-' + therapistId).addClass("active");

                    activeServices();

                    buildClientForm();
                });
            });
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function buildFocusArea(options)
{
    if (Object.keys(options).length > 0) {
        var modelBody = $('#focusmodal').find('.modal-body'),
            modelHtml = "<div class='focus-pref'><ul class='d-flex justify-content-between flex-wrap'>";

        $.each(options, function(key, row) {
            modelHtml += "<li><input class='select-input' type='radio' name='focus_preference' value='" + row.id + "' data-name='" + row.name + "' /><div class='pf-bx'><img src='" + row.icon + "' alt='' /><span class='pf-abs'>" + row.name + "</span></div></li>";
        });

        modelHtml += "</ul></div>";

        modelBody.html("");
        modelBody.html(modelHtml);
    }

    $('input:radio[name="focus_preference"]').change(
        function() {
            if ($(this).is(':checked')) {
                $('#focus_preference').html($(this).data('name'));
            }

            $('#focusmodal').modal('hide');
        }
    );
}

function buildPressurePreferences(options)
{
    if (Object.keys(options).length > 0) {
        var elementDropdown = $('#pressure'),
            dropdownHtml    = "";

        $.each(options, function(key, row) {
            dropdownHtml += "<li><input type='radio' name='pressure_preference' value='" + row.id + "'><label>" + row.name + "</label></li>";
        });

        elementDropdown.html("");
        elementDropdown.html(dropdownHtml);
    }

    $('#pressure li').on('click', function() {
        $(this).addClass('selected').siblings().removeClass('selected');

        var getValue = $(this).text();

        $('#pLabel').text(getValue);

        $(this).parents('.dropdown').click();
    });
}

function getPreferences()
{
    let postData = {};

    Post(PREFERENCES, postData, function (res) {
        let data = res.data.data;

        if (Object.keys(data).length > 0) {
            $.each(data, function(index, preferences) {
                if (preferences.id == FOCUS_AREA_PREFERENCE) {
                    buildFocusArea(preferences.preference_options);
                } else if (preferences.id == PRESSURE_PREFERENCE) {
                    buildPressurePreferences(preferences.preference_options);
                }
            });
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getSessionTypes()
{
    let postData = {};

    Get(SESSIONS, postData, function (res) {
        let data = res.data.data;

        if (Object.keys(data).length > 0) {
            var elementDropdown = $('#sessionTabs'),
                liHtml          = "";

            $.each(data, function(key, row) {
                liHtml += "<li data-id='" + row.id + "'><a data-toggle='tab' href='#'>" + row.type + "</a><input type='radio' name='session_type' id='session_type-" + row.id + "' value='" + row.id + "'></li>";
            });

            elementDropdown.html("");
            elementDropdown.html(liHtml);

            elementDropdown.find('li').on("click", function() {
                let self      = $(this),
                    sessionId = self.data('id');

                $('#session_type-' + sessionId).prop("checked", true);
            });
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function addClient()
{
    let name      = $('#guest_name'),
        telephone = $('#guest_telephone'),
        email     = $('#guest_email'),
        gender    = $('input[name="gender"]:checked'),
        postData  = {
            "name": name.val(),
            "email": email.val(),
            "tel_number": telephone.val(),
            "gender": gender.val()
        };

    Post(ADD_CLIENT, postData, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            showSuccess(data.msg);

            let clientId = data.data.id;

            name.attr('disabled', true);
            telephone.attr('disabled', true);
            email.attr('disabled', true);
            $('input[name="gender"]').attr('disabled', true);

            /* name.val("");
            telephone.val("");
            email.val("");
            gender.prop('checked', false); */

            if (typeof userData[clientId] === typeof undefined) {
                userData[clientId] = [];
            }

            userData[clientId] = {
                'name': name.val(),
                'telephone': telephone.val(),
                'email': email.val(),
                'gender': gender.val(),
                'is_guest': true
            };

            clientIds.push(clientId);
            $('#client_id').val(JSON.stringify(clientIds));

            buildUserData(clientId);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function buildUserData(clientId)
{
    let currentTherapist = getCurrentTherapist();

    if (typeof createBookingData['users'][clientId] === typeof undefined) {
        createBookingData['users'][clientId] = [];
    }

    createBookingData['users'][clientId] = {
        'user_id': clientId,
        'pressure_preference': null,
        'focus_area_preference': null,
        'gender_preference': null,
        'therapist_id': currentTherapist,
        'notes_of_injuries': null,
        'booking_date_time': currentUTCTimestamps()
    };

    $('.therapist-names').find('li#name-'+currentTherapist).data('client-id', clientId);

    buildServices(clientId);
}

function buildServices(clientId)
{
    let currentTherapist = getCurrentTherapist();

    $.each(selectedServices[currentTherapist], function(key, serviceInfo) {
        if (typeof createBookingData['users'][clientId]['services'] === typeof undefined) {
            createBookingData['users'][clientId]['services'] = [];
        }

        createBookingData['users'][clientId]['services'] = {
            'service_id': serviceInfo.service_id,
            'service_timing_id': serviceInfo.service_timing_id
        };
    });
}

function buildClientForm()
{
    let isGuest          = ($("ul#detail-tab li a.active").attr('href') == "#guest") ? true : false,
        currentTherapist = $(".therapist-names").find("li.active"),
        clientId         = currentTherapist.data('client-id'),
        clientData       = (typeof userData[clientId] !== typeof undefined) ? userData[clientId] : [];

    if (Object.keys(clientData).length > 0) {
        isGuest = (isGuest && clientData.is_guest);

        if (isGuest) {
            $('#guest_name').val(clientData.name);
            $('#guest_telephone').val(clientData.telephone);
            $('#guest_email').val(clientData.email);
            $('.guest-data').find('input[name="gender"]').val(clientData.gender);
        } else {
            $('#autocomplete').val("");
            $('#user_name').val(clientData.name);
            $('#user_phone').val(clientData.telephone);
            $('#user_email').val(clientData.email);
        }
    } else {
        $('#guest_booking_date_time').val("");
        $('#guest_name').val("");
        $('#guest_telephone').val("");
        $('#guest_email').val("");
        $('.guest-data').find('input[name="gender"]').prop('checked', false);

        $('#user_booking_date_time').val("");
        $('#autocomplete').val("");
        $('#user_name').val("");
        $('#user_phone').val("");
        $('#user_email').val("");
    }
}

function addBooking()
{
    let formInputs      = $('.booking-form').serializeArray(),
        users           = [],
        inc             = 0,
        selectedClients = $('#client_id').val() != "" ? JSON.parse($('#client_id').val()) : [];

    $.each(formInputs, function(key, input) {
        if (input.name == 'special_notes') {
            createBookingData.special_notes = input.value;
        }

        if (input.name == 'session_type') {
            createBookingData.session_id = input.value;
        }

        createBookingData.booking_date_time = currentUTCTimestamps();

        if (input.name == 'guest_booking_date_time' && input.value != "") {
            var bookingDateTimes = +new Date(input.value);

            $.each(selectedClients, function(key, clientId) {
                createBookingData['users'][clientId]['booking_date_time'] = bookingDateTimes;
            });
        }

        if (input.name == 'user_booking_date_time' && input.value != "") {
            var bookingDateTimes = +new Date(input.value);

            $.each(selectedClients, function(key, clientId) {
                createBookingData['users'][clientId]['booking_date_time'] = bookingDateTimes;
            });
        }

        if (input.name == 'pressure_preference') {
            $.each(selectedClients, function(key, clientId) {
                createBookingData['users'][clientId]['pressure_preference'] = input.value;
            });
        }

        if (input.name == 'focus_preference') {
            $.each(selectedClients, function(key, clientId) {
                createBookingData['users'][clientId]['focus_area_preference'] = input.value;
            });
        }

        if (input.name == 'notes_of_injuries') {
            $.each(selectedClients, function(key, clientId) {
                createBookingData['users'][clientId]['notes_of_injuries'] = input.value;
            });
        }
    });

    let postDatas = filderData(createBookingData),
        postJson  = Object.assign({}, postDatas);

    Post(ADD_NEW_BOOKING_SHOP, postJson, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            showSuccess(data.msg);

            setTimeout(function() {
                window.location = "waiting-list.html";
            }, 1000);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function filderData(data)
{
    let returnData = [];

    returnData.booking_type = data.booking_type;
    returnData.special_notes = data.special_notes;
    returnData.session_id = data.session_id;
    returnData.booking_date_time = data.booking_date_time;
    returnData.book_platform = data.book_platform;
    returnData.users = [];

    let inc = 0;

    $.each(data.users, function(key, userInfo) {
        if (typeof userInfo !== typeof undefined && Object.keys(userInfo).length > 0) {
            returnData.users[inc] = {
                'user_id': userInfo.user_id,
                'pressure_preference': userInfo.pressure_preference,
                'focus_area_preference': userInfo.focus_area_preference,
                'gender_preference': userInfo.gender_preference,
                'therapist_id': userInfo.therapist_id,
                'notes_of_injuries': userInfo.notes_of_injuries,
                'booking_date_time': userInfo.booking_date_time
            };

            if (typeof userInfo.services !== typeof undefined && Object.keys(userInfo.services).length > 0) {
                returnData.users[inc].services = [];

                returnData.users[inc].services.push({
                    'service_id': userInfo.services.service_id,
                    'service_timing_id': userInfo.services.service_timing_id
                });
            }

            inc++;
        }
    });

    return returnData;
}

function getClients(searchValue)
{
    if (!searchValue) {
        return false;
    }

    searchClients(searchValue).then(
        function(response) {
            if (!response || !response.data || response.data.length <= 0) {
                // showError("No records found.");
            } else {
                let data = response.data;

                if (data.code == SUCCESS_CODE) {
                    let searchData = {};

                    $.each(data.data.data, function(k, item) {
                        searchData[item.id] = item.name + (item.surname != null && item.surname != '' ? " " + item.surname : "");
                    });

                    autoComplete(searchValue, searchData, setSelectedClient, data.data.data, clientIds);
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

function setSelectedClient(data, clientId)
{
    let selectedClientId = clientId; // $("#client_id").val();

    if (selectedClientId) {
        $.each(data, function(k, item) {
            if (item.id == selectedClientId) {
                $("#user_name").val(item.name + (item.surname != null && item.surname != '' ? " " + item.surname : ""));
                $("#user_phone").val((item.tel_number_code != '' && item.tel_number_code != null ? " " + item.tel_number_code : "") + (item.tel_number != '' && item.tel_number != null ? item.tel_number : "-"));
                $("#user_email").val(item.email);

                if (typeof userData[selectedClientId] === typeof undefined) {
                    userData[selectedClientId] = [];
                }

                userData[selectedClientId] = {
                    'name': item.name + (item.surname != null && item.surname != '' ? " " + item.surname : ""),
                    'telephone': (item.tel_number_code != '' && item.tel_number_code != null ? " " + item.tel_number_code : "") + (item.tel_number != '' && item.tel_number != null ? item.tel_number : "-"),
                    'email': (item.tel_number_code != '' && item.tel_number_code != null ? " " + item.tel_number_code : "") + (item.tel_number != '' && item.tel_number != null ? item.tel_number : "-"),
                    'is_guest': false
                };
            }
        });

        buildUserData(selectedClientId);
    }
}
