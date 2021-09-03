const BASEURL = "http://35.180.202.175";
const BASEURL_MANAGER = BASEURL + "/manager";

export const SUCCESS_CODE     = 200;
export const ERROR_CODE       = 401;
export const EXCEPTION_CODE   = 401;

export const SIGNIN = BASEURL_MANAGER + "/signIn";
export const DASHBOARD_RIGHT_SIDEBAR = BASEURL_MANAGER + "/side/data/get";
export const DASHBOARD_SALES_INSIGHTS = BASEURL_MANAGER + "/salesInfo/get";
export const DASHBOARD_GET_NEWS = BASEURL_MANAGER + "/news/get";
export const DASHBOARD_DELETE_NEWS = BASEURL_MANAGER + "/news/delete";

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

        postData['manager_id'] = managerData.id;
        postData['shop_id']    = managerData.shop_id;
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
