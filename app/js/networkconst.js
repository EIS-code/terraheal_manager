const PASSWORD_SALT = localStorage.getItem('PASSWORD_SALT');
const BASEURL = localStorage.getItem('BASEURL');
const BASEURL_MANAGER = localStorage.getItem('BASEURL_MANAGER');
const BASEURL_SHOP = localStorage.getItem('BASEURL_SHOP');

export const SUCCESS_CODE     = 200;
export const ERROR_CODE       = 401;
export const EXCEPTION_CODE   = 401;

// Manager routes
export const SIGNIN = BASEURL_MANAGER + "/signIn";
export const DASHBOARD_RIGHT_SIDEBAR = BASEURL_MANAGER + "/side/data/get";
export const DASHBOARD_SALES_INSIGHTS = BASEURL_MANAGER + "/salesInfo/get";
export const DASHBOARD_GET_NEWS = BASEURL_MANAGER + "/news/get";
export const DASHBOARD_DELETE_NEWS = BASEURL_MANAGER + "/news/delete";
export const DASHBOARD_UPDATE_NEWS = BASEURL_MANAGER + "/news/update";
export const DASHBOARD_ADD_NEWS = BASEURL_MANAGER + "/news/add";
export const DASHBOARD_NEWS_DETAILS = BASEURL_MANAGER + "/news/details/get";
export const DASHBOARD_GET_VOUCHERS = BASEURL_MANAGER + "/vouchers/get";
export const DASHBOARD_GET_PACKS = BASEURL_MANAGER + "/packs/get";
export const GET_CLIENT_DETAILS = BASEURL_MANAGER + "/clients/getClientDetails";
export const GET_CLIENT_FUTURE_BOOKINGS = BASEURL_MANAGER + "/clients/getFutureBookings";
export const GET_CLIENT_PAST_BOOKINGS = BASEURL_MANAGER + "/clients/getPastBookings";
export const GET_CLIENT_CANCELLED_BOOKINGS = BASEURL_MANAGER + "/clients/getCancelledBookings";
export const UPDATE_CLIENT_QUESTIONNAIRS = BASEURL_MANAGER + "/clients/questionnaries/update";
export const DECLINE_CLIENT_DOCUMENT = BASEURL_MANAGER + "/clients/document/decline";
export const ACCEPT_CLIENT_DOCUMENT = BASEURL_MANAGER + "/clients/document/accept";
export const UPLOAD_CLIENT_DOCUMENT = BASEURL + "/user/profile/document/upload";
export const THERAPISTS = BASEURL_MANAGER + "/therapist/get";
export const THERAPISTS_EXISTING = BASEURL_MANAGER + "/therapist/get/all";
export const GET_THERAPIST_INFO = BASEURL_MANAGER + "/therapist/getInfo";
export const ADD_THERAPIST_SERVICE = BASEURL_MANAGER + "/therapist/service/add";
export const REMOVE_THERAPIST_SERVICE = BASEURL_MANAGER + "/therapist/service/delete";
export const GET_STAFF_LIST = BASEURL_MANAGER + "/staff/list";
export const ADD_STAFF = BASEURL_MANAGER + "/staff/add";
export const UPDATE_STAFF = BASEURL_MANAGER + "/staff/update";
export const UPDATE_STAFF_STATUS = BASEURL_MANAGER + "/staff/update/status";
export const GET_THERAPIST_RATING = BASEURL_MANAGER + "/therapist/ratings/get";
export const SAVE_THERAPIST_AVAILABILITY = BASEURL_MANAGER + "/therapist/availability/add";
export const DELETE_THERAPIST_DOCUMENT = BASEURL_MANAGER + "/document/delete";
export const ADD_FORGOTTEN_OBJECT = BASEURL_MANAGER + "/clients/addForgotObject";
export const GET_FORGOTTEN_OBJECT = BASEURL_MANAGER + "/clients/getForgotObjects";
export const RETURN_FORGOTTEN_OBJECT = BASEURL_MANAGER + "/clients/returnForgotObject";
export const EMAIL_FORGOTTEN_OBJECT = BASEURL_MANAGER + "/clients/sendEmailToClient";
export const INFORM_FORGOTTEN_OBJECT_TO_CLIENT = BASEURL_MANAGER + "/clients/inform";
export const GET_UNREAD_NOTIFICATION = BASEURL_MANAGER + "/notification/unread";

// Other routes
export const ONGOING = BASEURL + "/waiting/getOngoingMassage";
export const WAITING = BASEURL + "/waiting/getWaitingMassage";
export const CONFIRM_BOOKING = BASEURL + "/waiting/confirmBooking";
export const GET_ALL_THERAPISTS = BASEURL + "/waiting/getAllTherapists";
export const GET_ROOMS = BASEURL + "/rooms/getRooms";
export const ASSIGN_ROOMS = BASEURL + "/waiting/assignRoom";
export const DOWNGRADE_BOOKING = BASEURL + "/waiting/downgradeBooking";
export const CANCEL_BOOKING = BASEURL + "/waiting/cancelAppointment";
export const END_SERVICE_TIME = BASEURL + "/waiting/endServiceTime";
export const START_SERVICE_TIME = BASEURL + "/waiting/startServiceTime";
export const PRINT_BOOKING_DETAILS = BASEURL + "/waiting/printBookingDetails";
// export const THERAPISTS = BASEURL + "/therapist/getTherapists";
export const ADD_NEW_BOOKING_SHOP = BASEURL + "/waiting/booking/add";
export const SEARCH_CLIENT = BASEURL + "/clients/searchClients";
export const SEARCH_PACKS = BASEURL + "/waiting/searchPacks";
export const FUTURE_BOOKINGS = BASEURL + "/waiting/getFutureBooking";
export const COMPLETED_BOOKINGS = BASEURL + "/waiting/getCompletedBooking";
export const CANCELED_BOOKINGS = BASEURL + "/waiting/getCancelBooking";
export const RECOVER_BOOKING = BASEURL + "/waiting/recoverAppointment";
export const BOOKING_OVERVIEW = BASEURL + "/waiting/bookingOverview";
export const ROOM_OCCUPATIONS = BASEURL + "/waiting/roomOccupation";
export const GET_RECEPTIONIST = BASEURL + "/receptionist/getReceptionist";
export const UPDATE_RECEPTIONIST = BASEURL + "/receptionist/update";
export const RECEPTIONIST_ADD_DOCUMENT = BASEURL + "/receptionist/addDocument";
export const GET_RECEPTIONIST_STATISTICS = BASEURL + "/receptionist/getStatistics";
export const GET_COUNTRIES = BASEURL + "/location/get/country";
export const GET_CITIES = BASEURL + "/location/get/city";
export const THERAPIST_ADD_NEW = BASEURL + "/therapist/new";
export const THERAPIST_ADD_NEW_EXISTING = BASEURL + "/therapist/existing";
export const ADD_CLIENT = BASEURL + "/waiting/addClient";
export const THERAPIST_TIMETABLE = BASEURL + "/waiting/getTimeTable";
export const UPDATE_THERAPIST = BASEURL + "/therapist/profile/update";
export const GET_THERAPIST_AVAILABILITY = BASEURL + "/therapist/myAvailabilities";
export const ASSIGN_THERAPIST           = BASEURL + "/waiting/assignTherapist";
export const GET_THERAPIST_ATTENDANCE = BASEURL + "/therapist/myAttendence";

// Shop routes
export const SERVICES = BASEURL_SHOP + "/getServices";
export const SESSIONS = BASEURL_SHOP + "/sessions/get";
export const PREFERENCES = BASEURL_SHOP + "/getPreferences";
export const GET_SHIFTS  = BASEURL_SHOP + "/shifts/get";
export const GET_SHOP_LOCATION  = BASEURL_SHOP + "/location/get";

const CancelToken = axios.CancelToken;

let cancel;

export async function Post(url, postData, success, errorCallBack)
{
    loggedIn();

    var headersData = {
        'Access-Control-Allow-Origin': "*",
        'Content-Type': 'application/json'
    };

    if (SIGNIN == url) {
        var axiosConfig = {
            headers: headersData
        };
    } else {
        let managerData = getLocalManagerStorage();

        // headersData['api-key'] = managerData.api_key[0].key;

        var axiosConfig = {
            headers: headersData
        };

        if (!(postData['is_pass_manager_id'] === false)) {
            postData['manager_id'] = managerData.id;
        }

        if (!(postData['is_pass_shop_id'] === false)) {
            postData['shop_id']    = managerData.shop_id;
        }

        delete postData['is_pass_manager_id'];
        delete postData['is_pass_shop_id'];
    }

    return axios.post(url, postData, axiosConfig)
        .then((res) => {
            success(res);

            return res;
        })
        .catch((err) => {
            errorCallBack(err);

            return err;
        });
}

export async function PostDocument(url, formData, success, errorCallBack)
{
    loggedIn();

    var headersData = {
        'Access-Control-Allow-Origin': "*",
        'Content-Type': 'application/json',
        'Content-Type': 'multipart/form-data'
    };

    if (SIGNIN == url) {
        var axiosConfig = {
            headers: headersData
        };
    } else {
        let managerData = getLocalManagerStorage();

        // headersData['api-key'] = managerData.api_key[0].key;

        var axiosConfig = {
            headers: headersData
        };

        formData['manager_id'] = managerData.id;
        formData['shop_id']    = managerData.shop_id;
    }

    return axios.post(url, formData, axiosConfig)
        .then((res) => {
            success(res);

            return res;
        })
        .catch((err) => {
            errorCallBack(err);

            return err;
        });
}

export async function Get(url, postData, success, errorCallBack)
{
    loggedIn();

    let managerData = getLocalManagerStorage();

    let axiosConfig = {
        headers: {
            'Access-Control-Allow-Origin': "*",
            'Content-Type': 'application/json',
            'api-key': managerData.api_key
        }
    };

    postData['manager_id'] = managerData.id;
    postData['shop_id']    = managerData.shop_id;

    return axios.get(url, postData, axiosConfig)
        .then((res) => {
            success(res);

            return res;
        })
        .catch((err) => {
            errorCallBack(err);

            return err;
        });
}

export async function getCountries(clearCache)
{
    loggedIn();

    if (clearCache) {
        localStorage.setItem('countries', {});
    } else {
        let cachedData = JSON.parse(localStorage.getItem('countries'));

        if (cachedData != "" && cachedData != null && typeof cachedData == "object" && Object.keys(cachedData).length > 0) {
            return cachedData;
        }
    }

    let managerData = getLocalManagerStorage();

    // Cancel previous request
    if (cancel !== undefined) {
        cancel();
    }

    let postData  = {
        "manager_id": managerData.id,
        "shop_id": managerData.shop_id
    };

    return  axios.get(GET_COUNTRIES, postData, {
                cancelToken: new CancelToken(function executor(c) {
                    cancel = c;
                }),
                headers: {
                    'Access-Control-Allow-Origin': "*",
                    'Content-Type': 'application/json',
                    'api-key': managerData.api_key
                }
            })
            .then((response) => {
                // Response Body

                localStorage.setItem('countries', JSON.stringify(response));

                return response;
            })
            .catch((error) => {
                if (axios.isCancel(error)) {}
            });
}

export async function getCities(countryId, provinceId)
{
    loggedIn();

    let managerData = getLocalManagerStorage();

    // Cancel previous request
    if (cancel !== undefined) {
        cancel();
    }

    let postData  = {
        "manager_id": managerData.id,
        "shop_id": managerData.shop_id,
        "country_id": countryId,
        "province_id": provinceId
    };

    return  axios.post(GET_CITIES, postData, {
                cancelToken: new CancelToken(function executor(c) {
                    cancel = c;
                }),
                headers: {
                    'Access-Control-Allow-Origin': "*",
                    'Content-Type': 'application/json',
                    'api-key': managerData.api_key
                }
            })
            .then((response) => {
                // Response Body

                return response;
            })
            .catch((error) => {
                if (axios.isCancel(error)) {}
            });
}

export async function searchClients(postData, page)
{
    loggedIn();

    let managerData = getLocalManagerStorage();

    // Cancel previous request
    if (cancel !== undefined) {
        cancel();
    }

    page = page || 1;

    postData["shop_id"]     = managerData.shop_id;
    postData["manager_id"]  = managerData.id;
    postData["page_number"] = page;

    return  axios.post(SEARCH_CLIENT, postData, {
                cancelToken: new CancelToken(function executor(c) {
                    cancel = c;
                }),
                headers: {
                    'Access-Control-Allow-Origin': "*",
                    'Content-Type': 'application/json',
                    'api-key': managerData.api_key
                }
            })
            .then((response) => {
                // Response Body

                return response;
            })
            .catch((error) => {
                if (axios.isCancel(error)) {}
            });
}

export async function getTherapists(clearCache)
{
    loggedIn();

    if (clearCache) {
        localStorage.setItem('shopTherapist', {});
    } else {
        let cachedData = JSON.parse(localStorage.getItem('shopTherapist'));

        if (cachedData != "" && cachedData != null && typeof cachedData == "object" && Object.keys(cachedData).length > 0) {
            return cachedData;
        }
    }

    let managerData = getLocalManagerStorage();

    // Cancel previous request
    if (cancel !== undefined) {
        cancel();
    }

    let postData  = {
        "shop_id": managerData.shop_id,
        "manager_id": managerData.id
    };

    return  axios.post(GET_ALL_THERAPISTS, postData, {
                cancelToken: new CancelToken(function executor(c) {
                    cancel = c;
                }),
                headers: {
                    'Access-Control-Allow-Origin': "*",
                    'Content-Type': 'application/json',
                    'api-key': managerData.api_key
                }
            })
            .then((response) => {
                // Response Body

                localStorage.setItem('shopTherapist', JSON.stringify(response));

                return response;
            })
            .catch((error) => {
                if (axios.isCancel(error)) {}
            });
}

export async function getRooms(clearCache)
{
    loggedIn();

    if (clearCache) {
        localStorage.setItem('shopRooms', {});
    } else {
        let cachedData = JSON.parse(localStorage.getItem('shopRooms'));

        if (cachedData != "" && cachedData != null && typeof cachedData == "object" && Object.keys(cachedData).length > 0) {
            return cachedData;
        }
    }

    let managerData = getLocalManagerStorage();

    // Cancel previous request
    if (cancel !== undefined) {
        cancel();
    }

    let postData  = {
        "shop_id": managerData.shop_id,
        "manager_id": managerData.id
    };

    return  axios.post(GET_ROOMS, postData, {
                cancelToken: new CancelToken(function executor(c) {
                    cancel = c;
                }),
                headers: {
                    'Access-Control-Allow-Origin': "*",
                    'Content-Type': 'application/json',
                    'api-key': managerData.api_key
                }
            })
            .then((response) => {
                // Response Body

                localStorage.setItem('shopRooms', JSON.stringify(response));

                return response;
            })
            .catch((error) => {
                if (axios.isCancel(error)) {}
            });
}

export async function updateQuestionnairs(postData)
{
    loggedIn();

    let managerData = getLocalManagerStorage();

    // Cancel previous request
    if (cancel !== undefined) {
        cancel();
    }

    postData["shop_id"]     = managerData.shop_id;
    postData["manager_id"]  = managerData.id;

    return  axios.post(UPDATE_CLIENT_QUESTIONNAIRS, postData, {
                cancelToken: new CancelToken(function executor(c) {
                    cancel = c;
                }),
                headers: {
                    'Access-Control-Allow-Origin': "*",
                    'Content-Type': 'application/json',
                    'api-key': managerData.api_key
                }
            })
            .then((response) => {
                // Response Body

                return response;
            })
            .catch((error) => {
                if (axios.isCancel(error)) {}
            });
}

export function redirect(filePath)
{
    Get(filePath, [], fileFound, fileNotFound);
}

function fileFound(res)
{
    window.location = res.config.url;
}

function fileNotFound(res)
{
    window.location = "not-found.html";
}
