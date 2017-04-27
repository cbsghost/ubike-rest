ubike-rest
=======
a HTTP API to find 2 nearest ubike station based on latitude and longitude in request parameters.

### /v1/ubike-station/taipei

* Request Method: ```GET```
* Request Parameters:
  * ```lat```: latitude of location
  * ```lng```: longitude of location
* Spec and Error Handling:
  * for any location not in Taipie City, please return error code -2.
  * please handle error/exceptions with following scenarios (and return coressponding error codes)
    * 1: all ubike stations are full
    * 0: OK
    * -1: invalid latitude or longitude
    * -2: given location not in Taipei City
    * -3: system error
  * please return empty list as result while returning non-zero code.
  * please return station with non-zero ubikes (i.e., skip station without ubikes).

### Response

* Content Type: ```application/json```
* Body
```json
{
    "code": $error-code,
    "result": [
        {
           "station": "$name-of-station", 
           "num_ubike": $number-of-available-ubike
        },
        {
           "station": "$name-of-station", 
           "num_ubike": $number-of-available-ubike
        }
    ]
}
```

### Sample Requests
```json
# sample 1
# request
GET /v1/ubike-station/taipei?lat=25.034153&lng=121.568509

# response
Content-Type: application/json

    {
        "code": 0,
        "result": [
            {"station": "捷運象山站", "num_ubike": 10},
            {"station": "世貿二館", "num_ubike": 33}
        ]               
    }

# sample 2
# request
GET /v1/ubike-station/taipei?lat=24.999087&lng=121.327547

# response
Content-Type: application/json

    {
        "code": -2,
        "result": []
    }
```
