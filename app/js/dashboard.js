import { DASHBOARD_SALES_INSIGHTS } from './networkconst.js';
import { Post, redirect, SUCCESS_CODE } from './networkconst.js';

var charts = [];

window.addEventListener("load", function() {
    // Get sales insights.
    getSalesInsights();

    $(".filter-week-month").on("change", function() {
        let self  = $(this),
            value = self.val(),
            title = self.data("title");

        getSalesInsights();
    });
});

function getSalesInsights(value, title) {
    $.each(charts, function(index, chart) {
        chart.destroy();
    });

    return Post(DASHBOARD_SALES_INSIGHTS, {}, function (res) {
        if (res.data.code == SUCCESS_CODE) {
            let data = res.data.data;

            $("#total-bookings").empty().html(data.allBookings);
            $("#cancelled-bookings").empty().html(data.cancelBooking);
            $("#payment-received").empty().html(data.paymentRecevied);

            drawUpcomingAppointmentsChart(data);

            drawTodaysAppointmentsChart(data);

            drawTopMassagesChart(data);

            drawTopTherapiesChart(data);
        } else {
            showError(res.data.msg);
        }
    }, function (err) {
        showError("AXIOS ERROR: " + err);
    });
}

function drawUpcomingAppointmentsChart(resData) {
    // Arrange data.
    let centerBookings     = resData.futureBookings.centerBookings,
        homeHotelBookings  = resData.futureBookings.homeBookings;

    let xDates = [], cntCenterBookings = [], cntHomeHotelBookings = [];

    $.each(centerBookings, function(index, booking) {
        let xDate = moment(booking.booking_date).format("DD MMM");

        xDates[xDate] = xDate;

        if (empty(cntCenterBookings[xDate])) {
            cntCenterBookings[xDate] = 1;
        } else {
            cntCenterBookings[xDate] = cntCenterBookings[xDate] + 1;
        }
    });

    $.each(homeHotelBookings, function(index, booking) {
        let xDate = moment(booking.booking_date).format("DD MMM");

        xDates[xDate] = xDate;

        if (empty(cntHomeHotelBookings[xDate])) {
            cntHomeHotelBookings[xDate] = 1;
        } else {
            cntHomeHotelBookings[xDate] = cntHomeHotelBookings[xDate] + 1;
        }
    });

    // Set values to the view.
    let totalBookings = centerBookings.length + homeHotelBookings.length;

    $("#total-upcoming-appointments").empty().html(totalBookings);
    $("#total-upcoming-center").empty().html(centerBookings.length);
    $("#total-upcoming-home-hotel-center").empty().html(homeHotelBookings.length);

    const data = {
        labels: Object.values(xDates),
        datasets: [{
                label: languages.CENTER_APPOINTMENTS,
                data: Object.values(cntCenterBookings),
                borderColor: Samples.utils.transparentize(255, 159, 64, 0.5),
                backgroundColor: Samples.utils.transparentize(255, 159, 64, 0.5),
                yAxisID: 'y',
            }, {
                label: languages.HOME_HOTEL_APPOINTMENTS,
                data: Object.values(cntHomeHotelBookings),
                borderColor: Samples.utils.transparentize(255, 205, 86, 0.5),
                backgroundColor: Samples.utils.transparentize(255, 205, 86, 0.5),
                yAxisID: 'y1',
            }
        ]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            stacked: false,
            plugins: {
                title: {
                    display: false,
                    text: ''
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                        precision: 0
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    // grid line settings
                    grid: {
                        // only want the grid lines for one axis to show up
                        drawOnChartArea: false,
                    },
                    ticks: {
                        precision: 0
                    }
                },
            }
        },
    };

    charts[0] = new Chart(
        $("#upcoming-appointments"),
        config
    );
}

function drawTodaysAppointmentsChart(resData) {
    // Arrange data.
    let centerBookings     = resData.totalCenterBookings || 0,
        homeHotelBookings  = resData.totalHomeBookings || 0,
        totalBookings      = (centerBookings + homeHotelBookings) || 0;

    // Set values to the view.
    $("#total-today-appointments").empty().html(totalBookings);
    $("#total-today-center").empty().html(centerBookings);
    $("#total-today-home-hotel-center").empty().html(homeHotelBookings);

    const config = {
        type: 'doughnut',
        animation:{
            animateScale:true
        },
        data: {
            labels: totalBookings > 0 ? [languages.CENTER_APPOINTMENTS, languages.HOME_HOTEL_APPOINTMENTS] : [languages.NO_RECORD_FOUND],
            datasets: [{
                label: '',
                data: totalBookings > 0 ? [centerBookings, homeHotelBookings] : [1],
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
            cutout: 90,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let datasetData = context.raw,
                                percentage  = datasetData / totalBookings * 100;

                            return totalBookings > 0 ? percentage.toFixed(2) + "%" : languages.NO_RECORD_FOUND;
                        }
                    }
                }
            }
        },
        centerText: {
            display: true,
            text: totalBookings
        }
    };

    const centerDoughnutPlugin = {
        id: "today-appointments",
        beforeDraw: (chart) => {
            if (!empty(chart.config._config.centerText) &&
                chart.config._config.centerText.display !== null &&
                typeof chart.config._config.centerText.display !== 'undefined' &&
                chart.config._config.centerText.display) {
                drawTotals(chart);
            }
        }
    };

    // Register Doughnut Plugin
    Chart.register(centerDoughnutPlugin);

    charts[1] = new Chart(
        $("#today-appointments"),
        config
    );
}

function drawTotals(chart) {
    let width   = chart.width;
    let height  = chart.height;
    let ctx     = chart.ctx;

    ctx.restore();
    let fontSize     = (height / 200).toFixed(2);
    ctx.font         = fontSize + "em sans-serif";
    ctx.textBaseline = "middle";

    let text  = chart.config._config.centerText.text;
    let textX = Math.round((width - ctx.measureText(text).width) / 2);
    let textY = height / 1.77;

    ctx.fillText(text, textX, textY);
    ctx.save();
}

function drawTopMassagesChart(resData) {
    let topMassages   = resData.topMassages || 0,
        totalBookings = 0,
        serviceNames  = [],
        serviceCounts = [],
        tableData     = "";

    $.each(topMassages, function(index, service) {
        totalBookings += service.total;

        serviceNames.push(service.name);
        serviceCounts.push(service.total);
    });

    // Set values to the view.
    $.each(topMassages, function(index, service) {
        tableData += "<tr>";
            tableData += "<td>";
                tableData += service.name;
            tableData += "</td>";

            tableData += "<td>";
                tableData += service.total;
            tableData += "</td>";

            tableData += "<td>";
                // TODO : Set earnings
                tableData += 200;
            tableData += "</td>";

            tableData += "<td>";
                let percentage = ((service.total / totalBookings) * 100).toFixed(2);

                percentage = !isNaN(percentage) ? percentage : 0

                tableData += percentage + "%";
            tableData += "</td>";
        tableData += "</tr>";
    });
    $("#massages-table").empty().html(tableData);

    const config = {
        type: 'doughnut',
        animation:{
            animateScale:true
        },
        data: {
            labels: totalBookings > 0 ? serviceNames : [languages.NO_RECORD_FOUND],
            datasets: [{
                label: '',
                data: totalBookings > 0 ? serviceCounts : [1],
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
                            let datasetData = context.raw,
                                percentage  = datasetData / totalBookings * 100;

                            return totalBookings > 0 ? percentage.toFixed(2) + "%" : languages.NO_RECORD_FOUND;
                        }
                    }
                }
            }
        },
        centerText: {
            display: true,
            text: totalBookings
        }
    };

    const centerDoughnutPlugin = {
        id: "top-massages",
        beforeDraw: (chart) => {
            if (!empty(chart.config._config.centerText) &&
                chart.config._config.centerText.display !== null &&
                typeof chart.config._config.centerText.display !== 'undefined' &&
                chart.config._config.centerText.display) {
                drawTotals(chart);
            }
        }
    };

    // Register Doughnut Plugin
    Chart.register(centerDoughnutPlugin);

    charts[2] = new Chart(
        $("#top-massages"),
        config
    );
}

function drawTopTherapiesChart(resData) {
    let topTherapies  = resData.topTherapies || 0,
        totalBookings = 0,
        serviceNames  = [],
        serviceCounts = [],
        tableData     = "";

    $.each(topTherapies, function(index, service) {
        totalBookings += service.total;

        serviceNames.push(service.name);
        serviceCounts.push(service.total);
    });

    // Set values to the view.
    $.each(topTherapies, function(index, service) {
        tableData += "<tr>";
            tableData += "<td>";
                tableData += service.name;
            tableData += "</td>";

            tableData += "<td>";
                tableData += service.total;
            tableData += "</td>";

            tableData += "<td>";
                // TODO : Set earnings
                tableData += 200;
            tableData += "</td>";

            tableData += "<td>";
                let percentage = ((service.total / totalBookings) * 100).toFixed(2);

                percentage = !isNaN(percentage) ? percentage : 0

                tableData += percentage + "%";
            tableData += "</td>";
        tableData += "</tr>";
    });
    $("#therapies-table").empty().html(tableData);

    const config = {
        type: 'doughnut',
        animation:{
            animateScale:true
        },
        data: {
            labels: totalBookings > 0 ? serviceNames : [languages.NO_RECORD_FOUND],
            datasets: [{
                label: '',
                data: totalBookings > 0 ? serviceCounts : [1],
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
                            let datasetData = context.raw,
                                percentage  = datasetData / totalBookings * 100;

                            return totalBookings > 0 ? percentage.toFixed(2) + "%" : languages.NO_RECORD_FOUND;
                        }
                    }
                }
            }
        },
        centerText: {
            display: true,
            text: totalBookings
        }
    };

    const centerDoughnutPlugin = {
        id: "top-therapies",
        beforeDraw: (chart) => {
            if (!empty(chart.config._config.centerText) &&
                chart.config._config.centerText.display !== null &&
                typeof chart.config._config.centerText.display !== 'undefined' &&
                chart.config._config.centerText.display) {
                drawTotals(chart);
            }
        }
    };

    // Register Doughnut Plugin
    Chart.register(centerDoughnutPlugin);

    charts[3] = new Chart(
        $("#top-therapies"),
        config
    );
}
