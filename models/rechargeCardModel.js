const mongoose = require('mongoose');
const DatabaseHandler = require('./databaseHandler'); // 引入自定義的資料庫處理模組

class RechargeCardModel {
    
    constructor() {
        this.rechargeCardSchema = new mongoose.Schema({
            code: { type: String, required: true },
            status: { type: String, required: true },
            refereeID: { type: String, default: null },
            value: { type: Number, required: true },
            createTime: { type: Date, default: Date.now, required: true },
        });

        if (!mongoose.models.RechargeCard) {
            this.RechargeCard = mongoose.model('RechargeCard', this.rechargeCardSchema);
        } else {
            this.RechargeCard = mongoose.models.RechargeCard; 
        }

        this.collectionName = 'rechargeCard'; // 定義集合名稱
        this.db = new DatabaseHandler(); // 創建一個新的 DatabaseHandler 實例來處理資料庫操作
        
    }

    async createRechargeCard(rechargeCard) {
        return await this.db.insertOne(this.RechargeCard, rechargeCard).catch(err => {
            throw err;
        });
    }

    async getRechargeCard() {   
        return await this.db.findMany(this.RechargeCard, {}).catch(err => {
            throw err;
        });
    }

    async getRechargeCardByCode(code) {
        return await this.db.findOne(this.RechargeCard, { code: code }).catch(err => {
            throw err;
        });
    }

    async updateRechargeCardStatus(rechargeCardID, status, refereeID) {
        return await this.db.update(this.RechargeCard, { _id: rechargeCardID }, 'set', { status: status, refereeID: refereeID }).catch(err => {
            throw err;
        });
    }


}

module.exports = RechargeCardModel;