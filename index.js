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
            getItems: function(){
                return $http.get('config/items.json');
            },
            getExchangeRate:  function(){
                return $http.get('https://api.bitcoinaverage.com/ticker/global/USD');
            },
            getAltcoinsFromShapeShift: function(){
                return $http.get('https://www.shapeshift.io/getcoins');
            },
            getAddressBalance: function(address){
                return $http.get('https://blockchain.info/q/getreceivedbyaddress/' + address);
            },
            listBitcoinTransactions: function(address){
                return $http.get('https://btc.blockr.io/api/v1/address/txs/'+ address)
            },
            getAltcoinDepositAddress: function(altcoin, address){
                var data = ({
                    method: 'POST',
                    url: "https://www.shapeshift.io/shift/",
                    headers: {
                        'Content-Type': "application/json"
                    },
                    data:({
                        withdrawal:address,
                        pair:altcoin+"_btc",
                        returnAddress:"",
                        destTag:"",
                        rsAddress:"",
                        apiKey:""
                    })
                });
                return $http(data);
            },
            getAltcoinMarketInfo: function(altcoin){
                return $http.get('https://www.shapeshift.io/marketinfo/'+altcoin+'_btc');
            },
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
                total += item.price;
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
                total += item.price;
            });
            return total;
        };

        $scope.payWithBitcoin = function(total) {
            $scope.address = $modalInstance.address;
            $scope.exchangeRate = Math.round10(total/$scope.rate, -8);
            $scope.transactionIsActive = true;

            httpService.getAddressBalance($scope.address).then(function (result) {
                var results = result.data;
                $scope.originalAddressBalance = results *.00000001;
            });
            checkForBitcoinTransaction();
        };

        $scope.getAltcoins = function() {
            httpService.getAltcoinsFromShapeShift().then(function (result) {
                $scope.shapeShiftAltcoins = result.data;
            });
        };

        $scope.payWithAltcoin = function(total, altcoin) {
            $scope.timer = 600;
            timer($scope.timer);
            var getAltcoinMarketInfo = altcoin.toLowerCase();
            httpService.getAltcoinMarketInfo(getAltcoinMarketInfo).then(function (result) {
                $scope.altcoinRate = result.data.rate;
                $scope.transactionIsActive = true;

                var btcExchangeRate = Math.round10(total/$scope.rate, -8);
                $scope.exchangeRate = Math.round10((btcExchangeRate/$scope.altcoinRate), -8);

                getAltcoinDepositAddress(altcoin);
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
            httpService.getAltcoinDepositAddress(altcoin, $modalInstance.address).then(function (result) {
                if (result.data.error && $scope.transactionIsActive == true) {
                    if(i >= limit) {
                        $scope.shapeShiftError = true;
                        $timeout(function () {
                        }, 3000).then(function () {
                            $scope.cancel('Unable to fetch deposit address from ShapeShift.');
                        });
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
                    if (result.data.status == "received") {
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
        $scope.defaultAddress = $scope.data.defaultCoin[0];
        httpService.listBitcoinTransactions($scope.address).then(function (result) {
            $scope.txs = result.data.data;
        });

        $scope.searchAddress = function(address) {
            $scope.balance = 0;
            $scope.totalAmountReceived = 0;
            $scope.address = address;
            httpService.listBitcoinTransactions(address).then(function (result) {
                $scope.txs = result.data.data;
            })
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