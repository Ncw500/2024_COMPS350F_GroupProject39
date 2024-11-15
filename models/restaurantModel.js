const mongoose = require('mongoose'); // 引入 mongoose 模組，用來操作 MongoDB 資料庫
const DatabaseHandler = require('./databaseHandler'); // 引入自定義的資料庫處理模組
const { ObjectId } = mongoose.Types;


class RestaurantModel { // 定義一個名為 UserModel 的類別

    constructor() { // 構造函數，當創建 UserModel 的實例時會自動調用
        // 定義一個用戶的資料結構，包含用戶名和用戶密碼
        this.restaurantSchema = new mongoose.Schema({
            restaurantName: {
                type: String,
                required: true
            },
            menuItems: { // 陣列本身是可選的，可以保持空
                type: [
                    {
                        itemName: { type: String, required: true },
                        itemPrice: { type: Number, required: true },
                        itemDescription: { type: String, required: false },
                        itemCategory: { type: String, required: true },
                        itemPicture: {
                            filename: { type: String, required: true },
                            path: { type: String, required: true },
                            contentType: { type: String, required: true },
                        }
                    }
                ],
                default: [] // 默認為空陣列
            },
            address: {
                city: { type: String, required: true },
                street: { type: String, required: true }
            },
            owner: {
                type: {
                    ownerUserID: { type: String, required: true },
                    ownerEmail: { type: String, required: true }
                }
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        });

        // 檢查是否已經定義過 User 模型
        if (!mongoose.models.Restaurant) {
            // 如果沒有定義過，則創建新的 User 模型
            this.Restaurant = mongoose.model('Restaurant', this.restaurantSchema);
        } else {
            // 如果已經存在 User 模型，則直接使用它
            this.Restaurant = mongoose.models.Restaurant; // 使用已存在的模型
        }

        this.collectionName = 'restaurants'; // 定義集合名稱
        this.db = new DatabaseHandler(); // 創建一個新的 DatabaseHandler 實例來處理資料庫操作
    }

    // 靜態方法，用來查詢所有用戶
    async findAllRestaurant() {
        let result = await this.db.findAll(this.Restaurant).catch(err => {
            throw err;
        });
        return result;
    }

    // 靜態方法，根據用戶名稱查詢單個用戶
    async findRestaurantByRestaurantName(restaurantName) {
        let result = await this.db.findOne(this.Restaurant, { restaurantName: restaurantName }).catch(err => {
            throw err;
        });
        return result;
    }

    async findAllRestaurantByOwnerUserID(ownerUserID) {
        let result = await this.db.findMany(this.Restaurant, { "owner.ownerUserID": ownerUserID }).catch(err => {
            throw err;
        });
        return result;
    }

    async insertRestaurant(restaurantName, menuItems, address, owner) {
        let result = await this.db.insertOne(this.Restaurant, {
            restaurantName: restaurantName,
            menuItems: menuItems || [],
            address: address,
            owner: owner
        }).catch(err => {
            throw err;
        });
        return result;
    }

    async insertMenuItemByRestaurantName(restaurantName, itemName, itemPrice, itemDescription, itemCategory, itemPicture) {
        const updateObject = {
            menuItems: { // menuItems 為您要更新的數組字段
                itemName: itemName,
                itemPrice: itemPrice,
                itemDescription: itemDescription,
                itemCategory: itemCategory,
                itemPicture: {
                    filename: itemPicture.filename,
                    path: itemPicture.filePath,
                    contentType: itemPicture.contentType
                }
            }

        };
        const queryObject = { restaurantName: restaurantName };
        const updateMode = "push";
        let result = await this.db.update(this.Restaurant, queryObject, updateMode, updateObject).catch(err => {
            throw err;
        });
        return result;
    }

    async updateMenuItemByRestaurantName(restaurantName, itemName, itemPrice) {
        let result = await this.db.updateOne(this.Restaurant, { restaurantName: restaurantName, "menuItems.itemName": itemName }, {
            $set: {
                "menuItems.$.itemName": itemPrice
            }
        }).catch(err => {
            throw err;
        });
        return result;
    }

    async findMenuItemByRestaurantIDAndItemID(restaurantID, itemID) {
        let result = await this.db.findOne(this.Restaurant, { _id: restaurantID, "menuItems._id": itemID  }).catch(err => {
            throw err;
        });
        return result;
    }
}

// 將 UserModel 類別導出，以便其他模組可以使用
module.exports = RestaurantModel;