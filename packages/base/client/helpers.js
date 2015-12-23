// ----- private helper --------------------------------------------------------
/**
 * detect first browser language
 *
 * @return {String} locale
 */
var getPreferredLanguage = function() {
    var nav = window.navigator;
    var props = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'];
    var lang = "";

    // support for HTML 5.1 "navigator.languages"
    if (Array.isArray(nav.languages)) {
        for (var i = 0; i < nav.languages.length; i++) {
            lang = nav.languages[i];
            if (lang && lang.length) {
                break;
            }
        }
    }

    // support for other well known properties in browsers
    if (!lang) {
        for (var i = 0; i < props.length; i++) {
            lang = nav[props[i]];
            if (lang && lang.length) {
                break;
            }
        }
    }

    if (lang.indexOf('-') !== -1) {
        lang = lang.split('-')[0];
    }

    if (lang.indexOf('_') !== -1) {
        lang = lang.split('_')[0];
    }

    return lang ? lang : "en";
};

// ----- generic helpers -------------------------------------------------------
/**
 * used to log subscription errors to the console
 */
Waslchiraa.Helpers.subscriptionLogger = {
    onError: function(result) {
        console.log(result);
    }
};

/**
 * stops event propagation
 *
 * @param {Object} event
 * @return {Boolean} false
 */
Waslchiraa.Helpers.cancel = function(event) {
    event.stopPropagation();
    event.preventDefault();
    return false;
};

/**
 * set localization to users default browser language. Uses "en" as fallback.
 */
Waslchiraa.Helpers.setDefaultLanguage = function() {

    var language = null;
    var languages = null;
    var storedLanguage = amplify.store('language');

    // try to restore old language selection
    if (!storedLanguage) {
        language = getPreferredLanguage();
        languages = TAPi18n.getLanguages();
        if (!languages[language]) {
            language = "en";
        }
    }
    else {
        language = storedLanguage;
    }

    Waslchiraa.Helpers.setLanguage(language);
};

/**
 * set translations to specified <language>
 * @param {String} language
 */
Waslchiraa.Helpers.setLanguage = function(language) {
    Meteor.defer(function() {
        amplify.store('language', language);
        TAPi18n.setLanguageAmplify(language).done(function() {
            T9n.setLanguage(language);
            Meteor.call('set_default_language', language);
        }).fail(function(error) {
            console.log(error);
        });
    });
};

/**
 * creates an info popup on top of the main menu.
 * Should be used instead of "alert()" messages.
 *
 * @param {String} message
 */
Waslchiraa.Helpers.infoMessage = function(message) {
    Waslchiraa.Collections.Messages.insert({
        "message": message,
        "type": "info"
    });
};

/**
 * creates an error message on top of the main menu.
 * Should be used instead of "alert()" messages.
 *
 * @param {String} message
 */
Waslchiraa.Helpers.errorMessage = function(message) {
    Waslchiraa.Collections.Messages.insert({
        "message": message,
        "type": "error"
    });
};

/**
 * collect voucher details for the given campain
 *
 * @param {String} campaignId
 * @return {Object} (available, total, reserved, redeemed)
 * @reactive
 */
Waslchiraa.Helpers.getVouchers = function(campaignId) {
    var result = {
        'available': 0,
        'total': 0,
        'reserved': 0,
        'redeemed': 0
    };
    var campaign = Waslchiraa.Collections.Campaigns.findOne({
        _id: campaignId
    });
    var now = new Date();

    if (campaign) {
        result = {
            'total': campaign.quantity,
            'reserved': Waslchiraa.Collections.Vouchers.find({
                'campaignId': campaignId,
                'redeemed': null
            }).count(),
            'redeemed': Waslchiraa.Collections.Vouchers.find({
                'campaignId': campaignId,
                'redeemed': {
                    $lt: now
                }
            }).count(),
        };
        result.available = result.total - (result.redeemed + result.reserved);
    }

    return result;
};

// ----- template helpers ------------------------------------------------------
/**
 * check if <a> equals <b>
 *
 * @param {String} a
 * @param {String} b
 * @return {Boolean}
 */
Template.registerHelper("eq", function(a, b) {
    return a == b;
});

/**
 * get the current pageTitle from global Session object
 *
 * @return {String}
 * @reactive
 */
Template.registerHelper('pageTitle', function() {
    return Session.get('pageTitle');
});

/**
 * @param {String} userId
 * @return {Object} user or null
 * @reactive
 */
Template.registerHelper('getUser', function(userId) {
    return Meteor.users.findOne(userId);
});

/**
 * @return {Object} user or null
 * @reactive
 */
Template.registerHelper('currentUserEmail', function() {
    return Meteor.user().emails[0].address;
});

/**
 * @param {String} categoryId
 * @return {Object} user or null
 * @reactive
 */
Template.registerHelper('getCategory', function(categoryId) {
    return Waslchiraa.Collections.Categories.findOne(categoryId);
});

/**
 * Count campaigns related to given <category>. If no category is set, this will
 * count ALL campaigns.
 *
 * @param {Object} category
 * @return {Number} campaign count
 * @reactive
 */
Template.registerHelper('countCampaigns', function(category) {
    if (category) {
        return Waslchiraa.Collections.Campaigns.find({
            categoryId: category._id
        }).count();
    }
    return Waslchiraa.Collections.Campaigns.find().count();
});

/**
 * @param {Object} date
 * @return {String} formatted date
 * @reactive
 */
Template.registerHelper('formatDate', function(date) {
    if (date) {
        // :TODO: enable locale support for momentjs
        //return moment(date).locale(TAPi18n.getLanguage()).format('LL');
        return moment(date).format('LL');
    }
    else {
        return '-';
    }
});

/**
 * @see Waslchiraa.Helpers.getVouchers
 * @param {String} campaignId
 * @reactive
 */
Template.registerHelper('getVouchers', function(campaignId) {
    return Waslchiraa.Helpers.getVouchers(campaignId);
});

/**
 * returns the available vouchers for given <campaignId>
 *
 * @see Waslchiraa.Helpers.getVouchers
 * @param {String} campaignId
 * @return {Number}
 * @reactive
 */
Template.registerHelper('availableVouchersCount', function(campaignId) {
    return Waslchiraa.Helpers.getVouchers(campaignId).available;
});

/**
 * @see Waslchiraa.Helpers.getVouchers
 * @param {String} campaignId
 * @return {Boolean}
 * @reactive
 */
Template.registerHelper('hasAvailableVouchers', function(campaignId) {
    return Waslchiraa.Helpers.getVouchers(campaignId).available > 0;
});

/**
 * returns whether the user as reserved a voucher
 * for the given <campaignId>, or not
 *
 * @param {String} campaignId
 * @return {Boolean}
 * @reactive
 */
Template.registerHelper('isReservedByUser', function(campaignId) {
    return Waslchiraa.Collections.Vouchers.find({
        campaignId: campaignId,
        userId: Meteor.userId()
    }).count() > 0;
});

/**
 * returns a url to google maps for the given <campaign>
 *
 * @param {Object} campaign
 * @return {String} url
 */
Template.registerHelper('getMapUrl', function(campaign) {
    return campaign ? 'https://www.google.de/maps/place/' + campaign.street + '+' + campaign.number + '+' + campaign.zipcode + '+' + campaign.city + '+' + campaign.country : '';
});

/**
 * load the localized version of a <field> of <object>. Returns "" if no translation
 * is available for the current language.
 *
 * @param {Object} object
 * @param {String} field
 * @return {String} translation
 * @reactive
 */
Template.registerHelper('translateField', function(object, field) {
    var lang = TAPi18n.getLanguage();
    if (object && object[field] && object[field][lang]) {
        return object[field][lang];
    }
    return '';
});

