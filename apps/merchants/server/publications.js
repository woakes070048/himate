// ----- campaigns --------------------------------------------------------------
/**
 * publish all campaigns owned by the current user/merchant
 */
Meteor.publish('campaigns', function() {

    // security checks
    if (!Roles.userIsInRole(this.userId, 'merchant')) {
        return this.ready();
    }

    // action
    return Waslchiraa.Collections.Campaigns.find({
        userId: this.userId
    }, {
        fields: {
            title: 1,
            shortDescription: 1,
            description: 1,
            conditions: 1,
            imageId: 1,
            categoryId: 1,
            created: 1,
            published: 1,
            quantity: 1,
            street: 1,
            number: 1,
            zipcode: 1,
            city: 1,
            country: 1
        }
    });
});

/**
 *
 */
Meteor.publish("voucher_vouchers", function(campaignId) {
    check(campaignId, String);
    return Waslchiraa.Collections.Vouchers.find({
        'campaignId': campaignId
    });
});

/**
 *
 */
Meteor.publish('voucher_users', function(campaignId) {
    check(campaignId, String);

    var campaigns = Waslchiraa.Collections.Vouchers.find({
        'campaignId': campaignId
    });
    var userIds = campaigns.map(function(v) {
        return v.userId;
    });
    var result = Meteor.users.find({
        _id: {
            $in: userIds
        }
    }, {
        fields: {
            username: 1,
            'profile.firstName': 1,
            'profile.lastName': 1
        }
    });
    return result;
});

/**
 *
 */
Meteor.publish('vouchers', function() {

    // security checks
    if (!Roles.userIsInRole(this.userId, 'merchant')) {
        return this.ready();
    }

    var campaigns = Waslchiraa.Collections.Campaigns.find({
        userId: this.userId
    });

    var campaignIds = campaigns.map(function(v) {
        return v._id;
    });

    return Waslchiraa.Collections.Vouchers.find({
        campaignId: {
            $in: campaignIds
        }
    });
});

// ----- categories ------------------------------------------------------------
/**
 * publish all categories
 */
Meteor.publish('categories', function() {

    // security checks
    if (!Roles.userIsInRole(this.userId, 'merchant')) {
        return this.ready();
    }

    // action
    return Waslchiraa.Collections.Categories.find();
});

/**
 *
 */
Meteor.publish('images', function() {

    // security checks
    if (!Roles.userIsInRole(this.userId, 'merchant')) {
        return this.ready();
    }

    return Waslchiraa.Collections.Images.find({
        userId: this.userId
    });
});
