/**
 * server methods for Meteor.users
 */
Meteor.methods({

    /**
     * update the given <doc>
     * @param {Object} doc
     * @param {String} id
     */
    "users_edit": function(doc, id) {

        // security check
        if (!Meteor.userId() || Meteor.userId() != id) {
            throw new Meteor.Error("not-authorized");
        }

        // check user input
        check(id, String);
        check(doc, Object);
        check(doc.$set, {
            'profile.company': String,
            'profile.salutation': String,
            'profile.firstName': String,
            'profile.lastName': String,
            'profile.street': String,
            'profile.number': String,
            'profile.zipcode': String,
            'profile.city': String,
            'profile.country': String,
            'profile.tel': Match.Optional(String),
        });
        check(doc.$unset, Match.Optional({
            'profile.tel': String
        }));

        // save update
        var result = Meteor.users.update(Meteor.userId(), doc);

        HiMate.Collections.Activities.insert({
            username: Meteor.user().username,
            userId: Meteor.userId(),
            entryId: Meteor.userId(),
            role: (Meteor.user().roles ? Meteor.user().roles[0] : 'unknown'),
            route: 'pages_users_edit',
            action: 'users_update'
        });

        return result;
    }
});

