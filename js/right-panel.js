import { DASHBOARD_RIGHT_SIDEBAR, DASHBOARD_GET_NEWS, DASHBOARD_DELETE_NEWS } from './networkconst.js';
import { Post, redirect, SUCCESS_CODE } from './networkconst.js';

var charts = [];

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

    CKEDITOR.replace("news-descriptions", {
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
});

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
    return $('<div class="ann-mode"><div class="ann-left"><h3><label class="news-title"></label><span><i class="fas fa-clock"></i><label class="news-createdat"></label></span></h3><p class="news-details"></p></div><div class="ann-right"><ul><li><a href="#" data-toggle="modal" data-target="#medit" class="news-edit"><i class="fas fa-edit"></i></a><a href="#" class="news-delete"><i class="far fa-trash-alt"></i></a></li><li><a href="#" data-toggle="modal" data-target="#meye"><i class="fas fa-eye"></i></a><span class="an-val news-reads-total">0</span></li><li><a href="#"><i class="far fa-eye-slash"></i></a><span class="an-val news-unreads-total">0</span></li></ul></div></div>');
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


                });
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
