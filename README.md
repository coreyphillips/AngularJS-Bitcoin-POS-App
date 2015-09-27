## Synopsis

This is an AngularJS, POS App that accepts Bitcoin and most cryptocurrencies available on ShapeShift.io as payment. This project is still a work in progress and is currently meant for experimental and learning purposes only. Please use at your own risk.

## Motivation

This app was created to build and expand the authors knowledge of AngularJS and to explore available API's in the cryptocurrency space. If able, please offer productive critiques and feedback for further improvement of the app.

## Installation/Setup

For Merchant use, navigate to the "config/data.json" file. There are two required and one optional fields in this file at the moment (Required:items, Required:defaultCoin, Optional:addresses). The items field is meant to store merchant items (i.e. coffee, tea, concert ticket, etc.). The defaultCoin field is meant to store the primary address of the merchant for payment deposits. The addresses field is optional and is meant to store a list of additional merchant Bitcoin addresses that can be viewed on the #/search page from the "Quick Search" drop-down.

## Possible Use-Cases

Bitcoin->Bitcoin Payments:
- The customer selects the "Pay with Bitcoin" option to pay the merchant directly in Bitcoin.

Altcoin->Bitcoin Payments:
- The customer selects the "Pay with Altcoin" option to pay the merchant in Bitcoin with any available altcoin via ShapeShift.io.

Altcoin->Altcoin Payments
- The customer selects the "Pay with {{defaultCoin}}" option to pay the merchant in {{defaultCoin}} with any available altcoin via ShapeShift.io.

Bitcoin->Coinbase Instant Exchange Bitcoin Address->USD Payments:
- Note: https://support.coinbase.com/customer/portal/articles/2021569-what-is-instant-exchange-
- The customer selects the "Pay with Bitcoin" option to pay the merchant with Bitcoin to the merchant's Instant Exchange Bitcoin Address from Coinbase. The payment is then immediately exchanged for USD.

Altcoin->Coinbase Instant Exchange Bitcoin Address->USD Payments:
- Note: https://support.coinbase.com/customer/portal/articles/2021569-what-is-instant-exchange-
- The customer selects the "Pay with Altcoin" option to pay the merchant with Bitcoin withh any available altcoin via ShapeShift.io to the merchant's Instant Exchange Bitcoin Address from Coinbase. The payment is then immediately exchanged for USD.

## Future Improvements/Known Limitations
- Create support for more altcoins on the #/search page.
- Create support for altcoins available on ShapeShift.io that require more than an address for a successful transaction (i.e. Monero).
- The #/search page currently uses "https://btc.blockr.io/api/v1/address/txs/'+ address" to get address transactions. Unfortunately, this api does not appear to list 0 confirmation transactions. Any suggestions on an api that also lists 0 confirmation transactions would be greatly appreciated.
- $rootscope was not used throughout the app due to several suggestions that it be avoided. However, accessing parent scopes eventually become an issue. There are instances where $modalInstance is used to work around this, but it is less than ideal. This issue also seems to prevent the $scope.items array from being cleared after each transaction requiring the user to click "Remove All Items" instead. Any suggestions on how to best access parent scope would be greatly appreciated.

## Video Walk-through
- https://youtu.be/DoZfZQyTCHs
