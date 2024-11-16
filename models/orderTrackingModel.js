const mongoose = require('mongoose');
const DatabaseHandler = require('./databaseHandler'); // 引入自定義的資料庫處理模組

class OrderTrackingModel {
    
    constructor() {
        this.orderTrackingSchema = new mongoose.Schema({
            orderID: { type: mongoose.Schema.ObjectId, required: true },
            customerID: { type: String, required: true },
            orderStatus: {
                type: [{
                    status: { type: String, required: true },
                    updateTime: { type: Date, default: Date.now, required: true }
                }]
            },
        });

        if (!mongoose.models.OrderTracking) {
            this.OrderTracking = mongoose.model('OrderTracking', this.orderTrackingSchema);
        } else {
            this.OrderTracking = mongoose.models.OrderTracking; 
        }

        this.collectionName = 'orderTracking'; // 定義集合名稱
        this.db = new DatabaseHandler(); // 創建一個新的 DatabaseHandler 實例來處理資料庫操作
        
    }

    async createOrderTracking(orderTracking) {
        return await this.db.insertOne(this.OrderTracking, orderTracking).catch(err => {
            throw err;
        });
    }

    async getOrderTaccking(orderID) {
        return await this.db.findMany(this.OrderTracking, { orderID: orderID }).catch(err => {
            throw err;
        });
    }


}

module.exports = OrderTrackingModel;