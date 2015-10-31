/**
 * Vouchers
 */
Meteor.methods({

    /**
     * add the <doc> to the vouchers collection
     * @param {Object} doc
     */
    "reserve_voucher": function(voucherId) {

        // security checks
        if (!Roles.userIsInRole(Meteor.userId(), ['customer'])) {
            throw new Meteor.Error("not-authorized");
        }

        var voucher = Vouchers.findOne(voucherId);

        if (!voucher) {
            throw new Meteor.Error("not-found");
        }


        if (VoucherCodes.findOne({
            "userId": this.userId,
            "voucherId": voucher._id
        })) {
            throw new Meteor.Error("allready-reserved");
        }


        if (VoucherCodes.find({ "voucherId": voucher._id }).count() >= voucher.quantity) {
            throw new Meteor.Error("no_vouchers_available");
        }


        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var code = "";
        do {
            for (var i = 0; i < 6; i++) {
                code += possible.charAt(Math.floor(Math.random() * possible.length));
            }
        }
        while (Vouchers.findOne({"code": code}));

        VoucherCodes.insert({
            "code": code,
            "userId": this.userId,
            "voucherId": voucher._id
        });

        var email = {
            to: Meteor.user().emails[0].address,
            from: TAPi18n.__('email_reserve_from'),
            subject: TAPi18n.__('email_reserve_subject', {
                title: voucher.title
            }),
            text: TAPi18n.__('email_reserve_content', {
                code: code
            }),
        };

        Email.send(email);

        return code;
    },



    'get_user_voucher_codes': function() {
        // :TODO: refactor to pub/sub
        // collect data
        var voucherCodes = VoucherCodes.find({
            userId: Meteor.userId
        });

        voucherCodes = voucherCodes.map(function(vc) {
            vc.voucher = Vouchers.findOne(vc.voucherId);
            return vc;
        });

        return voucherCodes;
    },



    'redeemVoucher': function (code) {

      check(code, String);

      // security checks
      if (!Roles.userIsInRole(Meteor.userId(), ['merchant'])) {
          throw new Meteor.Error("not-authorized");
      }

      var voucherCode = VoucherCodes.findOne({
        code: code
      });

      if (!voucherCode) {
          throw new Meteor.Error("not-found");
      }

      if (voucherCode.redeemed) {
          throw new Meteor.Error("already-redeemed");
      }

      var voucher = Vouchers.findOne({
          userId: this.userId,
          _id: voucherCode.voucherId
      });

      if (!voucher) {
          throw new Meteor.Error("not-found");
      }

      VoucherCodes.update({
          code: code,
          voucherId: voucherCode.voucherId
      }, {
          $set: {
            redeemed: new Date()
          }
      });

      return true;
    }
});
