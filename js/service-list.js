
import { Post, Get, SUCCESS_CODE, ERROR_CODE, EXCEPTION_CODE } from './networkconst.js';
import { SERVICES } from './networkconst.js';

const TYPE_MASSAGE = '0';
const TYPE_THERAPY = '1';
const DEFAULT_TYPE = '#massages';

$(document).ready(function () {
    loadTab();

    var owlServices = initOwlServices();

    getServices(owlServices);
});

function loadTab()
{
    let currentHash = window.location.hash || DEFAULT_TYPE;

    $(document).find('ul#service-tabs').find('a[href="' + currentHash + '"]').click();
}

function initOwlServices() {
    let sliderElement = $('#service-slider');

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

function getOwlCarouselIndex(service, type, owlServices)
{
    let slider          = owlServices.find('.owl-stage'),
        current         = slider.filter(".item-" + service + "-" + type),
        carouselIndex   = slider.index(current);

    return carouselIndex;
}

function setSelectService(service, type, owlServices)
{
    let selectedData = [],
        liHtml       = "";

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
            if (itemPricing.massage_timing_id == itemTiming.id) {
                duration = itemTiming.time;
            }
        });

        if (type == 1) {
            liHtml += "<li><input type='checkbox' name='therapy_prising_id[]' value='" + itemPricing.id + "' class='select-input' data-type='" + type + "' /><span class=\"durtn\">" + duration + " min</span><span class=\"line-hr\"></span><span class=\"price\"><small>&#8364;</small>" + price + "</span></li>";
        } else {
            liHtml += "<li><input type='checkbox' name='massage_prising_id[]' value='" + itemPricing.id + "' class='select-input' data-type='" + type + "' /><span class=\"durtn\">" + duration + " min</span><span class=\"line-hr\"></span><span class=\"price\"><small>&#8364;</small>" + price + "</span></li>";
        }
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
    let subtotal = 0;

    let getPrice = function(therapies, massages) {
        let checkedServices = $('.service_info').find(':input[type="checkbox"]:checked');

        subtotal = 0;

        $.each(checkedServices, function(k, service) {
            let input = $(service);

            if (input.data('type') == 1) {
                $.each(therapies, function(key, item) {
                    $.each(item.pricing, function(key, itemPricing) {
                        if (itemPricing.id == input.val()) {
                            subtotal += itemPricing.price;
                        }
                    });
                });
            } else {
                $.each(massages, function(key, item) {
                    $.each(item.pricing, function(key, itemPricing) {
                        if (itemPricing.id == input.val()) {
                            subtotal += itemPricing.price;
                        }
                    });
                });
            }
        });
    };

    let selectedServices = $('.service_info').find(':input[type="checkbox"]');
    selectedServices.on('click', function() {
        let self = $(this);

        if (self.prop('checked')) {
            self.parent('li').addClass('selected');
        } else {
            self.parent('li').removeClass('selected');
        }

        getPrice(therapies, massages);

        $('.subtotal').html('');
        $('.subtotal').html(subtotal);
        $('.subtotal-value').val(subtotal);
    });
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

function getServices(owlServices)
{
    let postData = {
        "type": TYPE_MASSAGE
    };

    Post(SERVICES, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {

            let myArray = res.data.data,
                li      = '';

            window.localStorage.removeItem('massages');
            window.localStorage.setItem('massages', JSON.stringify(myArray));

            $.each(myArray, function( i, item ) {
                li += '<li>';
                    li += '<input class="select-input_service" type="checkbox" name="massages[]" value="' + item.id + '" data-type="' + TYPE_MASSAGE + '" />';

                    li += '<div class="sl-cont">';
                        li += '<div class="th-image msg-img">';
                            li += '<img src="' + item.image + '" alt="' + item.image + '"/>';
                        li += '</div>';

                        li += '<span class="msg-name">';
                            li += item.name;
                        li += '</span>';
                    li += '</div>';
                li += '</li>';
            });

            $("#massages .grid_service").empty().append(li);

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
        console.log("AXIOS ERROR: ", err);
    });

    postData = {
        "type": TYPE_THERAPY
    };

    Post(SERVICES, postData, function (res) {
        if (res.data.code == SUCCESS_CODE) {

            var myArray = res.data.data,
                li      = '';

            window.localStorage.removeItem('therapies');
            window.localStorage.setItem('therapies', JSON.stringify(myArray));

            $.each(myArray, function(i, item) {
                li += '<li>';
                    li += '<input class="select-input_service" type="checkbox" name="therapies[]" value="' + item.id + '" data-type="' + TYPE_THERAPY + '" />';

                    li += '<div class="sl-cont">';
                        li += '<div class="th-image msg-img">';
                            li += '<img src="' + item.image + '" alt="' + item.image + '"/>';
                        li += '</div>';

                        li += '<span class="msg-name">';
                            li += item.name;
                        li += '</span>';
                    li += '</div>';
                li += '</li>';
            });

            $("#therapies .grid_service").empty().append(li);

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
        console.log("AXIOS ERROR: ", err);
    });
}
