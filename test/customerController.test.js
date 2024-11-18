const customerController = require('../controllers/customerController'); // 調整路徑至 customerController
const RestaurantModel = require('../models/restaurantModel');
const OrderModel = require('../models/orderModel');
const AccountBalanceModel = require('../models/accountBalanceModel');
const OrderTrackingModel = require('../models/orderTrackingModel');
const RechargeCardModel = require('../models/rechargeCardModel');

jest.mock('../models/restaurantModel'); // 模擬 RestaurantModel
jest.mock('../models/orderModel'); // 模擬 OrderModel
jest.mock('../models/accountBalanceModel'); // 模擬 AccountBalanceModel
jest.mock('../models/orderTrackingModel'); // 模擬 OrderTrackingModel
jest.mock('../models/rechargeCardModel'); // 模擬 RechargeCardModel

describe('customerController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            session: {
                user: { userID: 'testUserID' },
                cart: []
            },
            body: {}
        };
        res = {
            render: jest.fn(),
            redirect: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks(); // 清除所有模擬
    });

    describe('renderWithDefaults', () => {
        it('should render the view with default options', async () => {
            await customerController.renderWithDefaults(req, res, 'testView', { additionalOption: 'test' });
            expect(res.render).toHaveBeenCalledWith('testView', expect.objectContaining({
                user: req.session.user,
                restaurantsList: [],
                cart: [],
                itemTotalPrice: 0,
                orders: [],
                accountBalance: 0,
                menuItemList: [],
                orderTracking: [],
                updatedRestaurantID: ''
            }));
        });
    });

    describe('renderMenuPage', () => {
        it('should render menu page with restaurants list', async () => {
            // 模擬 findAllRestaurant 方法返回的數據
            RestaurantModel.mockImplementation(() => {
                return {
                    findAllRestaurant: jest.fn().mockResolvedValue([{ name: 'Test Restaurant' }])
                };
            });

            await customerController.renderMenuPage(req, res);
            expect(res.render).toHaveBeenCalledWith('menuPage', expect.objectContaining({
                restaurantsList: [{ name: 'Test Restaurant' }],
                error: undefined
            }));
        });

        it('should handle errors when fetching restaurants', async () => {
            RestaurantModel.mockImplementation(() => {
                return {
                    findAllRestaurant: jest.fn().mockRejectedValue(new Error('Database error'))
                };
            });

            await customerController.renderMenuPage(req, res);
            expect(res.render).toHaveBeenCalledWith('menuPage', expect.objectContaining({
                error: 'An error occurred while fetching restaurant data'
            }));
        });
    });

    describe('addToCart', () => {
        it('should add item to cart', async () => {
            req.body = {
                itemID: 'item1',
                itemName: 'Test Item',
                itemPrice: 10,
                itemQuantity: 2,
                restaurantID: 'restaurant1',
                itemPicture: 'item.jpg'
            };

            await customerController.addToCart(req, res);
            expect(req.session.cart).toHaveLength(1);
            expect(req.session.cart[0]).toEqual({
                restaurantID: 'restaurant1',
                itemID: 'item1',
                itemName: 'Test Item',
                itemPrice: 10,
                itemQuantity: 2,
                itemPicture: 'item.jpg'
            });
            expect(res.render).toHaveBeenCalledWith('menuPage', expect.objectContaining({
                success: 'Item Test Item added to cart, current quantity : 2'
            }));
        });

        it('should update item quantity if already in cart', async () => {
            req.session.cart.push({
                restaurantID: 'restaurant1',
                itemID: 'item1',
                itemName: 'Test Item',
                itemPrice: 10,
                itemQuantity: 1,
                itemPicture: 'item.jpg'
            });

            req.body = {
                itemID: 'item1',
                itemName: 'Test Item',
                itemPrice: 10,
                itemQuantity: 2,
                restaurantID: 'restaurant1',
                itemPicture: 'item.jpg'
            };

            await customerController.addToCart(req, res);
            expect(req.session.cart[0].itemQuantity).toBe(3); // 更新數量
            expect(res.render).toHaveBeenCalledWith('menuPage', expect.objectContaining({
                success: 'Item Test Item added to cart, current quantity : 3'
            }));
        });
    });

    describe('renderCartPage', () => {
        it('should redirect to login if user is not logged in', async () => {
            req.session.user = undefined; // 模擬未登錄狀態
            await customerController.renderCartPage(req, res);
            expect(res.redirect).toHaveBeenCalledWith('/user/loginPage');
        });

        it('should render cart page with items and total price', async () => {
            req.session.cart = [{
                itemID: 'item1',
                itemName: 'Test Item',
                itemPrice: 10,
                itemQuantity: 2
            }];

            AccountBalanceModel.mockImplementation(() => {
                return {
                    getAccountBalance: jest.fn().mockResolvedValue({ balance: 100 })
                };
            });

            await customerController.renderCartPage(req, res);
            expect(res.render).toHaveBeenCalledWith('cartPage', expect.objectContaining({
                cart: req.session.cart,
                itemTotalPrice: 20, // 10 * 2
                accountBalance: { balance: 100 }
            }));
        });
    });

    describe('renderCheckoutPage', () => {
        it('should render cart page with error if cart is empty', async () => {
            await customerController.renderCheckoutPage(req, res);
            expect(res.render).toHaveBeenCalledWith('cartPage', expect.objectContaining({
                error: 'Cart is empty'
            }));
        });

        it('should render checkout page with total price', async () => {
            req.session.cart = [{
                itemID: 'item1',
                itemName: 'Test Item',
                itemPrice: 10,
                itemQuantity: 2
            }];
            req.body = {
                itemID: ['item1'],
                itemName: ['Test Item'],
                itemPrice: [10],
                itemQuantity: [2]
            };

            AccountBalanceModel.mockImplementation(() => {
                return {
                    getAccountBalance: jest.fn().mockResolvedValue({ balance: 100 })
                };
            });

            await customerController.renderCheckoutPage(req, res);
            expect(res.render).toHaveBeenCalledWith('checkoutPage', expect.objectContaining({
                cart: req.session.cart,
                itemTotalPrice: 20, // 10 * 2
                accountBalance: { balance: 100 }
            }));
        });
    });

    describe('payment', () => {
        it('should handle insufficient balance', async () => {
            req.session.cart = [{
                itemID: 'item1',
                itemName: 'Test Item',
                itemPrice: 10,
                itemQuantity: 2
            }];
            req.body = {
                paymentMethod: 'balance',
                payeeFirstName: 'John',
                payeeLastName: 'Doe',
                address: '123 Street',
                region: 'Region',
                country: 'Country',
                phone: '123456789',
                deliveryMethod: 'Delivery'
            };
    
            // 模擬 getItemPriceByID 返回的價格
            customerController.getItemPriceByID = jest.fn().mockResolvedValue(10); // 假設 item1 的價格是 10
    
            // 模擬帳戶餘額不足的情況
            AccountBalanceModel.mockImplementation(() => {
                return {
                    getAccountBalance: jest.fn().mockResolvedValue({ balance: 5 }) // Insufficient balance
                };
            });
    
            await customerController.payment(req, res);
            expect(res.render).toHaveBeenCalledWith('cartPage', expect.objectContaining({
                error: 'Insufficient account balance'
            }));
        });
    
        it('should process payment successfully', async () => {
            req.session.cart = [{
                itemID: 'item1',
                itemName: 'Test Item',
                itemPrice: 10,
                itemQuantity: 2
            }];
            req.body = {
                paymentMethod: 'balance',
                payeeFirstName: 'John',
                payeeLastName: 'Doe',
                address: '123 Street',
                region: 'Region',
                country: 'Country',
                phone: '123456789',
                deliveryMethod: 'Delivery'
            };
    
            // 模擬 getItemPriceByID 返回的價格
            customerController.getItemPriceByID = jest.fn().mockResolvedValue(10); // 假設 item1 的價格是 10
    
            // 模擬帳戶餘額充足的情況
            AccountBalanceModel.mockImplementation(() => {
                return {
                    getAccountBalance: jest.fn().mockResolvedValue({ balance: 100 }),
                    updateAccountBalance: jest.fn().mockResolvedValue(true)
                };
            });
    
            // 模擬 OrderModel 的 createOrder 方法
            OrderModel.mockImplementation(() => {
                return {
                    createOrder: jest.fn().mockResolvedValue({ id: 'order1', orderStatus: 'Pending', createAt: new Date() })
                };
            });
    
            await customerController.payment(req, res);
            expect(res.render).toHaveBeenCalledWith('cartPage', expect.objectContaining({
                success: 'Order created, you can check your order detail from order tracking page'
            }));
        });
    });
    

    describe('removeFromCart', () => {
        it('should remove item from cart', async () => {
            req.session.cart = [{
                itemID: 'item1',
                itemName: 'Test Item',
                itemPrice: 10,
                itemQuantity: 2
            }];
            req.body = { _method: 'DELETE', itemID: 'item1' };

            await customerController.removeFromCart(req, res);
            expect(req.session.cart).toHaveLength(0); // 確保購物車為空
            expect(res.render).toHaveBeenCalledWith('cartPage', expect.objectContaining({
                success: 'Item Test Item removed from cart'
            }));
        });

        it('should handle invalid request method', async () => {
            req.body = { _method: 'GET' }; // 非 DELETE 方法

            await customerController.removeFromCart(req, res);
            expect(req.session.cart).toHaveLength(0); // 確保購物車未變
            expect(res.render).toHaveBeenCalledWith('cartPage', expect.objectContaining({
                error: 'Invalid request!'
            }));
        });
    });

    // 其他方法的測試可以類似地添加
});
