var express = require('express');
var router = express.Router();

var request = require('request');
var zlib = require('zlib');

var geocoder = require('offline-geocoder')({ database: 'data/geodata.db' });

// ubike info processing

var ubike_json = null;

function ubikeRequest(times) {
    if (times <= 0) {
        ubike_json = null;
        return;
    }

    var options = {
        followAllRedirects: true,
        timeout: 10000,
        url: 'http://data.taipei/youbike',
        headers: {
            'X-some-headers' : 'Express123',
            'Accept-Encoding': 'gzip, deflate',
        },
        encoding: null
    };

    request.get(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var encoding = response.headers['content-encoding']
            if (encoding && encoding.indexOf('gzip') >= 0) {
                zlib.gunzip(body, function(err, dezipped) {
                    ubike_json = JSON.parse(dezipped.toString('utf-8'));
                    return;
                });
            }
            ubikeRequest(times - 1);
        } else {
            ubikeRequest(times - 1);
        }
    });
}

function ubikeInterrupt() {
    ubikeRequest(4);
    setTimeout(ubikeInterrupt, 60*1000);
}

ubikeRequest(4);
setTimeout(ubikeInterrupt, 60*1000);

// restful api & misc

function calcNearestStation(lat, lng) {
    var candidate_list = [];

    if (ubike_json === null || !ubike_json["retVal"]) {
        return undefined;
    }

    for(var key in ubike_json["retVal"]){
        if (!ubike_json["retVal"][key]["sbi"] || ubike_json["retVal"][key]["sbi"] <= 0) {
            continue;
        }

        var candidate = {};

        var sta_lat = ubike_json["retVal"][key]["lat"];
        var sta_lng = ubike_json["retVal"][key]["lng"];
        if (isNaN(sta_lat) || isNaN(sta_lng)) {
            continue;
        }
        sta_lat = parseFloat(sta_lat);
        sta_lng = parseFloat(sta_lng);

        // delete the sqrt calculation to accelerate
        candidate[key] = Math.pow(sta_lat - lat ,2) + Math.pow(sta_lng - lng ,2);
        candidate_list.push(candidate);
    }

    if (candidate_list.length === 0) {
        return null;
    } else if (candidate_list.length === 1) {
        return [Object.keys(candidate_list[0])[0]];
    }

    candidate_list.sort(function(a, b) {
        return a[Object.keys(a)[0]] - b[Object.keys(b)[0]];
    });
    return [Object.keys(candidate_list[0])[0], Object.keys(candidate_list[1])[0]];
}

router.get('/taipei', function(req, res) {
    var res_json = {
        "code": 0,
        "result": []
    };

    // check valid coordinate
    var lat = req.query.lat;
    var lng = req.query.lng;
    if (isNaN(lat) || isNaN(lng)) {
        res_json["code"] = -1;
        res.json(res_json);
        return;
    }
    lat = parseFloat(lat);
    lng = parseFloat(lng);
    if (lat < (-90.0) || lat > (90.0) || lng < (-180.0) || lng > (180.0)) {
        res_json["code"] = -1;
        res.json(res_json);
        return;
    }

    // check is in Taipei
    geocoder.reverse(lat, lng)
        .then(function(result) {
            if (result["name"] && result["name"] !== "Taipei") {
                res_json["code"] = -2;
                res.json(res_json);
                return;
            }

            // calculate the distance
            var sta_list = calcNearestStation(lat, lng);
            var result = {};
            var sta_full = 0;
            if (sta_list === undefined) {
                console.error("Ubike open data failed");
                res_json["code"] = -3;
                res.json(res_json);
                return;
            }
            if (sta_list === null) {
                res_json["code"] = 1;
                res.json(res_json);
                return;
            }

            for (i in sta_list) {
                result = {};
                result["station"] = ubike_json["retVal"][sta_list[i]]["sna"];
                result["num_ubike"] = ubike_json["retVal"][sta_list[i]]["sbi"];
                res_json["result"].push(result);
            }
            res.json(res_json);
            return;
        })
        .catch(function(error) {
            console.error("Geonames reverse failed");
            res_json["code"] = -3;
            res.json(res_json);
            return;
        });
});

module.exports = router;
