// custom-select
$(document).ready(function() {
  $(document).on("click", "ul.prod-gram .init", function() {
    $(this).parent().find('li:not(.init)').toggle();
  });
  var allOptions = $("ul.prod-gram").children('li:not(.init)');
  $("ul.prod-gram").on("click", "li:not(.init)", function() {
    allOptions.removeClass('selected');
    $(this).addClass('selected');
    $(this).parent().children('.init').html($(this).html());
    $(this).parent().find('li:not(.init)').toggle();
  });

  var clockInterval = setInterval(function() { clock(clockInterval); }, 1000);
});


// timer 
function clock(clockInterval) {
    let clockElement = document.querySelectorAll('.clock')[0];

    if (typeof clockElement === typeof undefined) {
        clearInterval(clockInterval);

        clockInterval = 0;

        return false;
    }

    // We create a new Date object and assign it to a variable called "time".
    let time = new Date(),

    // Access the "getHours" method on the Date object with the dot accessor.
    hours = time.getHours(),

    // Access the "getMinutes" method with the dot accessor.
    minutes = time.getMinutes(),

    seconds = time.getSeconds(),

    // For UTC hours
    utcHours = time.getUTCHours(),

    // For UTC minutes
    utcMinutes = time.getUTCMinutes(),

    // For UTC seconds
    utcSeconds = time.getUTCSeconds(),

    // For UTC date
    utcYear = time.getUTCFullYear()

    // For UTC date
    utcMonth = time.getUTCMonth()

    // For UTC date
    utcDate = time.getUTCDate();

    clockElement.innerHTML = padSingleZero(hours) + ":" + padSingleZero(minutes);

    clockElement.setAttribute('title', "UTC : " + utcYear + "-" + padSingleZero(utcMonth) + "-" + padSingleZero(utcDate) + " " + padSingleZero(utcHours) + ":" + padSingleZero(utcMinutes) + ":" + padSingleZero(utcSeconds));
}

function empty(variable)
{
    return !(variable != "" && variable != null);
}

function includeJs(file, callback, args)
{
    $.getScript(file, function(){
        if (callback) {
            callback(args);
        }
    });
}

// Helper to pad single digits
function padSingleZero(number)
{
    return ('0' + number).slice(-2);
}

function currentUTCTimestamps()
{
    return +new Date();
}

function hideAllAlerts()
{
    $('.alert-primary, .alert-secondary, .alert-success, .alert-danger, .alert-warning, .alert-info, .alert-light, .alert-dark').addClass('d-none');

    $('#confirm').modal('hide');
}

function showError(errorMsg)
{
    hideAllAlerts();

    $('.alert-danger').removeClass('d-none').html(errorMsg);

    $('#alert').modal('show');
}

function showSuccess(successMsg)
{
    hideAllAlerts();

    $('.alert-success').removeClass('d-none').html(successMsg);

    $('#alert').modal('show');
}

function showConfirm(message, element)
{
    var message = (message != '' && message != null) ? message : "Are you sure ?";

    $(document).find("#confirm").find(".modal-header").find('.label').html(message);

    element.data("default", !(element.is(':checked')));

    $('#confirm').data("element", element);

    $('#confirm').modal('show');
}

function confirm(message, callback, args, element)
{
    if (typeof callback == "function") {
        showConfirm(message, element);

        $(document).find('.confirmed').unbind().on("click", function() {
            callback.apply(this, args);
        });
    }
}

function showBody()
{
    setTimeout(function() {
        $("body").fadeIn(1000);
    }, 500);
}

function getTime(unix_timestamp)
{
    var date = new Date(unix_timestamp);

    // Hours part from the timestamp
    var hours = date.getHours();

    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();

    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();

    var formattedTime = hours + ':' + minutes.substr(-2);

    return formattedTime;
}

function getDate(unixTimestamp)
{
    return moment.unix(unixTimestamp / 1000).format("DD/MM/YYYY");;
}

function getCurrentUTCTimestamps()
{
    return moment.utc().unix() * 1000;
}

function convertDateInputToUTCTimestamps(date)
{
    if (!empty(date)) {
        let localDate = moment(date),
            toUTCDate = moment.utc(date).unix();

        return toUTCDate * 1000;
    }

    return 0;
}

function isEmpty(variable)
{
    return (variable == '' || variable == null);
}

function getEnvVariable(variable)
{
    return localStorage.getItem("ENV_" + variable);
}

function isLive()
{
    let appEnv = getEnvVariable('APP_ENV');

    return (appEnv === 'prod' || appEnv === 'production');
}

function getLocalManagerStorage()
{
    let dummyData = !isLive() ? JSON.stringify({"id": 1, "shop_id": 5, "api_key": "manager1"}) : {},
        managerData  = localStorage.getItem("managerData") || dummyData;

    return (managerData) ? JSON.parse(managerData) : {};
}

function clearLocalStorage(key)
{
    localStorage.removeItem(key);
}

function getCurrentUrlFile()
{
    let url = window.location.href;

    return url ? url.split('/').pop().split('#').shift().split('?').shift().split('.').shift() : null;
}

function loggedIn()
{
    let managerData = getLocalManagerStorage();

    if (Object.keys(managerData).length <= 0) {
        doLogin();
    }
}

function doLogin()
{
    window.location.href = "index.html";
}

function doLogout()
{
    clearLocalStorage('managerData');

    doLogin();
}

function ucfirst(str) {
    return str[0].toUpperCase() + str.slice(1);
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function replaceBodyTexts() {
    let replaced,
        otherTags = $("body").find('script,link').clone(),
        htmlBody  = $("body").find('script').remove().end().find('link').remove().end().html(),
        bodyUses  = htmlBody.match(/{{(.*?)}}/g);

    $.each(bodyUses, function(index, key) {
        let langKey = /{{(.*?)}}/g.exec(key)[1],
            lang    = empty(languages[langKey]) ? ucfirst(replaceAll(langKey, "_", " ").toLowerCase()) : languages[langKey];

        htmlBody = htmlBody.replace(key, lang);
    });

    $("body").empty();
    $("body").html(htmlBody);
    otherTags.appendTo("body");
}

function replaceHeaderTexts() {
    let replaced,
        otherTags = $("head").find('script,link').clone(),
        htmlHead  = $("head").find('script').remove().end().find('link').remove().end().html(),
        headUses  = htmlHead.match(/{{(.*?)}}/g);

    $.each(headUses, function(index, key) {
        let langKey = /{{(.*?)}}/g.exec(key)[1],
            lang    = empty(languages[langKey]) ? ucfirst(replaceAll(langKey, "_", " ").toLowerCase()) : languages[langKey];

        htmlHead = htmlHead.replace(key, lang);
    });

    $("head").empty();
    $("head").html(htmlHead);
    otherTags.appendTo("head");

    replaceBodyTexts();
}


//booking next prev steps

$(function() {

	var $tabs = $('#tabs').tabs();
	
	$(".ui-tabs-panel").each(function(i){
	
	  var totalSize = $(".ui-tabs-panel").length - 1;
	
	  if (i != totalSize) {
	      next = i + 2;
   		  $(this).append("<a href='#' class='next-tab mover' rel='" + next + "'><i class='far fa-save'></i> Save</a>");
	  }
	  
	  if (i != 0) {
	      prev = i;
   		  $(this).append("<a href='#' class='prev-tab mover' rel='" + prev + "'>&#8592; Back</a>");
	  }
   		
	});
	
	$('.next-tab, .prev-tab').click(function() { 
           $tabs.tabs('select', $(this).attr("rel"));
           return false;
       });
       

});

function getUrl(urlString, param)
{
    param = param.replace(/[\[\]]/g, '\\$&');

    let regex   = new RegExp('[?&]' + param + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(urlString);

    if (!results) {
        return null;
    }

    if (!results[2]) {
        return '';
    }

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

$(document).ready(function(){
	$(".mover").click(function() {
		$('html,body').animate({                                                         
			scrollTop: $("#tabs").offset().top},
			'slow');
	});

    // custom select
    $('.dropDownMenu li.has-children > a').click(function() {
      $(this).parent().siblings().find('ul').slideUp(300);
      $(this).parent('.has-children').toggleClass('act')
      $(this).next('ul').stop(true, false, true).slideToggle(300);
      return false;
    });
    $('#pressure li').on('click', function() {
    $(this).addClass('selected').siblings().removeClass('selected');
      var getValue = $(this).text();
      $('#pLabel').text(getValue);
    });

    $('#session li').on('click', function() {
    $(this).addClass('selected').siblings().removeClass('selected');
      var getValue = $(this).text();
      $('#dLabel').text(getValue);
    });

    $('#session li').on('click', function() {
    $(this).addClass('selected').siblings().removeClass('selected');
      var getValue = $(this).text();
      $('#tLabel').text(getValue);
    });

    $('#payment li').on('click', function() {
    $(this).addClass('selected').siblings().removeClass('selected');
      var getValue = $(this).text();
      $('#pay').text(getValue);
    });


    // dropdown menu

    $('.myMenu ul li').hover(function() {
        $(this).children('ul').stop(true, false, true).slideToggle(300);
    });

    $('.table-content').scroll(function(){
        if ($(this).scrollTop() >= 10) {
           $('thead').addClass('fixed-header');
        }
        else {
           $('thead').removeClass('fixed-header');
        }
    });

    $(function () {
      $("#datepicker").datepicker({ 
            autoclose: true, 
            todayHighlight: true
      }).datepicker('update', new Date());
    });
    $(function () {
      $("#datepicker1").datepicker({ 
            autoclose: true, 
            todayHighlight: true
      }).datepicker('update', new Date());
    });

    let currentUrlFile = getCurrentUrlFile() + ".html",
        menuLis = $(".navigation").find("ul.main-menu").find("li");

    menuLis.find("a").removeClass("active");

    menuLis.each(function() {
        let self    = $(this),
            anchor  = self.find("a");

        if (anchor.attr("href") == currentUrlFile) {
            anchor.addClass("active");
        }
    });
});

$(document).ready(function(){
    $(document).find('.backlink').click(function() {
        let backFile = getUrl(window.location.href, 'backfile');

        if (!empty(backFile)) {
            window.location.href = backFile;
        } else {
            parent.history.back();
        }

        // return false;
    });

    $(document).find('#history-push').click(function() {
        let self = $(this),
            href = self.data('href');

        window.history.pushState({urlPath: '/' + href}, "", href);

        window.location.reload();
    });

    // Alerts
    $(document).find('#alert').on('hidden.bs.modal', function () {
        $('.alert-primary').html('').addClass('d-none');
        $('.alert-secondary').html('').addClass('d-none');
        $('.alert-success').html('').addClass('d-none');
        $('.alert-danger').html('').addClass('d-none');
        $('.alert-warning').html('').addClass('d-none');
        $('.alert-info').html('').addClass('d-none');
        $('.alert-light').html('').addClass('d-none');
        $('.alert-dark').html('').addClass('d-none');
    });

    // Confirms
    var triggeredElement = null;
    $(document).on('shown.bs.modal', '#confirm', function (event) {
         triggeredElement = $(event.relatedTarget);
    });

    $(document).find(".unconfirmed").on("click", function() {
        triggeredElement = $(this).parents('#confirm').data('element');

        triggeredElement.prop("checked", triggeredElement.data('default'));
    });
});

// timepicker

var input = $('#input-a');
input.clockpicker({
    autoclose: true
});

var input = $('#input-b');
input.clockpicker({
    autoclose: true
});

var input = $('#input-c');
input.clockpicker({
    autoclose: true
});

var input = $('#input-d');
input.clockpicker({
    autoclose: true
});


// delete modal textarea

$( ".others" ).click(function() {
  $( ".reason-box" ).toggle( "fast", function() {
    // Animation complete.
  });
});

var $select1 = $( '#select1' ),
		$select2 = $( '#select2' ),
    $options = $select2.find( 'div' );
    
$select1.on( 'change', function() {
	$select2.html( $options.filter( '[value="' + this.value + '"]' ) );
} ).trigger( 'change' );


// fixed header
$(window).scroll(function(){

    if ($(this).scrollTop() > 50) {

       $('.main-flex').addClass('fixed');

    } else {

       $('.main-flex').removeClass('fixed');

    }

});

$(function () {
  $("#datepicker").datepicker({ 
        autoclose: true, 
        todayHighlight: true
  }).datepicker('update', new Date());
});

/* My changes start. Jaydeep Mor */
if (typeof String.prototype.trimLeft !== "function") {
    String.prototype.trimLeft = function() {
        return this.replace(/^\s+/, "");
    };
}

if (typeof String.prototype.trimRight !== "function") {
    String.prototype.trimRight = function() {
        return this.replace(/\s+$/, "");
    };
}

if (typeof Array.prototype.map !== "function") {
    Array.prototype.map = function(callback, thisArg) {
        for (var i=0, n=this.length, a=[]; i<n; i++) {
            if (i in this) a[i] = callback.call(thisArg, this[i]);
        }
        return a;
    };
}

function getCookies() {
    var c = document.cookie, v = 0, cookies = {};
    if (document.cookie.match(/^\s*\$Version=(?:"1"|1);\s*(.*)/)) {
        c = RegExp.$1;
        v = 1;
    }
    if (v === 0) {
        c.split(/[,;]/).map(function(cookie) {
            var parts = cookie.split(/=/, 2),
                name = decodeURIComponent(parts[0].trimLeft()),
                value = parts.length > 1 ? decodeURIComponent(parts[1].trimRight()) : null;
            cookies[name] = value;
        });
    } else {
        c.match(/(?:^|\s+)([!#$%&'*+\-.0-9A-Z^`a-z|~]+)=([!#$%&'*+\-.0-9A-Z^`a-z|~]*|"(?:[\x20-\x7E\x80\xFF]|\\[\x00-\x7F])*")(?=\s*[,;]|$)/g).map(function($0, $1) {
            var name = $0,
                value = $1.charAt(0) === '"'
                          ? $1.substr(1, -1).replace(/\\(.)/g, "$1")
                          : $1;
            cookies[name] = value;
        });
    }
    return cookies;
}

function getCookie(name) {
    return getCookies()[name];
}

function setCookie(name, value, days) {
    var expires = "";

    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }

    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

/* TODO : Set cookies. */
const CURRENT_LANGUAGE = getCookie('locale') || 'en';
includeJs("locale/" + CURRENT_LANGUAGE + "/" + CURRENT_LANGUAGE + ".js");

function inWords(num, postfix) {
    let a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
        b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];

    if ((num = num.toString()).length > 9) return 'overflow';

    n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);

    if (!n) return; var str = '';

    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + (postfix ? 'crore ' : '') : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + (postfix ? 'lakh ' : '') : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + (postfix ? 'thousand ' : '') : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + (postfix ? 'hundred ' : '') : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + (postfix ? 'only ' : '') : '';

    return str;
}
