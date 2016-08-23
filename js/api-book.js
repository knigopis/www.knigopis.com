var app = angular.module('appControllers');

app.service('apiBook', function ($http) {

    var api = this;
    
    var apiBaseUrl = 'http://api.knigopis.com';

    function call (method, url, data) {
        var args = {
            method: method,
            url: apiBaseUrl + url
        };
        if (data) {
            args.data = data;
        }
        return $http(args).then(function (response) {
            return response.data;
        });
    }
    
    /* Books */
    api.getLatestBooks = function () {
        return call('GET', '/books/latest');
    };
    
    api.getLatestBooksWithNotes = function () {
        return call('GET', '/books/latest-notes').then(function(response){
            var arr = [];
            angular.forEach(response, function(value) {
                arr.push(value);
            });
            return arr;
        });
    };

    api.getBook = function (id) {
        return call('GET', '/books/' + id);
    };

    api.createBook = function (data) {
        return call('POST', '/books', data);
    };

    api.editBook = function (book) {
        return call('PUT', '/books/' + book.id, book);
    };
    
    api.saveBook = function (book) {
        if (book.id) {
            return api.editBook(book);
        } else {
            return api.createBook(book);
        }
    };

    api.deleteBook = function (id) {
        return call('DELETE', '/books/' + id);
    };

    /* Wishes */
    api.getWishes = function () {
        return call('GET', '/wishes');
    };

    api.getWish = function (id) {
        return call('GET', '/wishes/' + id);
    };

    api.createWish = function (wish) {
        return call('POST', '/wishes', wish);
    };
    
    api.editWish = function (wish) {
        return call('PUT', '/wishes/' + wish.id, wish);
    };
    
    api.saveWish = function (wish) {
        if (wish.id) {
            return api.editWish(wish);
        } else {
            return api.createWish(wish);
        }
    };

    api.deleteWish = function (id) {
        return call('DELETE', '/wishes/' + id);
    };


    /* Subscriptions */
    api.getSubscriptions = function () {
        return call('GET', '/subscriptions');
    };

    api.subscribe = function (subUserId) {
        return call('POST', '/subscriptions/' + subUserId);
    };

    api.unsubscribe = function (subUserId) {
        return call('DELETE', '/subscriptions/' + subUserId);
    };

    api.updateSubscriptionBooksCount = function (subUserId) {
        return call('PUT', '/subscriptions/' + subUserId);
    };
    

    /* User */
    api.getCredentials = function (token) {
        return call('GET', '/user/get-credentials?token=' + token);
    };

    api.getUserBooks = function (id) {
        return call('GET', '/users/' + id + '/books');
    };

    api.getUserInfo = function (id) {
        return call('GET', '/users/' + id);
    };

    api.getLastUsers = function () {
        return call('GET', '/users/latest').then(function (response) {
            var usersArr = [];
            angular.forEach(response, function(value) {
                usersArr.push(value);
            });
            return usersArr;
        });
    };
    
    api.editUser = function (id, data) {
        return call('PUT', '/users/' + id, data);
    };

});

