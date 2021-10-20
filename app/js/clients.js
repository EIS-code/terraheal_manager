import { Post, Get, SUCCESS_CODE, ERROR_CODE, EXCEPTION_CODE } from './networkconst.js';
import { searchClients, ADD_CLIENT } from './networkconst.js';

window.addEventListener("load", function() {
    getClients({});

    $(document).find('#search-client').on("click", function() {
        let searchInput = $('#search-input').val(),
            postData = {};

        postData["search_val"] = searchInput;

        $('ul#search-alphabet').find('li').find('a').removeClass('active');
        $('ul#search-alphabet').find('li#all').find('a').addClass('active');

        getClients(postData);
    });

    $(document).find('ul#search-alphabet').find('li').on("click", function() {
        let alphabet = $(this).find('a').html(),
            postData = {};

        postData["search_val"] = alphabet;

        $('#search-input').val("");

        if (alphabet.toLowerCase() == 'all') {
            getClients({});
        } else {
            getClients(postData);
        }
    });

    $(document).find('#save-client').on("click", addClient);

    $(document).find('.filter-right-new').find('select, input').on('change', function() {
        $(document).find('ul#search-alphabet').find('li#all').click();
    });
});

function filterBookingType() {
    return $(document).find('.filter-right-new').find('#booking-type').val();
}

function filterRating() {
    return $(document).find('.filter-right-new').find('#rating').val();
}

function filterDOB() {
    let dob = $(document).find('.filter-right-new').find('#dob').val();

    dob = convertDateInputToUTCTimestamps(dob);

    dob = !empty(dob) ? dob : "";

    return dob;
}

function filterGender() {
    return $(document).find('.filter-right-new').find('#gender').val();
}

function setFilter(postData) {
    postData['booking_type'] = filterBookingType();

    postData['rating'] = filterRating();

    postData['dob'] = filterDOB();

    postData['gender'] = filterGender();

    return postData;
}

function getClients(postData, page)
{
    page = page || 1;

    // Set filter selections.
    setFilter(postData);

    searchClients(postData, page).then(
        function(response) {
            if (!response || !response.data || response.data.length <= 0) {
                showError("No records found.");
            } else {
                let data = response.data;

                if (data.code == SUCCESS_CODE) {
                    paginate(data.data, $(document).find('#pagination'), getClients, [postData]);

                    loadCLientHtml(data.data.data);
                } else {
                    showError(data.msg);
                }
            }
        },
        function(error) {
            showError("AXIOS ERROR: " + error);
        }
    );
}

function loadCLientHtml(data)
{
    let element = $('#tbody-client-list'),
        tbody   = '';

    if (empty(data) || Object.keys(data).length <= 0) {
        element.empty().html('<tr><td colspan="5" class="text-center"><mark>No records found!</mark></td></tr>');

        return false;
    }

    $.each(data, function(key, row) {
        tbody += '<tr>';

            tbody += '<td>';
                tbody += row.name + (!empty(row.surname) ? ' ' + row.surname : '');
            tbody += '</td>';

            tbody += '<td>';
                tbody += row.id;
            tbody += '</td>';

            tbody += '<td>';
                tbody += (!empty(row.email)) ? hideEmail(row.email) : '-';
            tbody += '</td>';

            tbody += '<td>';
                tbody += (!empty(row.tel_number) ? (!empty(row.tel_number_code) ? row.tel_number_code + ' ' : '') + hideMobile(row.tel_number) : '-');
            tbody += '</td>';

            tbody += '<td>';
                tbody += '<a href="client-details.html?id=' + row.id + '" class="cmn-btn">';
                    tbody += 'Details';
                tbody += '</a>';
            tbody += '</td>';

        tbody += '</tr>';
    });

    element.empty().html(tbody);
}

function addClient()
{
    let formInputs = $(document).find('#form-add-new').serializeArray(),
        postData   = {};

    $.each(formInputs, function(key, input) {
        postData[input.name] = input.value;
    });

    Post(ADD_CLIENT, postData, function (res) {
        let data = res.data;

        if (data.code == EXCEPTION_CODE) {
            showError(data.msg);
        } else {
            $('#add-new-client-modal').modal('hide');

            showSuccess(data.msg);

            $(document).find('ul#search-alphabet').find('li#all').click();

            resetForm();
        }
    }, function (error) {
        showError("AXIOS ERROR: " + error);
    });
}

function resetForm()
{
    $(document).find('#form-add-new').get(0).reset();
}
