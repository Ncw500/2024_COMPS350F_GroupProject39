const mongoose = require('mongoose'); // 引入 mongoose 模組，用來操作 MongoDB 資料庫
const DatabaseHandler = require('./databaseHandler'); // 引入自定義的資料庫處理模組

class UserModel { // 定義一個名為 UserModel 的類別

    constructor() { // 構造函數，當創建 UserModel 的實例時會自動調用
        // 定義一個用戶的資料結構，包含用戶名和用戶密碼
        this.userSchema = new mongoose.Schema({
            userID: { type: String, required: true, unique: true }, // userID 必须是字符串类型且必填
            userPassword: { type: String, required: true },
            userEmail: { type: String, required: true, unique: true },
            userRole: { type: String, required: true },
            personalInfo: {
                type: {
                    firstName: { type: String }, // 直接定义字段，而不是嵌套在 type 中
                    lastName: { type: String },
                    phone: { type: String },
                    address: { type: String },
                    region: { type: String },
                    country: { type: String },
                    aboutMe: { type: String }
                },
                default: {} // 默认为空对象
            },
            createAt: { type: Date, default: Date.now }
        });

        // 檢查是否已經定義過 User 模型
        if (!mongoose.models.User) {
            // 如果沒有定義過，則創建新的 User 模型
            this.User = mongoose.model('User', this.userSchema);
        } else {
            // 如果已經存在 User 模型，則直接使用它
            this.User = mongoose.models.User; // 使用已存在的模型
        }

        this.collectionName = 'users'; // 定義集合名稱
        this.db = new DatabaseHandler(); // 創建一個新的 DatabaseHandler 實例來處理資料庫操作
    }


    async findAllUser() {
        let result = await this.db.findAll(this.User).catch(err => {
            throw err;
        });
        return result;
    }

    async findUserByUserID(userID) {
        let result = await this.db.findOne(this.User, { userID: userID }).catch(err => {
            throw err;
        });
        return result;
    }

    async insertUser(userID, userPassword, userEmail, userRole) {
        return await this.db.insertOne(this.User, {
            userID: userID,
            userPassword: userPassword,
            userEmail: userEmail,
            userRole: userRole
        });
    }

    async deleteUserByUserID(userID) {
        let result = await this.db.delete(this.User, { userID: userID }, "one").catch(err => {
            throw err;
        });
        return result;
    }

    async authenticate(userID, userPassword) {
        let user = new UserModel();
        let result = await user.findUserByUserID(userID);
        if (result && result.userPassword === userPassword) {
            return { isSuccess: true, user: result };
        }
        return { isSuccess: false, user: result };
    }   

    async updateUserByUserID(userID, updateData) {
        let result = await this.db.update(this.User, { userID: userID }, "set", updateData).catch(err => {
            throw err;
        });
        return result;
    }


}

// 將 UserModel 類別導出，以便其他模組可以使用
module.exports = UserModel;