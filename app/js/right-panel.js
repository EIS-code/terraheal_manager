import { DASHBOARD_RIGHT_SIDEBAR, DASHBOARD_GET_NEWS, DASHBOARD_DELETE_NEWS, DASHBOARD_UPDATE_NEWS, DASHBOARD_ADD_NEWS, DASHBOARD_NEWS_DETAILS, DASHBOARD_GET_VOUCHERS, SEARCH_PACKS, GET_UNREAD_NOTIFICATION } from './networkconst.js';
import { Post, Get, redirect, SUCCESS_CODE } from './networkconst.js';

var charts = [], ckEditor = [];

const IS_READ = '0';
const IS_UNREAD = '1';

window.addEventListener("load", function() {
    getData();

    $(".filter-week-month").on("change", function() {
        let self  = $(this),
            value = self.val();

        getData(value);
    });

    $('#mannounce').on('show.bs.modal', function (e) {
        getNews();
    });

    $("#news-filters").on("change", getNews);

    $("#news-filters").on("change", function() {
        let self = $(this);

        if (self.val() == 7) {
            $("#news-filter-date").fadeIn(200);
        } else {
            $("#news-filter-date").fadeOut(200);
        }
    });

    $(".do-news-get").on('click', getNews);

    $("#news-update").on('click', updateNews);

    $("#news-create").on('click', createNews);

    $('#mcreate').on('show.bs.modal', function (e) {
        let self = $(this);

        self.find("#news-title-create").val("");
        self.find("#news-descriptions-create").empty();

        initCKEditor('news-descriptions-create');

        ckEditor['news-descriptions-create'].setData("");
    });

    $('#unread-news').on('click', function() {
        let self = $(this),
            newsId = self.data("id");

        getNewsDetails(newsId, IS_UNREAD);
    });

    $('#read-news').on('click', function() {
        let self = $(this),
            newsId = self.data("id");

        getNewsDetails(newsId, IS_READ);
    });

    $('#view-all-vouchers').on('click', getVouchers);

    $('#view-all-packs').on('click', function() { getPacks(1); });

    $(".notification").on("click", function() {
        $("#notify-model").modal("show");

        $(".notification").find(".counts").html(0);
    });

    getNotifications();
});

function initCKEditor(id) {
    if (ckEditor[id]) {
        ckEditor[id].destroy();
    }

    ckEditor[id] = CKEDITOR.replace(id, {
        toolbarGroups: [
            {
                "name": "basicstyles",
                "groups": ["basicstyles"]
            },
            {
                "name": "paragraph",
                "groups": ["list"]
            }
        ],
        // Remove the redundant buttons from toolbar groups defined above.
        removeButtons: 'Strike,Subscript,Superscript,Anchor,Styles,Specialchar,PasteFromWord'
    });
}

function deleteNews(newsId) {
    return Post(DASHBOARD_DELETE_NEWS, {"news_id": newsId}, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            showSuccess(res.data.msg);

            getNews();
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getNewsFilter() {
    return $("#news-filters").val() || 0;
}

function getFilterCustomDate(filter) {
    return ((filter == 7) ? convertDateInputToUTCTimestamps($("#news-filter-date-input").val()) : 0) || 0;
}

function getNewsHtml() {
    return $('<div class="ann-mode"><div class="ann-left"><h3><label class="news-title"></label><span><i class="fas fa-clock"></i><label class="news-createdat"></label></span></h3><p class="news-details"></p></div><div class="ann-right"><ul><li><a href="#" data-toggle="modal" data-target="#medit" class="news-edit"><i class="fas fa-edit"></i></a><a href="#" class="news-delete"><i class="far fa-trash-alt"></i></a></li><li><a href="#" class="meye" data-filter="0"><i class="fas fa-eye"></i></a><span class="an-val news-reads-total">0</span></li><li><a href="#" class="meye" data-filter="1"><i class="far fa-eye-slash"></i></a><span class="an-val news-unreads-total">0</span></li></ul></div></div>');
}

function getNews() {
    let filter = getNewsFilter(),
        date   = getFilterCustomDate(filter),
        formParams = {"filter": (filter == 7 && empty(date)) ? 0 : filter, "date": date};

    return Post(DASHBOARD_GET_NEWS, formParams, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            $("#news-listing").empty();

            let data = res.data.data;

            if (Object.values(data).length > 0) {
                $.each(data, function(index, row) {
                    let html = getNewsHtml();

                    html.find(".news-title").empty().html(row.title);
                    html.find(".news-createdat").empty().html(getDate(row.created_at));
                    html.find(".news-details").empty().html(row.description);
                    html.find(".news-reads-total").empty().html(row.read);
                    html.find(".news-unreads-total").empty().html(row.unread);
                    html.find(".news-delete").data("id", row.id);
                    html.find(".news-edit").data("id", row.id);
                    html.find(".meye").data("id", row.id);

                    $("#news-listing").append(html);
                });

                $(".news-delete").unbind().on("click", function() {
                    let self = $(this),
                        newsId = self.data("id");

                    confirm(languages.ARE_YOU_SURE, deleteNews, [newsId], self);
                });

                $(".news-edit").unbind().on("click", function() {
                    let self = $(this),
                        newsId = self.data("id");

                    $("#news-title").val("");
                    $("#news-descriptions").empty();

                    $.each(data, function(index, row) {
                        if (row.id == newsId) {
                            $("#news-update").data("id", row.id);

                            $("#news-title").val(row.title);
                            $("#news-descriptions").empty().html(row.description);

                            initCKEditor("news-descriptions");

                            ckEditor["news-descriptions"].setData(row.description);
                        }
                    });
                });

                $(".meye").unbind().on("click", function() {
                    let self = $(this),
                        newsId = self.data("id"),
                        filter = self.data("filter"),
                        newsTab = null;

                    let newsTabUnread = $("#unread-news"),
                        newsTabRead = $("#read-news");

                    if (filter == IS_UNREAD) {
                        newsTab = newsTabUnread;
                    } else {
                        newsTab = newsTabRead;
                    }

                    if (!empty(newsTab)) {
                        newsTabUnread.data("id", newsId);
                        newsTabRead.data("id", newsId);
                        newsTab.click();
                    }
                });
            }
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function updateNews() {
    let newsId = $(this).data("id"),
        newsTitle = $("#news-title").val(),
        description = ckEditor["news-descriptions"].getData();

    return Post(DASHBOARD_UPDATE_NEWS, {"news_id": newsId, "title": newsTitle, "description": description}, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            showSuccess(res.data.msg);

            $('#medit').modal('hide');

            getNews();
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function createNews() {
    let newsTitle = $("#news-title-create").val(),
        description = ckEditor["news-descriptions-create"].getData();

    return Post(DASHBOARD_ADD_NEWS, {"title": newsTitle, "description": description}, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            showSuccess(res.data.msg);

            $('#mcreate').modal('hide');

            getNews();
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getReadUnreadTherapistHtml() {
    return $('<li><div class="sl-cont"><div class="th-image"><img class="profile-image" alt="" /></div><span class="name"></span></div></li>');
}

function getNewsDetails(newsId, filter) {
    filter = filter || IS_READ;

    return Post(DASHBOARD_NEWS_DETAILS, {"news_id": newsId, "filter" : filter}, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            let data = res.data.data;

            if (!empty(data) && Object.values(data).length > 0) {
                // Append news info.
                let html = getNewsHtml(),
                    htmlElement = null,
                    therapistHtmlElement = null;

                if (filter == IS_UNREAD) {
                    htmlElement = $("#unread").find("#news-listing-show");
                    therapistHtmlElement = $("#unread").find("#read-unread-therapists");
                } else {
                    htmlElement = $("#read").find("#news-listing-show");
                    therapistHtmlElement = $("#read").find("#read-unread-therapists");
                }

                htmlElement.empty();
                if (!empty(htmlElement)) {
                    html.find(".news-title").empty().html(data.title);
                    html.find(".news-createdat").empty().html(getDate(data.created_at));
                    html.find(".news-details").empty().html(data.description);
                    html.find(".news-reads-total").remove();
                    html.find(".news-unreads-total").remove();
                    html.find(".news-delete").remove();
                    html.find(".news-edit").remove();
                    html.find(".meye").remove();

                    htmlElement.append(html);
                }

                // Append therapists info.
                therapistHtmlElement.empty();
                if (!empty(therapistHtmlElement) && !empty(data.therapists) && Object.values(data.therapists).length > 0) {
                    $.each(data.therapists, function(key, row) {
                        let html = getReadUnreadTherapistHtml();

                        html.find(".profile-image").attr("src", row.profile_photo);
                        html.find(".name").empty().html(row.therapist_name);

                        therapistHtmlElement.append(html);
                    });
                }

                // Show modal.
                $("#meye").modal("show");
            }
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getData(filter) {
    filter = filter || 0;

    getOtherInfos(filter);
}

function getOtherInfos(filter) {
    $.each(charts, function(index, chart) {
        chart.destroy();
    });

    // Massages, Therapies, Vouchers & Packs.
    return Post(DASHBOARD_RIGHT_SIDEBAR, {"filter": filter}, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            let data = res.data.data;

            $("#news-count").empty().html(data.news);
            $("#massages-count").empty().html(data.massages);
            $("#therapies-count").empty().html(data.therapies);
            $("#vouchers-count").empty().html(data.vouchers);
            $("#packs-count").empty().html(data.packs);

            drawReviewsChart(data, filter);
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function drawReviewsChart(resData, filter) {
    // Arrange data.
    let oldReviews     = parseInt(resData.reviews) || 0,
        currentReviews = parseInt(resData.current_reviews) || 0,
        totalReviews   = (parseInt(oldReviews) + parseInt(currentReviews)) || 0;

    // Set values to the view.
    $("#last-week-reviews").empty().html(oldReviews + "%");

    $("#label-last-week").fadeOut(200);
    $("#label-last-month").fadeOut(200);
    if (filter == 0) {
        $("#label-last-week").fadeIn(200);
    } else {
        $("#label-last-month").fadeIn(200);
    }

    // Set center emoji.
    let percentage   = 100,
        division     = 5,
        divisionPart = (percentage / division);

    const PART = divisionPart;

    var output = 0;

    for (let d = 1; d <= division; d++) {
        let start = (divisionPart - PART) + 1;

        if (currentReviews >= start && currentReviews <= divisionPart) {
            output = inWords((divisionPart / (percentage / division)), false).trim();

            break;
        }

        divisionPart = divisionPart + PART;
    }

    if (!empty(output)) {
        $("#reviews-graph-div").addClass(output + "-star");
    }

    const config = {
        type: 'doughnut',
        animation:{
            animateScale:true
        },
        data: {
            labels: totalReviews > 0 ? [languages.LAST_SEVEN_DAYS_REVIEWS] : [languages.NO_RECORD_FOUND],
            datasets: [{
                label: '',
                data: totalReviews > 0 ? [currentReviews, (currentReviews - 100)] : [1],
                backgroundColor: Object.values(window.chartColors)
            }]
        },
        options: {
            responsive: true,
            aspectRatio: 2,
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                }
            },
            cutout: 60,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let datasetData = parseInt(context.raw);

                            return totalReviews > 0 ? datasetData.toFixed(2) + "%" : languages.NO_RECORD_FOUND;
                        }
                    },
                    filter: function (context) {
                        let datasetData = parseInt(context.raw);

                        return (datasetData >= 0);
                    }
                }
            }
        },
        centerTexts: {
            display: true,
            text: currentReviews + "%"
        }
    };

    const centerDoughnutPlugin = {
        id: "total-reviews",
        beforeDraw: (chart) => {
            if (!empty(chart.config._config.centerTexts) &&
                chart.config._config.centerTexts.display !== null &&
                typeof chart.config._config.centerTexts.display !== 'undefined' &&
                chart.config._config.centerTexts.display) {
                drawTotals(chart, output);
            }
        }
    };

    // Register Doughnut Plugin
    Chart.register(centerDoughnutPlugin);

    charts[0] = new Chart(
        $("#total-reviews"),
        config
    );
}

function drawTotals(chart, output) {
    let width   = chart.width;
    let height  = chart.height;
    let ctx     = chart.ctx;

    ctx.restore();
    let fontSize     = (height / 200).toFixed(2);
    ctx.font         = fontSize + "em sans-serif";
    ctx.textBaseline = "middle";

    let text  = chart.config._config.centerTexts.text;
    let textX = Math.round((width - ctx.measureText(text).width) / 2);
    let textY = (!empty(output)) ? 140 : (height / 1.77);

    ctx.fillText(text, textX, textY);
    ctx.save();
}

function getVoucherListHtml() {
    return $('<tr><td class="numbers"></td><td class="date"></td><td class="total-value"></td><td class="expiry-date"></td></tr>');
}

function getVouchers() {
    return Post(DASHBOARD_GET_VOUCHERS, {}, function (res) {
        $('#tbody-vouchers').empty();

        if (res.data.code == SUCCESS_CODE) {
            let data = res.data.data;

            if (!empty(data) && Object.values(data).length > 0) {
                $('#count-vouchers').empty().html(data.length);

                $('#table-vouchers').DataTable().clear();
                $('#table-vouchers').DataTable().destroy();

                $.each(data, function(key, row) {
                    let html = getVoucherListHtml();

                    html.find('.numbers').html(row.number);
                    html.find('.date').html(getDate(row.created_at));
                    html.find('.total-value').html(row.price);
                    html.find('.expiry-date').html(getDate(row.expired_date));

                    $('#tbody-vouchers').append(html);
                });

                $('#table-vouchers').DataTable({
                    "searching": false,
                    "info": false,
                    "lengthChange": false,
                    "columnDefs": [
                        {orderable: false, targets: 0},
                        {orderable: true, className: 'reorder', targets: 1},
                        {orderable: false, targets: 2},
                        {orderable: true, className: 'reorder', targets: 3}
                    ]
                });

                $('#modal-vouchers').modal('show');
            }
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getPacks(page) {
    page = page || 1;

    return Post(SEARCH_PACKS, {"page_number" : page}, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            let data = res.data.data,
                element = $('#ul-pack-list');

            if (!empty(data) && Object.keys(data).length > 0 && !empty(data.data) && Object.keys(data.data).length) {
                $('#count-packs').empty().html(data.data.length);

                paginate(data, $(document).find('#pagination'), getPacks, []);

                if (element) {
                    let ul = '';

                    $.each(data.data, function(key, item) {
                        ul += '<li>';
                            ul += '<figure>';
                                ul += '<img src="' + item.image + '" alt="' + item.image + '" />';
                            ul += '</figure>';

                            ul += '<p>';
                                ul += '<a href="#" data-toggle="modal" data-target="#">';
                                    ul += item.name;

                                    ul += '<br />';

                                    ul += item.sub_title;
                                ul += '</a>';
                            ul += '</p>';

                            ul += '<div class="prc">';
                                ul += item.pack_price;
                            ul += '</div>';
                        ul += '</li>';
                    });

                    element.empty().html(ul);

                    $('#modal-packs').modal('show');
                }
            } else if (element) {
                showError(languages.NO_RECORD_FOUND);

                element.empty().html('');
            }
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function getNotifications() {
    return Get(GET_UNREAD_NOTIFICATION, {}, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            let data = res.data.data;

            appendNotification(data);
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function appendNotification(datas) {
    let li = "";

    $.each(datas, function(index, data) {
        let createdAt = JSON.parse(data.payload);

        li += '<li>';
            li += '<figure><img src="images/placeholder.png" alt="notify"></figure>';

            li += '<p>' + data.title + '<p>';

            li += '<span class="note-date">';
                li += getDate(createdAt.date);
            li += '</span>';
        li += '</li>';
    });

    $(document).find("#notification-list").append(li);
}
