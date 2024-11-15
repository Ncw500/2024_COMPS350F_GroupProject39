const mongoose = require('mongoose');
const DatabaseHandler = require('./databaseHandler'); // 引入自定義的資料庫處理模組

class AccountBalanceModel {
    
    constructor() {
        this.accountBalanceSchema = new mongoose.Schema({
            accountOwnerID: {
                type: String,
                required: true,
                unique: true
            },
            balance: {
                type: Number,
                required: true,
                default: 0
            },
            lastUpdated: {
                type: Date,
                default: Date.now
            }
        });

        if (!mongoose.models.AccountBalance) {
            this.AccountBalance = mongoose.model('AccountBalance', this.accountBalanceSchema);
        } else {
            this.AccountBalance = mongoose.models.AccountBalance; 
        }

        this.collectionName = 'accountBalances'; // 定義集合名稱
        this.db = new DatabaseHandler(); // 創建一個新的 DatabaseHandler 實例來處理資料庫操作
        
    }

    async insertAccountBalance(accountOwnerID) {
        return await this.db.insertOne(this.AccountBalance, { accountOwnerID: accountOwnerID }).catch(err => {
            throw err;
        });
    }
            
    async getAccountBalance(accountOwnerID) {
        return await this.db.findOne(this.AccountBalance, { accountOwnerID: accountOwnerID }).catch(err => {
            throw err;
        });
    }

    async updateAccountBalance(accountOwnerID, newBalance) {
        return await this.db.update(this.AccountBalance, { accountOwnerID: accountOwnerID }, "set", { balance: newBalance }).catch(err => {
            throw err;
        });
    }


}

module.exports = AccountBalanceModel;