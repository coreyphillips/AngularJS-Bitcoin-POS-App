/**
 * Main AngularJS Web Application
 */
angular.module('bitcoinPosApp', ['ui.router', 'ui.bootstrap'])

/**
 * Configure the Routes
 */
    .config( function($stateProvider,$urlRouterProvider) {

        $urlRouterProvider
            .otherwise('/');

        $stateProvider
            .state('index', {
                url: '/',
                templateUrl: 'partials/home.html',
                controller: 'PageCtrl', // this controller will be applied to the templateUrl. No need to add ng-controller to the view.
                resolve:{ // the controller won't run until the $http request is resolved
                    getJSON:  function($http){
                        return $http({method: 'GET', url: 'config/data.json'}).then(function (result) {
                            return result.data;
                        });
                    }
                }
            })
            .state('search', {
                url: '/search',
                templateUrl: 'partials/search.html',
                controller: 'SearchCtrl', // this controller will be applied to the templateUrl. No need to add ng-controller to the view.
                resolve:{ // the controller won't run until the $http request is resolved
                    getJSON:  function($http){
                        return $http({method: 'GET', url: 'config/data.json'}).then(function (result) {
                            return result.data;
                        });
                    }
                }
            })
    })

    .factory('httpService', function($http, $q) {
        return {
            getJSON: function(){
                return $http.get('config/data.json');
            },
            /*
             https://api.bitcoinaverage.com/ticker/global/USD
             {"24h_avg": 236.44,"ask": 236.28,"bid": 235.99,"last": 236.33,"timestamp": "Sat, 26 Sep 2015 16:07:40 -0000","volume_btc": 46291.38,"volume_percent": 87.17}
             */
            getExchangeRate:  function(){
                return $http.get('https://api.bitcoinaverage.com/ticker/global/USD');
            },
            /*
             https://www.shapeshift.io/getcoins
             {"BTC":{"name":"Bitcoin","symbol":"BTC","image":"https://shapeshift.io/images/coins/bitcoin.png","status":"available"},"VTC":{"name":"Vertcoin","symbol":"VTC","image":"https://shapeshift.io/images/coins/vertcoin.png","status":"unavailable"}}
            */
            getAltcoinsFromShapeShift: function(){
                return $http.get('https://www.shapeshift.io/getcoins');
            },
            /*
             https://blockchain.info/q/getreceivedbyaddress/1JSRWccK7Lef2xZmd8B41bB481iNV9pPoy
             23563823
             */
            getAddressBalance: function(address){
                return $http.get('https://blockchain.info/q/getreceivedbyaddress/' + address);
            },
            /*
             https://btc.blockr.io/api/v1/address/txs/194AJeZCav8TUFn5WBc8cELWwJQK6ViC8x
             {"status":"success","data":{"address":"194AJeZCav8TUFn5WBc8cELWwJQK6ViC8x","limit_txs":200,"nb_txs":2,"nb_txs_displayed":2,"txs":[{"tx":"bb60c1fe73387d5a3dbfb09f1e8a5c15cb2e8301f178c46b655cae4bfc2d6c3d","time_utc":"2015-09-21T01:46:14Z","confirmations":836,"amount":-0.0002144,"amount_multisig":0}},"code":200,"message":""}
             */
            listTransactions: function(address, symbol){
                return $http.get('https://'+symbol+'.blockr.io/api/v1/address/txs/'+ address)
            },
            /*
             https://btc.blockr.io/api/v1/address/unconfirmed/1KW8DKTgJzvgc4MaU5HUmHqT65mU8PmzqJ
             {"status":"success","data":{"address":"1KW8DKTgJzvgc4MaU5HUmHqT65mU8PmzqJ","unconfirmed":[{"tx":"2f8cb79487deed4eae47c8fe023682aa6cb06c55c9109b552336d3ea3fe36125","time_utc":"2015-09-29T12:40:03Z","amount":0.00021046,"n":1}]},"code":200,"message":""}
             */
            listUnconfirmedTransactions: function(address, symbol){
                return $http.get('https://'+symbol+'.blockr.io/api/v1/address/unconfirmed/'+ address)
            },
            /*
             {"deposit":"LZYZ7Wu7gsx9UTs8mHa3DTzBKMT92sSNqG","depositType":"LTC","withdrawal":"1JSRWccK7Lef2xZmd8B41bB481iNV9pPoy","withdrawalType":"BTC","public":null,"apiPubKey":"shapeshift"}
             */
            getAltcoinDepositAddress: function(altcoin, address, defaultCoin){
                var data = ({
                    method: 'POST',
                    url: "https://www.shapeshift.io/shift/",
                    headers: {
                        'Content-Type': "application/json"
                    },
                    data:({
                        withdrawal:address,
                        pair:altcoin+"_"+defaultCoin,
                        returnAddress:"",
                        destTag:"",
                        rsAddress:"",
                        apiKey:""
                    })
                });
                return $http(data);
            },
            /*
             https://www.shapeshift.io/marketinfo/ltc_btc
             {"pair":"ltc_btc","rate":0.01215038,"minerFee":0.0001,"limit":353.97822857,"minimum":0.01628664}
             */
            getAltcoinMarketInfo: function(altcoin, defaultCoin){
                return $http.get('https://www.shapeshift.io/marketinfo/'+altcoin+'_'+defaultCoin);
            },
            /*
             https://www.shapeshift.io/txStat/1B8eC6MvjhKXt2Hk9yKDMsBAvosZ1cg6wt
             No deposit received:
             {"status":"no_deposits","address":"1B8eC6MvjhKXt2Hk9yKDMsBAvosZ1cg6wt"}

             Deposit received:
             {"status":"received","address":"1B8eC6MvjhKXt2Hk9yKDMsBAvosZ1cg6wt","incomingCoin":0.01698658,"incomingType":"BTC"}
             */
            getShapeShiftTransactionStats : function(withdrawalAddress){
                return $http.get('https://shapeshift.io/txStat/'+withdrawalAddress);
            }
        }
    })

    .filter('secondsToMinutes', [function() {
        return function(seconds) {
            return new Date(1970, 0, 1).setSeconds(seconds);
        };
    }])
/**
 * Controls all other Pages
 */
    .controller('PageCtrl', function ($scope, $http, $modal, $log, $timeout, httpService, getJSON) {
        $scope.data = getJSON;
        $scope.name = $scope.data.defaultCoin[0].name;
        $scope.address = $scope.data.defaultCoin[0].address;
        $scope.symbol = $scope.data.defaultCoin[0].symbol;
        $scope.items = [];

        $scope.addItem = function(name, description, price) {
            $scope.items.push({'name': name, 'description':description, 'price':price});
            $scope.newSkill = ''
        };

        $scope.removeAllItems = function() {
            $scope.items = [];
        };

        $scope.deleteItem = function(index) {
            $scope.items.splice(index, 1);
        };

        $scope.getTotal = function(){
            var total = 0;
            angular.forEach($scope.items, function(item) {
                if(!item.price){
                    item.price = 0;
                }
                total += Math.round10(item.price, -2);
            });
            return total;
        };

        $scope.checkoutModal = function () {
            var modalInstance = $modal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'partials/checkoutModal.html',
                controller: 'ModalInstanceCtrl'
            });
            modalInstance.items = $scope.items;
            modalInstance.name = $scope.name;
            modalInstance.address = $scope.address;
            modalInstance.symbol = $scope.symbol;
        };
    })

    .controller('ModalInstanceCtrl', function ($scope, $modalInstance, $http, $timeout, $log, httpService) {
        httpService.getExchangeRate().then(function (result) {
            var results = result.data;
            $scope.rate = results.last;
        });

        $scope.items = $modalInstance.items;
        $scope.name = $modalInstance.name;
        $scope.symbol = $modalInstance.symbol;

        $scope.cancel = function (status) {
            $scope.transactionIsActive = false;
            $log.info(status + ': ' + new Date());
            $modalInstance.dismiss('cancel');
        };

        $scope.getTotal = function(){
            var total = 0;
            angular.forEach($scope.items, function(item) {
                if(!item.price){
                    item.price = 0;
                }
                total += Math.round10(item.price, -2);
            });
            return total;
        };

        $scope.payWithDefaultCoin = function(total) {
            $scope.address = $modalInstance.address;
            $scope.exchangeRate = Math.round10(total/$scope.rate, -8);
            $scope.transactionIsActive = true;

            if($modalInstance.symbol.toLowerCase() != 'btc'){
                $scope.transactionIsSuccess = false;
                checkoutError("Unable to verify 0 confirmation transactions for "+$modalInstance.symbol.toUpperCase()+" with available API's. Please do so manually and click cancel when complete.", false);
            } else {
                httpService.getAddressBalance($scope.address).then(function (result) {
                    var results = result.data;
                    $scope.originalAddressBalance = results * .00000001;
                });
                checkForBitcoinTransaction();
            }
        };

        $scope.getAltcoins = function() {
            httpService.getAltcoinsFromShapeShift().then(function (result) {
                $scope.shapeShiftAltcoins = result.data;
            });
        };

        $scope.payWithAltcoin = function(total, altcoin) {
            $scope.checkoutError = false;
            $scope.timer = 600;
            timer($scope.timer);
            httpService.getAltcoinMarketInfo(altcoin.toLowerCase(), 'btc').then(function (result) {
                $scope.altcoinRate = result.data.rate;
                $scope.transactionIsActive = true;

                var btcExchangeRate = Math.round10(total/$scope.rate, -8);
                $scope.exchangeRate = Math.round10((btcExchangeRate/$scope.altcoinRate), -8);

                //Check that the current purchase is below ShapeShift's limit and above ShapeShift's minimum
                if($scope.exchangeRate > result.data.limit || $scope.exchangeRate < result.data.minimum){
                    checkoutError("According to ShapeShift's limits you must spend more than "+result.data.minimum+" "+ altcoin +" and less than "+ result.data.limit+" "+ altcoin, true);
                } else {
                    getAltcoinDepositAddress(altcoin);
                }
            });
        };

        function checkForBitcoinTransaction () {
            $scope.transactionIsSuccess = false;
            if($scope.transactionIsActive == true) {
                httpService.getAddressBalance($scope.address).then(function (result) {
                    if ((result.data * .00000001) >= $scope.originalAddressBalance + $scope.exchangeRate) {
                        $scope.transactionIsSuccess = true;
                        $timeout(function () {
                        }, 3000).then(function () {
                            $scope.cancel('Transaction Received');
                        });
                    } else {
                        $timeout(function () {
                        }, 5000).then(function () {
                            checkForBitcoinTransaction();
                        });
                    }
                });
            }
        }

        function getAltcoinDepositAddress (altcoin){
            var i = 0;
            var limit = 10;
            httpService.getAltcoinDepositAddress(altcoin, $modalInstance.address, $modalInstance.symbol).then(function (result) {
                if (result.data.error && $scope.transactionIsActive == true) {
                    if(i >= limit) {
                        checkoutError('Unable to fetch deposit address from ShapeShift.');
                    } else {
                        i++;
                        getAltcoinDepositAddress();
                    }
                } else {
                    $scope.address = result.data.deposit;
                    checkForShapeShiftTransaction($scope.address);
                }
            })
        }

        function checkForShapeShiftTransaction (withdrawalAddress) {
            $scope.transactionIsSuccess = false;
            if($scope.transactionIsActive == true) {
                httpService.getShapeShiftTransactionStats(withdrawalAddress).then(function (result) {
                    if (result.data.status == "received" && result.data.incomingCoin >= $scope.exchangeRate) {
                        $scope.transactionIsSuccess = true;
                        $timeout(function () {
                        }, 3000).then(function () {
                            $scope.cancel('Transaction Received');
                        });
                    } else {
                        $timeout(function () {
                        }, 5000).then(function () {
                            checkForShapeShiftTransaction($scope.address);
                        });
                    }
                });
            }
        }

        function checkoutError (error, cancel) {
            $scope.error = error;
            $scope.checkoutError = true;
            if (cancel) {
                $timeout(function () {
                }, 8000).then(function () {
                    $scope.cancel(error);
                });
            }
        }

        function timer (time) {
            if(time <= 0){
                $scope.cancel('Transaction Timed Out');
            } else {
                $timeout(function () {
                    $scope.timer--;
                }, 1000).then(function () {
                    timer($scope.timer);
                });
            }
        }
    })

    .controller('SearchCtrl', function ($scope, $http, $log, $timeout, httpService, getJSON) {
        $scope.data = getJSON;
        $scope.totalAmountReceived = 0;
        $scope.balance = 0;
        $scope.address = $scope.data.defaultCoin[0].address;
        $scope.symbol = $scope.data.defaultCoin[0].symbol;
        $scope.defaultAddress = $scope.data.defaultCoin[0];
        httpService.listTransactions($scope.address, $scope.symbol).then(function (result) {
            $scope.txs = result.data.data;
        });
        httpService.listUnconfirmedTransactions($scope.address, $scope.symbol).then(function (result) {
            $scope.unconfirmedTxs = result.data.data;
        });

        $scope.searchAddress = function(address, symbol) {
            $scope.balance = 0;
            $scope.totalAmountReceived = 0;
            $scope.address = address;
            httpService.listTransactions(address, symbol).then(function (result) {
                $scope.txs = result.data.data;
            });
            httpService.listUnconfirmedTransactions(address, symbol).then(function (result) {
                $scope.unconfirmedTxs = result.data.data;
            });
        };

        $scope.sumAmount = function(amount) {
            $scope.balance += amount;
            $scope.balance = Math.round10($scope.balance, -8);
            if(amount >= 0) {
                $scope.totalAmountReceived += amount;
                $scope.totalAmountReceived = Math.round10($scope.totalAmountReceived, -8);
            }
        }
    });

function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
        return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
        return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}

// Decimal round
Math.round10 = function(value, exp) {
    return decimalAdjust('round', value, exp);
};