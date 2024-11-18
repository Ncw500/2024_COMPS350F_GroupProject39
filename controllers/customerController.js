const RestaurantModel = require('../models/restaurantModel'); // Import the Restaurant model to interact with restaurant data
const OrderModel = require('../models/orderModel'); // Import the Order model to manage order data
const AccountBalanceModel = require('../models/accountBalanceModel'); // Import the AccountBalance model to manage account balances
const OrderTrackingModel = require('../models/orderTrackingModel'); // Import the OrderTracking model to track orders
const RechargeCardModel = require('../models/rechargeCardModel'); // Import the RechargeCard model to manage recharge cards

class customerController {
    // This method renders a view with default options and any additional options provided
    async renderWithDefaults(req, res, view, options = {}) {
        let user = req.session.user; // Get the user from the session

        // Define default rendering options
        const defaults = {
            error: '', // Default error message
            success: '', // Default success message
            user: user, // Current user
            restaurantsList: [], // List of restaurants, initially empty
            cart: [], // Shopping cart, initially empty
            itemTotalPrice: 0, // Total price of items in the cart, initially zero
            orders: [], // List of orders, initially empty
            accountBalance: 0, // User's account balance, initially zero
            menuItemList: [], // List of menu items for the restaurant, initially empty
            orderTracking: [], // Tracking information for orders, initially empty
            updatedRestaurantID: '', // ID of the restaurant being updated, initially empty
        };

        // Combine default options with additional options
        const renderOptions = { ...defaults, ...options };
        res.render(view, renderOptions); // Render the specified view with the options
    }

    // This method renders the menu page with a list of restaurants
    async renderMenuPage(req, res, options = {}) {
        const restaurantModel = new RestaurantModel(); // Create an instance of the Restaurant model
        let restaurantsList = undefined; // Initialize restaurantsList
        let error = undefined; // Initialize error message

        // Try to fetch all restaurants
        try {
            restaurantsList = await restaurantModel.findAllRestaurant(); // Fetch restaurants from the database
        } catch (err) {
            error = 'An error occurred while fetching restaurant data'; // Handle any errors during the fetch
        }
        
        // Prepare render options with fetched data or error
        const renderOptions = { restaurantsList, error, ...options };
        // Render the menu page with the specified options
        await this.renderWithDefaults(req, res, 'menuPage', renderOptions);
    }

    // This method adds an item to the cart
    async addToCart(req, res) {
        // Destructure item details from the request body
        let { itemID, itemName, itemPrice, itemQuantity, restaurantID, itemPicture } = req.body;
        
        // Ensure itemQuantity is a number by parsing it
        itemQuantity = parseInt(itemQuantity, 10); // Convert itemQuantity to an integer

        let totalQuantity = 0; // Initialize total quantity of the item
        const index = req.session.cart.findIndex(item => item.itemID === itemID); // Find the item in the cart

        // Check if item is not already in the cart
        if (index === -1) {
            // If item is not in the cart, add it to the cart
            req.session.cart.push({ 
                restaurantID: restaurantID, 
                itemID: itemID, 
                itemName: itemName, 
                itemPrice: itemPrice, 
                itemQuantity: itemQuantity, 
                itemPicture: itemPicture 
            });
            totalQuantity = itemQuantity; // Set totalQuantity to the quantity added
        } else {
            // If item is already in the cart, update its quantity
            req.session.cart[index].itemQuantity += itemQuantity; // Increase the existing quantity
            totalQuantity = req.session.cart[index].itemQuantity; // Update totalQuantity
        }

        let updatedRestaurantID = restaurantID; // Track the restaurant ID for UI updates

        // Render the menu page with a success message about the added item
        await this.renderMenuPage(req, res, { success: `Item ${itemName} added to cart, current quantity : ${totalQuantity}`, updatedRestaurantID });
    }

    // This method renders the cart page
    async renderCartPage(req, res, options = {}) {

        // Check if the user is logged in
        if (req.session.user === undefined) {
            res.redirect('/user/loginPage'); // Redirect to the login page if not logged in
            return; // Exit the method
        }

        let cart = req.session.cart; // Get the shopping cart from the session
        let items = []; // Initialize items array
        // Calculate the total price of items in the cart
        let itemTotalPrice = cart.reduce((sum, item) => sum + item.itemPrice * item.itemQuantity, 0); 

        const accountBalanceModel = new AccountBalanceModel(); // Create an instance of the AccountBalance model
        // Fetch the user's account balance
        let accountBalance = await accountBalanceModel.getAccountBalance(req.session.user.userID);

        // Prepare render options with cart details and account balance
        const renderOptions = { cart: req.session.cart, itemTotalPrice: itemTotalPrice, accountBalance: accountBalance, ...options };
        // Render the cart page with the specified options
        await this.renderWithDefaults(req, res, 'cartPage', renderOptions);
    }

    // This method renders the checkout page
    async renderCheckoutPage(req, res, options = {}) {
        // Destructure item details from the request body
        let { itemID, itemName, itemPrice, itemQuantity } = req.body;

        // Check if the cart is empty
        if (req.session.cart.length === 0) {
            // If the cart is empty, render the cart page with an error
            await this.renderCartPage(req, res, { error: 'Cart is empty' });
            return; // Exit the method
        } else {
            let items = []; // Initialize items array
            // Loop through the cart to prepare items for checkout
            for (let i = 0; i < req.session.cart.length; i++) {
                items.push({ itemID: itemID[i], itemName: itemName[i], itemPrice: itemPrice[i], itemQuantity: itemQuantity[i] });
                req.session.cart[i].itemQuantity = itemQuantity[i]; // Update cart item quantities
            }
            // Calculate total price for items being checked out
            let itemTotalPrice = items.reduce((sum, item) => sum + item.itemPrice * item.itemQuantity, 0);

            // Payment processing
            const accountBalanceModel = new AccountBalanceModel(); // Create an instance of the AccountBalance model
            // Fetch user's account balance
            let accountBalance = await accountBalanceModel.getAccountBalance(req.session.user.userID);

            // Prepare render options with checkout details
            const renderOptions = { cart: req.session.cart, itemTotalPrice: itemTotalPrice, accountBalance, ...options };
            // Render the checkout page with the specified options
            await this.renderWithDefaults(req, res, 'checkoutPage', renderOptions);
        }
    }

    // async renderPaymentPage(req, res, options = {}) {
    //     // This method would render the payment page (currently commented out)

    //     const accountBalanceModel = new AccountBalanceModel(); // Create an instance of the AccountBalance model
    //     // Fetch user's account balance
    //     let accountBalance = await accountBalanceModel.getAccountBalance(req.session.user.userID);

    //     // Render the payment page with the account balance
    //     await this.renderWithDefaults(req, res, 'paymentPage', { accountBalance: accountBalance, options });
    // }

    // This method handles the payment process
    async payment(req, res) {
        // Destructure payment and user information from the request body
        let {
            payeeFirstName,
            payeeLastName,
            address,
            region,
            country,
            phone,
            deliveryMethod,
        } = req.body;

        // Store checkout information in the session for later use
        req.session.checkoutInfo = {
            payeeFirstName,
            payeeLastName,
            address,
            region,
            country,
            phone,
            deliveryMethod,
        };

        const orderModel = new OrderModel(); // Create an instance of the Order model
        let cart = req.session.cart; // Get the cart from the session
        let itemTotalPrice = 0; // Initialize the total price for items in the cart

        // Loop through each item in the cart to calculate total price
        for (const item of cart) {
            let itemPrice = await this.getItemPriceByID(item.itemID); // Get the price of each item by calling getItemPriceByID method
            itemTotalPrice += itemPrice * item.itemQuantity; // Accumulate the total price
        }

        let paymentMethod = req.body.paymentMethod; // Get the payment method selected by the user
        let paymentResult = false; // Initialize the payment result as false

        // Handle balance payment method
        if (paymentMethod === 'balance') {
            const accountBalanceModel = new AccountBalanceModel(); // Create an instance of the AccountBalance model
            // Fetch the user's account balance
            let accountBalance = await accountBalanceModel.getAccountBalance(req.session.user.userID);
            // Check if the account balance is sufficient for the payment
            if (accountBalance.balance < itemTotalPrice) {
                // If insufficient balance, render the cart page with an error
                await this.renderCartPage(req, res, { error: 'Insufficient account balance' });
                return; // Exit the method
            } else {
                // Deduct the total price from the user's account balance
                await accountBalanceModel.updateAccountBalance(req.session.user.userID, accountBalance.balance - itemTotalPrice);
                paymentResult = true; // Set paymentResult to true indicating payment was successful
            }
        } else if (paymentMethod === 'creditCard') {
            // Handle credit card payment (implementation to be added)
        } else if (paymentMethod === 'debitCard') {
            // Handle debit card payment (implementation to be added)
        } else if (paymentMethod === 'paypal') {
            // Handle PayPal payment (implementation to be added)
        }
        // Check if payment was successful
        if (paymentResult === true) {
            // Create an order object with details of the order
            const order = {
                userID: req.session.user.userID, // User who placed the order
                restaurantID: cart[0].restaurantID, // Restaurant associated with the order
                menuItems: [], // List of menu items in the order, initially empty
                orderStatus: 'Pending', // Initial order status
                payeeInfo: { // Information about the payee
                    firstName: req.session.checkoutInfo.payeeFirstName,
                    lastName: req.session.checkoutInfo.payeeLastName,
                    phone: req.session.checkoutInfo.phone,
                },
                deliveryAddress: { // Delivery address for the order
                    address: req.session.checkoutInfo.address,
                    region: req.session.checkoutInfo.region,
                    country: req.session.checkoutInfo.country,
                },
                deliveryMethod: req.session.checkoutInfo.deliveryMethod, // Delivery method for the order
                paymentMethod: paymentMethod, // Payment method used
                totalAmount: itemTotalPrice, // Total amount to be paid
            };

            // Populate the order with menu items and their details
            for (const item of cart) {
                let itemPrice = await this.getItemPriceByID(item.itemID); // Fetch item price
                order.menuItems.push({ // Add item details to menuItems array
                    _id: item.itemID,
                    itemName: item.itemName,
                    itemPrice: itemPrice,
                    itemQuantity: item.itemQuantity,
                });
            }

            req.session.cart = []; // Clear the cart after successful payment

            try {
                // Try to create the order in the database
                let result = await orderModel.createOrder(order); // Call the createOrder method from the Order model

                const orderTrackingModel = new OrderTrackingModel(); // Create an instance of the OrderTracking model
                // Prepare tracking details for the order
                let orderTracking = {
                    orderID: result.id, // The ID of the newly created order
                    customerID: req.session.user.userID, // The user who made the order
                    orderStatus: { // Status details of the order
                        status: result.orderStatus,
                        updateTime: result.createAt, // Time of order creation
                    },
                };
                // Create the order tracking record
                await orderTrackingModel.createOrderTracking(orderTracking);

                // Render the cart page with a success message
                await this.renderCartPage(req, res, { success: `Order created, you can check your order detail from order tracking page` });
            } catch (err) {
                // If an error occurs while creating the order, render the cart page with an error
                await this.renderCartPage(req, res, { error: 'An error occurred while creating order' });
                return; // Exit the method to prevent further execution
            }
        } else {
            // If payment was not successful, render the checkout page with an error
            await this.renderCheckoutPage(req, res, { error: 'An error occurred while processing payment' });
        }
    }

    // This method retrieves the price of an item by its ID
    async getItemPriceByID(itemID) {
        const restaurantModel = new RestaurantModel(); // Create an instance of the Restaurant model
        // Fetch all restaurants to find the item
        let restaurantList = await restaurantModel.findAllRestaurant();
        // Loop through each restaurant to find the item
        for (const restaurant of restaurantList) {
            // Find the item within the restaurant's menuItems based on the itemID
            const foundItem = restaurant.menuItems.find(item => item._id.equals(itemID)); // Use equals method to compare ObjectId
            if (foundItem) {
                return foundItem.itemPrice; // Return the found item's price
            }
        }
        return null; // If no item was found, return null
    }

    // This method renders the order confirmation page
    async renderOrderConfirmationPage(req, res, options = {}) {

        const orderModel = new OrderModel(); // Create an instance of the Order model
        let orders = undefined; // Initialize orders variable
        let error = undefined; // Initialize error message

        try {
            // Fetch the user's orders from the database, sorted by creation date
            orders = await orderModel.findOrderByUserID(req.session.user.userID, { createAt: -1 });
            req.session.orders = orders; // Store fetched orders in the session
        } catch (err) {
            error = 'An error occurred while fetching order data'; // Handle errors during fetching
        }

        // Prepare render options including fetched orders and any error
        const renderOptions = { orders, error, ...options };

        // Render the order confirmation page with the specified options
        await this.renderWithDefaults(req, res, 'orderConfirmationPage', renderOptions);
    }

    // This method removes an item from the cart
    async removeFromCart(req, res) {
        // Check if the request method is DELETE
        if (req.body._method === 'DELETE') {
            let { itemID } = req.body; // Destructure itemID from the request body
            // Find the index of the item in the cart
            let index = req.session.cart.findIndex(item => item.itemID === itemID);
            let itemName = req.session.cart[index].itemName; // Get the name of the item to remove
            req.session.cart.splice(index, 1); // Remove the item from the cart using splice
            // Render the cart page with a success message indicating the item was removed
            await this.renderCartPage(req, res, { success: `Item ${itemName} removed from cart` });
        } else {
            // If the request method is not DELETE, render the cart page with an error
            await this.renderCartPage(req, res, { error: 'Invalid request!' });
        }
    }

    // This method renders the item details page
    async renderItemDetailsPage(req, res, options = {}) {
        // Assume this string is obtained from req.body.order
        let orderID = req.body.orderID; // Get the orderID from the request
        let menuItemList = []; // Initialize menuItemList for items details
        // Find the specific order in the user's orders stored in the session
        let order = req.session.orders.find(order => order._id === orderID);

        const restaurantModel = new RestaurantModel(); // Create an instance of the Restaurant model
        // Loop through the menu items in the order to get their details
        for (const item of order.menuItems) {
            // Find the menu item in the specific restaurant by restaurantID and itemID
            let restaurant = await restaurantModel.findMenuItemByRestaurantIDAndItemID(order.restaurantID, item._id);
            // Filter the menu items to get the specific item based on _id
            let menuItem = restaurant.menuItems.filter(menuItem => menuItem.id === item._id);
            // Check if the menuItem array has any items
            if (menuItem.length > 0) {
                let itemQuantity = item.itemQuantity; // Get the quantity of the item
                menuItem[0].itemQuantity = itemQuantity; // Set the itemQuantity in the menuItem
                menuItemList.push(menuItem[0]); // Add the menuItem to the menuItemList
            }
        }

        let item = undefined; // Initialize item
        let error = undefined; // Initialize error message

        // Prepare render options with the menu item list and any error
        const renderOptions = { menuItemList, error, ...options };
        // Render the item details page with the specified options
        await this.renderWithDefaults(req, res, 'itemDetailsPage', renderOptions);
    }

    // This method renders the order history page
    async renderOrderHistoryPage(req, res, options = {}) {
        const orderModel = new OrderModel(); // Create an instance of the Order model
        let orders = undefined; // Initialize orders variable
        let error = undefined; // Initialize error message

        try {
            // Fetch the user's orders from the database, sorted by creation date
            orders = await orderModel.findOrderByUserID(req.session.user.userID, { createAt: -1 });
        } catch (err) {
            error = 'An error occurred while fetching order data'; // Handle errors during fetching
        }
        // Prepare render options with orders and any error
        const renderOptions = { orders, error, ...options };
        // Render the order history page with the specified options
        await this.renderWithDefaults(req, res, 'orderHistoryPage', renderOptions);
    }

    // This method renders the order tracking page
    async renderOrderTrackingPage(req, res, options = {}) {
        let orderID = req.body.orderID; // Get the orderID from the request body

        const orderTrackingModel = new OrderTrackingModel(); // Create an instance of the OrderTracking model
        // Fetch order tracking information based on orderID
        let orderTracking = await orderTrackingModel.getOrderTaccking(orderID);
        orderTracking = orderTracking[0]; // Get the first order tracking object
        // Prepare render options with order tracking information
        const renderOptions = { orderTracking, options };

        // Render the order tracking page with the specified options
        await this.renderWithDefaults(req, res, 'orderTrackingPage', renderOptions);
    }

    // This method renders the recharge card redemption page
    async renderRedeemRechargeCardPage(req, res, options = {}) {
        // Render the redeem recharge card page with the specified options
        await this.renderWithDefaults(req, res, 'redeemRechargeCardPage', options);
    }

    // This method handles redeeming a recharge card
    async redeemRechargeCard(req, res) {
        let { rechargeCardCode } = req.body; // Destructure the rechargeCardCode from the request body

        try {
            const rechargeCardModel = new RechargeCardModel(); // Create an instance of the RechargeCard model
            // Fetch the recharge card details by its code
            let result = await rechargeCardModel.getRechargeCardByCode(rechargeCardCode);

            // Check if the card is valid and unused
            if (result && result.status === 'unused') {
                // Update the status of the recharge card to 'Redeemed'
                await rechargeCardModel.updateRechargeCardStatus(result._id, 'Redeemed', req.session.user.userID);
                const accountBalanceModel = new AccountBalanceModel(); // Create an instance of the AccountBalance model
                // Update the user's account balance by adding the value of the redeemed card
                await accountBalanceModel.updateAccountBalance(req.session.user.userID, result.value);
                // Render the redeem page with a success message showing the new balance
                await this.renderRedeemRechargeCardPage(req, res, { success: `Recharge card redeemed successfully, your current balance is \${result.value}` });
            } else {
                // If card is invalid or already used, render the redeem page with an error
                await this.renderRedeemRechargeCardPage(req, res, { error: 'Invalid recharge card number' });
            }
        } catch (err) {
            // If an error occurs during the redemption, render the redeem page with an error
            await this.renderRedeemRechargeCardPage(req, res, { error: 'An error occurred while redeeming recharge card' });
        }
    }

}

// Exporting a new instance of AdminController for use in other parts of the application
module.exports = new customerController();