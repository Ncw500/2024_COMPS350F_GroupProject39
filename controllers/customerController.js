
const RestaurantModel = require('../models/restaurantModel');
const OrderModel = require('../models/orderModel');
const AccountBalanceModel = require('../models/accountBalanceModel');

class AdminController {
    async renderWithDefaults(req, res, view, options = {}) {
        let user = req.session.user;

        const defaults = {
            error: '',
            success: '',
            user: user,
            restaurantsList: [],
            cart: [],
            itemTotalPrice: 0,
            orders: [],
            accountBalance: 0,
        };

        const renderOptions = { ...defaults, ...options };
        res.render(view, renderOptions);
    }

    async renderMenuPage(req, res, options = {}) {
        const restaurantModel = new RestaurantModel();
        let restaurantsList = undefined;
        let error = undefined;

        try {
            restaurantsList = await restaurantModel.findAllRestaurant();
        } catch (err) {
            error = 'An error occurred while fetching restaurant data';
        }
        const renderOptions = { restaurantsList, error, ...options };
        await this.renderWithDefaults(req, res, 'menuPage', renderOptions);
    }

    async addToCart(req, res) {
        let { itemID, itemName, itemPrice, itemQuantity, restaurantID } = req.body;

        // 确保 itemQuantity 是数值类型
        itemQuantity = parseInt(itemQuantity, 10); // 转换为数字

        let totalQuantity = 0;
        const index = req.session.cart.findIndex(item => item.itemID === itemID);

        if (index === -1) { // 检查条件的准确性
            req.session.cart.push({ restaurantID: restaurantID, itemID: itemID, itemName: itemName, itemPrice: itemPrice, itemQuantity: itemQuantity });
            totalQuantity = itemQuantity;
        } else {
            req.session.cart[index].itemQuantity += itemQuantity;
            totalQuantity = req.session.cart[index].itemQuantity;
        }

        await this.renderMenuPage(req, res, { success: `Item ${itemName} added to cart, current quantity : ${totalQuantity}` });
    }

    async renderCartPage(req, res, options = {}) {

        let cart = req.session.cart;
        let items = [];
        let itemTotalPrice = cart.reduce((sum, item) => sum + item.itemPrice * item.itemQuantity, 0);

        const renderOptions = { cart: req.session.cart, itemTotalPrice: itemTotalPrice, ...options };
        await this.renderWithDefaults(req, res, 'cartPage', renderOptions);
    }

    async renderCheckoutPage(req, res, options = {}) {
        if (req.session.cart.length === 0) {
            await this.renderCartPage(req, res, { error: 'Cart is empty' });
            return;
        } else {
            let cart = req.session.cart;
            let items = [];
            let itemTotalPrice = cart.reduce((sum, item) => sum + item.itemPrice * item.itemQuantity, 0);

            const renderOptions = { cart: req.session.cart, itemTotalPrice: itemTotalPrice, ...options };
            await this.renderWithDefaults(req, res, 'checkoutPage', renderOptions);
        }
    }

    async getItemPriceByID(itemID) {
        const restaurantModel = new RestaurantModel();
        let restaurantList = await restaurantModel.findAllRestaurant();
        for (const restaurant of restaurantList) {
            const foundItem = restaurant.menuItems.find(item => item._id.equals(itemID)); // 使用 equals 方法比较 ObjectId
            if (foundItem) {
                return foundItem.itemPrice; // 返回找到的 item's price
            }
        }
        return null; // 如果没有找到返回 null
    }

    async renderPaymentPage(req, res, options = {}) {
        let {
            room,
            floor,
            building,
            street,
            town,
            region,
            deliveryMethod,
        } = req.body;

        req.session.checkoutInfo = {
            room,
            floor,
            building,
            street,
            town,
            region,
            deliveryMethod,
        };


        const accountBalanceModel = new AccountBalanceModel();
        let accountBalance = await accountBalanceModel.getAccountBalance(req.session.user.userID);

        await this.renderWithDefaults(req, res, 'paymentPage', { accountBalance: accountBalance, ...options });
    }

    async payment(req, res) {
        let cart = req.session.cart;
        let itemTotalPrice = 0;


        for (const item of cart) {
            let itemPrice = await this.getItemPriceByID(item.itemID);
            itemTotalPrice += itemPrice * item.itemQuantity;
        }

        let paymentMethod = req.body.paymentMethod;
        let paymentResult = false;
        if (paymentMethod === 'balance') {
            const accountBalanceModel = new AccountBalanceModel();
            let accountBalance = await accountBalanceModel.getAccountBalance(req.session.user.userID);
            if (accountBalance.balance < itemTotalPrice) {
                await this.renderPaymentPage(req, res, { error: 'Insufficient account balance' });
                return;
            } else {
                await accountBalanceModel.updateAccountBalance(req.session.user.userID, accountBalance.balance - itemTotalPrice);
                paymentResult = true;
            }
        } else if (paymentMethod === 'creditCard') {
            //
        } else if (paymentMethod === 'debitCard') {
            // 
        } else if (paymentMethod === 'paypal') {
            //
        }
        if (paymentResult === true) {
            // create order on mongodb
            const orderModel = new OrderModel();
            const order = {
                userID: req.session.user.userID,
                restaurantID: cart[0].restaurantID,
                menuItem: {
                    _id: cart[0].itemID,
                    itemName: cart[0].itemName,
                    itemPrice: cart[0].itemPrice,
                },
                orderStatus: 'Pending',
                deliveryAddress: {
                    room: req.session.checkoutInfo.room,
                    floor: req.session.checkoutInfo.floor,
                    building: req.session.checkoutInfo.building,
                    street: req.session.checkoutInfo.street,
                    town: req.session.checkoutInfo.town,
                    region: req.session.checkoutInfo.region,
                },
                deliveryMethod: req.session.checkoutInfo.deliveryMethod,
                paymentMethod: paymentMethod,
                totalAmount: itemTotalPrice,
            };

            req.session.cart = [];

            try {
                await orderModel.createOrder(order); // 尝试创建订单
                await this.renderCartPage(req, res, { success: `Order created, total price: ${itemTotalPrice}` });
            } catch (err) {
                await this.renderCartPage(req, res, { error: 'An error occurred while creating order' });
                return; // 退出，防止继续执行
            }
        } else {
            await this.renderPaymentPage(req, res, { error: 'An error occurred while processing payment' });
        }

    }

    async renderOrderConfirmationPage(req, res, options = {}) {
        const orderModel = new OrderModel();
        let orders = undefined;
        let error = undefined;

        let queryObject = {
            userID: req.session.user.userID,
            orderStatus: 'Pending',
        };

        try {
            orders = await orderModel.findOrderByUserIDAndOrderStatus(queryObject, { createAt: -1 });
        } catch (err) {
            error = 'An error occurred while fetching order data';
        }
        const renderOptions = { orders, error, ...options };

        await this.renderWithDefaults(req, res, 'orderConfirmationPage', renderOptions);
    }

    async removeFromCart(req, res) {
        if (req.body._method === 'DELETE') {
            let { itemID } = req.body;
            let index = req.session.cart.findIndex(item => item.itemID === itemID);
            let itemName = req.session.cart[index].itemName;
            req.session.cart.splice(index, 1);
            await this.renderCartPage(req, res, { success: `Item ${itemName} removed from cart` });
        } else {
            await this.renderCartPage(req, res, { error: 'Invalid request!' });
        }
    }

    async renderOrderHistoryPage(req, res, options = {}) {
        const orderModel = new OrderModel();
        let orders = undefined;
        let error = undefined;

        try {
            orders = await orderModel.findOrderByUserID(req.session.user.userID, { createAt: -1 });
        } catch (err) {
            error = 'An error occurred while fetching order data';
        }
        const renderOptions = { orders, error, ...options };
        await this.renderWithDefaults(req, res, 'orderHistoryPage', renderOptions);
    }

}

module.exports = new AdminController();