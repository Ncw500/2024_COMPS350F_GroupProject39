const RestaurantModel = require('../models/restaurantModel');

class RestaurantController {
    // 定義 renderWithDefaults 函數
    async renderWithDefaults(req, res, view, options = {}) {
        const defaults = {
            error: undefined,
            success: undefined,
            restaurantList: undefined,
        };
        
        const restaurantModel = new RestaurantModel();
        const restaurantList = await restaurantModel.findAllRestaurantByOwnerUserID(req.session.user.userID).catch(err => {
            defaults.error = 'An error occurred!';
        });
        defaults.restaurantList = restaurantList;
        if (restaurantList.length === 0 && view === 'insertMenu') {
            defaults.error = 'No restaurants found. Please add a restaurant first.';
        }

        const renderOptions = { ...defaults, ...options };
        res.render(view, renderOptions);
    }

    // 渲染頁面
    async renderRegisterRestaurant(req, res) {
        await this.renderWithDefaults(req, res, 'registerRestaurant');
    }

    // 註冊餐廳功能
    async registerRestaurant(req, res) {
        const { restaurantName, restaurantCity, restaurantStreet } = req.body;
        const restaurantModel = new RestaurantModel();
        try {
            const result = await restaurantModel.insertRestaurant(restaurantName, null, { city: restaurantCity, street: restaurantStreet }, { ownerUserID: req.session.user.userID, ownerEmail: req.session.user.userEmail });
            await this.renderWithDefaults(req, res, 'registerRestaurant', { success: "success to register" });
        } catch (err) {
            await this.renderWithDefaults(req, res, 'registerRestaurant', { error: 'An error occurred!' });
        }
    }

    async renderInsertMeun(req, res) {
        await this.renderWithDefaults(req, res, 'insertMenu');
    }

    async insertMenu(req, res) {
        const { restaurantName, menuItemName, menuItemPrice, menuItemDescription, menuItemCategory } = req.body;
        if (!req.file) {
            return this.renderWithDefaults(req, res, 'insertMenu', { error: 'File upload is required!' });
        }
        const filename = req.file.filename,
            contentType = req.file.mimetype,
            filePath = req.file.path;
        const restaurantModel = new RestaurantModel();
        try {
            const result = await restaurantModel.insertMenuItemByRestaurantName(restaurantName, menuItemName, menuItemPrice, menuItemDescription, menuItemCategory, { filename, filePath, contentType });
            await this.renderWithDefaults(req, res, 'insertMenu', { success: 'Insert success' });
        } catch (err) {
            await this.renderWithDefaults(req, res, 'insertMenu', { error: 'An error occurred!' });
        }
    }
}

module.exports = new RestaurantController();