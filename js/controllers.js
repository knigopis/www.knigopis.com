var appControllers = angular.module('appControllers', ['LocalStorageModule']);

appControllers.controller('MainController', [
    '$rootScope', '$scope', '$state', '$interval', '$timeout', 'apiBook', 'localStorageService',
    function ($rootScope, $scope, $state, $interval, $timeout, apiBook, localStorageService) {

    $scope.feedbackEmail = 'info' + '@' + 'knigopis' + '.com';

    $scope.user = localStorageService.get('user');

    $scope.viewUser = null;
    $scope.loginLoading = 0;
    $scope.state = $state;
    $scope.loading = 0;

    $scope.authCallback = function (token) {
        $scope.loginLoading++;
        
        var browserLang = navigator.language || navigator.userLanguage;

        apiBook.getCredentials(token, browserLang).then(function (result) {
            $scope.user = result.user;
            localStorageService.set('user', result.user);
            $scope.updateLanguage();
            if (!result.user.booksCount && result.user.createdAt === result.user.updatedAt) {
                ga('send', 'event', 'User', 'Reg', result.user.id + ": " + result.user.nickname);
            } else {
                ga('send', 'event', 'User', 'Auth', result.user.id + ": " + result.user.nickname);
            }
        }, function (error) {
            $scope.showApiError(error);
        }).then(function(){
            $scope.loginLoading = 0;
        });
    };

    window.authCallback = $scope.authCallback;
    $scope.updateLanguage = function (lang) {
        // not implemented
    };

    $scope.showLoginLoading = function () {
        $scope.loginLoading++;
    };
    window.showLoginLoading = $scope.showLoginLoading;

    $scope.hideLoginLoading = function () {
        $scope.loginLoading--;
    };
    window.hideLoginLoading = $scope.hideLoginLoading;

    $scope.logout = function () {
        $scope.user = null;
        localStorageService.set('user', null);
        ga('send', 'event', 'User', 'Logout');
    };

    $scope.goToCurrentUserBooks = function(){
        $state.go("user_books", {
            nickname: $scope.user.nickname, u: $scope.user.id});
    };

    $scope.loadUserData = function(id) {
        $scope.showLoading();
        apiBook.getUserInfo(id).then(function (user) {
            $scope.viewUser = user;
            user.isInSubscriptions = isUserInSubscriptions(user);
            if ($scope.user && user.isInSubscriptions) {
                apiBook.updateSubscriptionBooksCount(id);
            }
            if ($scope.user && $scope.user.id === user.id) {
                ga('send', 'event', 'User', 'ViewSelf', user.id + ": " + user.nickname);
            } else {
                ga('send', 'event', 'User', 'View', user.id + ": " + user.nickname);
            }
        }, function(error) {
            $scope.viewUser = null;
            $scope.showApiError(error);
        }).then(function () {
            $scope.hideLoading();
        });
    };

    $scope.hideLoading = function () {
        $scope.loading--;
    };

    $scope.showLoading = function () {
        $scope.loading++;
    };

    $scope.showApiError = function (error) {
        $scope.errorMessage = error.message;

        $timeout(function(){
            $scope.errorMessage = null;
        }, 4000);
        
        ga('send', 'event', 'Error', 'Show', error.message);
    };

    $scope.hideError = function(){
        $scope.errorMessage = null;
    };

    $scope.$on('$stateChangeStart', function() {
        $scope.hideError();
    });

    $scope.showIndexContent = true;
    $scope.$on('$stateChangeSuccess', function(e, to) {
        $scope.showIndexContent = to.name === 'index';
    });

    $scope.lastUsers = [];
    var loadLastUsers = function(){
        $scope.showLoading();
        apiBook.getLastUsers().then(function (response) {
            $scope.lastUsers = response;
        }, $scope.showApiError).then(function () {
            $scope.hideLoading();
        });
    };
    loadLastUsers();

    /* subscriptions */

    $scope.subscriptions = [];
    $scope.subscriptionsLoaded = false;
    function loadSubscriptions(){
            if ($scope.user) {
                $scope.showLoading();
                
                function sortByUpdate(subscriptions) {
                    function compareByUpdate(a, b) {
                        var dateA = new Date(a.subUser.updatedAt);
                        var dateB = new Date(b.subUser.updatedAt);
                        if (dateA > dateB) {
                            return -1;
                        }
                        if (dateA < dateB) {
                            return 1;
                        }
                        return 0;
                    }
                    ;
                    return subscriptions.sort(compareByUpdate);
                }
                ;

                apiBook.getSubscriptions().then(function (subscriptions) {
                    $scope.subscriptions = sortByUpdate(subscriptions);
                    $scope.subscriptionsLoaded = true;
                }, $scope.showApiError).then(function () {
                    $scope.subscriptionsLoaded = true;
                    $scope.hideLoading();
                });
            }
    }

    loadSubscriptions();

    $scope.subscribe = function (user, subUser) {
        $scope.showLoading();
        apiBook.subscribe(subUser.id).then(function (response) {
            $scope.subscriptions[subUser.id] = subUser.booksCount;
            subUser.isInSubscriptions = true;
            ga('send', 'event', 'User', 'Subscribe', subUser.id + ": " + subUser.nickname);
        }, $scope.showApiError).then(function () {
            $scope.hideLoading();
        });
     };

    $scope.unsubscribe = function (user, subUser) {
        $scope.showLoading();
        apiBook.unsubscribe(subUser.id).then(function (response) {
            delete $scope.subscriptions[subUser.id];
            subUser.isInSubscriptions = false;
            ga('send', 'event', 'User', 'Unsubscribe', subUser.id + ": " + subUser.nickname);
        }, $scope.showApiError).then(function () {
            $scope.hideLoading();
        });
    };

     var isUserInSubscriptions = function(subUser){
         if (!$scope.user || $scope.subscriptions.length === 0) {
             return false;
         }
         for (var i=0; i < $scope.subscriptions.length; i++) {
             if ($scope.subscriptions[i]['subUser']['id'] === subUser.id) {
                 return true;
             }
         }
         return false;
     };

     $scope.getSubscriptionBookCountDif = function(subscription){
         var dif = subscription.subUser.booksCount - subscription.lastBooksCount;
         if (dif > 0) {
             return dif;
         }
     };
     /* end of subscriptions */


    /* latest books */
    $scope.latestBooks = [];
    function loadLatestBooks(){
        $scope.showLoading();

        apiBook.getLatestBooksWithNotes().then(function (response) {
            $scope.latestBooks = response;
        }, $scope.showApiError).then(function () {
            $scope.hideLoading();
        });

    }
    loadLatestBooks();
    /* end of latest books */

}]);

appControllers.controller('BookFormController', [
    '$scope', 'apiBook',
    function($scope, apiBook) {
        $scope.bookSaved = 0;

        $scope.saveBookAndReturn = function() {
            if (!$scope.form.$valid) {
                return;
            }
            $scope.showLoading();

            apiBook.saveBook($scope.book).then(function (response) {
                afterSave();
                $scope.bookSaved = 1;
                $scope.form.$setPristine();
                ga('send', 'event', 'Book', 'Save', response.title);
                $scope.goToCurrentUserBooks();
            }, $scope.showApiError).then(function () {
                $scope.hideLoading();
            });
        };

        $scope.saveBookAndContinue = function() {
            if (!$scope.form.$valid) {
                return;
            }
            $scope.showLoading();
            
            var bookMethod = apiBook.createBook;
            if ($scope.book.id) {
                bookMethod = apiBook.editBook;
            }

            bookMethod($scope.book).then(function (response) {
                afterSave();
                $scope.bookSaved = 1;
                var savedReadYear = $scope.book.readYear;
                $scope.book = {};
                $scope.book.readYear = savedReadYear;
                $scope.form.$setPristine();
                ga('send', 'event', 'Book', 'Save', response.title);
            }, $scope.showApiError).then(function () {
                $scope.hideLoading();
            });
        };

        $scope.deleteBook = function() {
            $scope.showLoading();
            apiBook.deleteBook($scope.book.id).then(function () {
                ga('send', 'event', 'Book', 'Delete', $scope.book.title);
                $scope.goToCurrentUserBooks();
            }, $scope.showApiError).then(function () {
                $scope.hideLoading();
            });
        };

        function afterSave() {
            if ($scope.book.wish) {
                $scope.book.wish.delete();
            }
        }
        
        ga('send', 'event', 'Book', 'EditForm');
}]);

appControllers.controller('BookAddController', [
    '$scope', '$stateParams', 'apiBook',
    function($scope, $stateParams, apiBook) {
        $scope.book = {};
        $scope.book.readYear = (new Date()).getFullYear();

        if ($stateParams.w) {
            $scope.showLoading();
            apiBook.getWish($stateParams.w).then(function (wish) {
                $scope.book.title = wish.title;
                $scope.book.author = wish.author;
                var today = new Date();
                $scope.book.readYear = today.getFullYear();
                $scope.book.readMonth = today.getMonth() + 1;
                $scope.book.readDay = today.getDate();
                $scope.book.wish = wish;
            }, $scope.showApiError).then(function () {
                $scope.hideLoading();
            });
        }

        if ($stateParams.ob) {
            $scope.showLoading();
            apiBook.getBook($stateParams.ob).then(function (otherBook) {
                $scope.book.title = otherBook.title;
                $scope.book.author = otherBook.author;
            }, $scope.showApiError).then(function () {
                $scope.hideLoading();
            });
        }
        
        ga('send', 'event', 'Book', 'AddForm');
}]);


appControllers.controller('BookEditController', [
    '$scope', '$stateParams', 'apiBook',
    function($scope, $stateParams, apiBook) {
        if ($stateParams.bookId) {
            $scope.showLoading();
            $scope.book = {};
            apiBook.getBook($stateParams.bookId).then(function (response) {
                $scope.book = response;
            }, $scope.showApiError).then(function () {
                $scope.hideLoading();
            });
        }
    }
]);


appControllers.controller('UserBooksController', ['$rootScope', '$scope', '$stateParams', '$interval', '$state', 'apiBook', '$q', 
    function($rootScope, $scope, $stateParams, $interval, $state, apiBook, $q) {

        $scope.loaded = false;
        if ($stateParams.u) {
            $scope.showLoading();
            
            var userTestPromise = $q(function (resolve, reject) {
                // reject to change state if new id has been found 
                if (!/-/.test($stateParams.u)) {
                    apiBook.findIdByParseId($stateParams.u).then(function (newId) {
                        if (newId !== false) {
                            $state.go("user_books", {nickname: $stateParams.nickname, u: newId});
                            reject();
                        } else {
                            resolve();
                        }
                    }, resolve);
                } else {
                    resolve();
                }
            });
            
            userTestPromise.then(function () {
                $scope.loadUserData($stateParams.u);

                return apiBook.getUserBooks($stateParams.u).then(function (books) {
                    sortBooksByDate(books);
                    $scope.booksDividedByYear = divideByYears(books);
                    $scope.populateSideNavigation();
                    $scope.loaded = true;
                    if ($stateParams.y) {
                        $scope.scrollToYear($stateParams.y);
                    }
                }, $scope.showApiError);

            }).then(function () {
                $scope.hideLoading();
            });
            
        }
        
        function sortBooksByDate (books) {
            function compare(a, b) {
                if (a.readYear > b.readYear) {
                    return -1;
                }
                if (a.readYear < b.readYear) {
                    return 1;
                }
                if (!a.readMonth && b.readMonth) {
                    return 1;
                }
                if (a.readMonth && !b.readMonth) {
                    return -1;
                }
                if (a.readMonth < b.readMonth) {
                    return 1;
                }
                if (a.readMonth > b.readMonth) {
                    return -1;
                }
                if (a.readDay < b.readDay) {
                    return 1;
                }
                if (a.readDay > b.readDay) {
                    return -1;
                }
                var aDate = new Date(a.createdAt);
                var bDate = new Date(b.createdAt);
                if (aDate > bDate) {
                    return -1;
                }
                if (aDate < bDate) {
                    return 1;
                }
                return 0;
            }

            books.sort(compare);
        };

        function divideByYears(books) {
            var divided = {};

            var group = null;

            angular.forEach(books, function(book) {
                if (book.readYear) {
                    group = book.readYear;
                } else {
                    group = 'other';
                }
                if (typeof divided[group] === 'undefined') {
                    divided[group] = [];
                }
                divided[group].push(book);
            });
            divided = sortObjectByKeys(divided);
            return divided;
        }

        function sortObjectByKeys(o) {
            var sorted = [],
                    key, a = [];

            for (key in o) {
                if (o.hasOwnProperty(key)) {
                    a.push(key);
                }
            }

            a.sort(function(a, b){
                if (a === 'other' && b !== 'other') {
                    return 1;
                }
                if (a !== 'other' && b === 'other') {
                    return -1;
                }
                if (a < b) {
                    return 1;
                }
                if (a > b) {
                    return -1;
                }
                return 0;
            });

            for (key = 0; key < a.length; key++) {
                sorted.push({'group': a[key], 'books': o[a[key]]});
            }
            return sorted;
        }
        
        $scope.getReadDateForList = function(book) {
            var date = '';
            if (book.readYear && book.readMonth) {
                var month = book.readMonth;
                if (month < 10) {
                    month = '0' + month;
                }
                date = book.readYear + '-' + month;
            }
            if (book.readYear && book.readDay) {
                var day = book.readDay;
                if (day < 10) {
                    day = '0' + day;
                }
                date += '-' + day;
            }
            return date;
        };

        $scope.populateSideNavigation = function(){
            $scope.navBookYears = [];

            angular.forEach($scope.booksDividedByYear, function(book) {
                $scope.navBookYears.push({
                    name: book.group,
                    count: book.books.length
                });
            });
        };

        $scope.scrollToYear = function (year) {
            var scrolled = false;
            var intervalId = $interval(function () {
                if (scrolled) {
                    $interval.cancel(intervalId);
                    return;
                }
                var $elem = $('#year-' + year);
                if ($elem.length) {
                    window.scrollTo(0, $elem.offset().top - 80);
                    $('.sidenav-years > li.active').removeClass('active');
                    $('.sidenav-year-' + year).addClass('active');
                    scrolled = true;
                }
            }, 100);
        };
        $scope.goToYear = function (year) {
            $state.transitionTo('user_books', {
                nickname: $scope.viewUser.nickname,
                u: $scope.viewUser.id,
                y: year}, {
                    location: 'replace',
                    inherit: false,
                    notify: false
                });
            $scope.scrollToYear(year);
        };

}]);

/* Wish */

appControllers.controller('WishController', ['$scope', '$stateParams', '$state',
    function($scope, $stateParams, $state) {

}]);
appControllers.controller('WishFormController', [
    '$scope', '$state', 'apiBook',
    function($scope, $state, apiBook) {
        $scope.bookSaved = 0;

        $scope.saveBookAndReturn = function() {
            if (!$scope.form.$valid) {
                return;
            }
            $scope.showLoading();

            apiBook.saveWish($scope.book).then(function (response) {
                $scope.bookSaved = 1;
                $scope.form.$setPristine();
                ga('send', 'event', 'Wish', 'Save', $scope.user.id);
                $state.go("wish.list");
            }, $scope.showApiError).then(function () {
                $scope.hideLoading();
            });
        };

        $scope.saveBookAndContinue = function() {
            if (!$scope.form.$valid) {
                return;
            }
            $scope.showLoading();

            apiBook.saveWish($scope.book).then(function (response) {
                $scope.bookSaved = 1;
                $scope.book = {};
                $scope.book.priority = 50;
                $scope.form.$setPristine();
                ga('send', 'event', 'Wish', 'Save', $scope.user.id);
            }, $scope.showApiError).then(function () {
                $scope.hideLoading();
            });
        };

        $scope.deleteBook = function() {
            $scope.showLoading();
            apiBook.deleteWish($scope.book.id).then(function () {
                ga('send', 'event', 'Wish', 'Delete', $scope.user.id);
                $state.go("wish.list");
            }, $scope.showApiError).then(function () {
                $scope.hideLoading();
            });
        };
        
        ga('send', 'event', 'Wish', 'EditForm');
}]);

appControllers.controller('WishListController', [
    '$scope', '$stateParams', '$state', 'apiBook',
    function($scope, $stateParams, $state, apiBook) {
        $scope.wishList = [];
        $scope.loaded = false;
        $scope.showLoading();
        
        function sortByPriority(wishes) {
            function compareByUpdate(a, b) {
                var pa = a.priority;
                var pb = b.priority;
                if (pa > pb) {
                    return -1;
                }
                if (pa < pb) {
                    return 1;
                }
                return 0;
            }
            ;
            return wishes.sort(compareByUpdate);
        };

        apiBook.getWishes().then(function (wishes) {
            $scope.wishList = sortByPriority(wishes);
            ga('send', 'event', 'Wish', 'ViewList', $scope.user.id);
        }, $scope.showApiError).then(function () {
            $scope.loaded = true;
            $scope.hideLoading();
        });
}]);

appControllers.controller('WishAddController', [
    '$scope', '$stateParams', 'apiBook',
    function($scope, $stateParams, apiBook) {
        $scope.book = {};
        $scope.book.priority = 50;

        if ($stateParams.ob) {
            $scope.showLoading();
            apiBook.getBook($stateParams.ob).then(function (otherBook) {
                $scope.book.title = otherBook.title;
                $scope.book.author = otherBook.author;
                $scope.book.notes = 'Увидел у ' + otherBook.user.nickname;
                if (otherBook.notes) {
                    $scope.book.notes += " с примечанием: " + otherBook.notes;
                }
            }, $scope.showApiError).then(function() {
                $scope.hideLoading();
            });
        }
        
        ga('send', 'event', 'Book', 'AddForm');
}]);

appControllers.controller('WishEditController', [
    '$scope', '$stateParams', 'apiBook', 
    function($scope, $stateParams, apiBook) {
        if ($stateParams.id) {
            $scope.showLoading();
            $scope.book = {};
            
            apiBook.getWish($stateParams.id).then(function(wish){
                $scope.book = wish;
            }, $scope.showApiError).then(function() {
                $scope.hideLoading();
            });
        }
}]);

/* End of Wish */

appControllers.controller('SettingsController', ['$scope', '$state', 'apiBook',
    function ($scope, $state, apiBook) {
        $scope.settings = {
            nickname: $scope.user.nickname,
            profile: $scope.user.profile,
            lang: $scope.user.lang
        };

        $scope.saveUserSettings = function () {
            if (!$scope.settingsForm.$valid) {
                return;
            }

            $scope.showLoading();

            $scope.user.nickname = $scope.settings.nickname;
            $scope.user.profile = $scope.settings.profile;
            $scope.user.lang = $scope.settings.lang;

            apiBook.editUser($scope.user.id, $scope.user).then(function () {
                ga('send', 'event', 'User', 'SaveSettings', $scope.user.id);
                $state.go("index");
            }, $scope.showApiError).then(function () {
                $scope.hideLoading();
            });
        };
        
        ga('send', 'event', 'User', 'SettingsForm', $scope.user.id);
}]);
